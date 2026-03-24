from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.db import get_session
from app.models.base import Job, ImportBatch
import csv
import io
import openpyxl
from typing import List

router = APIRouter()


def _parse_row(row: dict) -> dict | None:
    """Normalize flexible CSV/XLSX column names to standard fields."""
    company = (
        row.get("Company") or row.get("company") or
        row.get("company_name") or row.get("Company Name")
    )
    title = (
        row.get("Title") or row.get("title") or
        row.get("job_title") or row.get("Job Title")
    )
    url = (
        row.get("URL") or row.get("url") or
        row.get("source_url") or row.get("Job URL") or row.get("Link")
    )
    location = (
        row.get("Location") or row.get("location") or
        row.get("City") or row.get("city")
    )

    if not all([company, title, url]):
        return None  # Reject incomplete rows

    return {
        "company_name": str(company).strip(),
        "job_title": str(title).strip(),
        "source_url": str(url).strip(),
        "location": str(location).strip() if location else "Remote / TBD"
    }


@router.post("/csv")
async def import_csv(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session)
):
    """Import jobs from a CSV file. Accepts flexible column names."""
    content = await file.read()
    decoded = content.decode("utf-8-sig")  # Handle BOM-encoded CSVs
    reader = csv.DictReader(io.StringIO(decoded))

    batch = ImportBatch(source_type="CSV", file_name=file.filename)
    session.add(batch)
    await session.flush()

    accepted, skipped = [], 0

    for raw_row in reader:
        parsed = _parse_row(dict(raw_row))
        if not parsed:
            skipped += 1
            continue

        job_id = Job.generate_id(parsed["company_name"], parsed["job_title"], parsed["location"])
        existing = await session.get(Job, job_id)
        if existing:
            skipped += 1
            continue

        job = Job(id=job_id, queue_status="review", **parsed)
        session.add(job)
        accepted.append(job_id)

    batch.total_rows = len(accepted) + skipped
    batch.accepted_rows = len(accepted)
    batch.rejected_rows = skipped
    await session.commit()

    return {
        "message": f"Imported {len(accepted)} jobs",
        "batch_id": batch.id,
        "accepted": len(accepted),
        "skipped": skipped
    }


@router.post("/xlsx")
async def import_xlsx(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session)
):
    """Import jobs from an XLSX file."""
    content = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(content))
    ws = wb.active

    headers = [str(cell.value).strip() for cell in ws[1]]
    batch = ImportBatch(source_type="XLSX", file_name=file.filename)
    session.add(batch)
    await session.flush()

    accepted, skipped = [], 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        raw_row = dict(zip(headers, [str(v) if v is not None else "" for v in row]))
        parsed = _parse_row(raw_row)
        if not parsed:
            skipped += 1
            continue

        job_id = Job.generate_id(parsed["company_name"], parsed["job_title"], parsed["location"])
        existing = await session.get(Job, job_id)
        if existing:
            skipped += 1
            continue

        job = Job(id=job_id, queue_status="review", **parsed)
        session.add(job)
        accepted.append(job_id)

    batch.total_rows = len(accepted) + skipped
    batch.accepted_rows = len(accepted)
    batch.rejected_rows = skipped
    await session.commit()

    return {
        "message": f"Imported {len(accepted)} jobs",
        "batch_id": batch.id,
        "accepted": len(accepted),
        "skipped": skipped
    }


@router.post("/urls")
async def import_urls(
    urls: List[str],
    session: AsyncSession = Depends(get_session)
):
    """Add a batch of URLs to the processing queue."""
    batch = ImportBatch(source_type="URL_BATCH", total_rows=len(urls))
    session.add(batch)
    await session.commit()

    # TODO: Trigger Celery task to scrape each URL
    return {
        "message": f"{len(urls)} URLs added to processing queue",
        "batch_id": batch.id
    }
