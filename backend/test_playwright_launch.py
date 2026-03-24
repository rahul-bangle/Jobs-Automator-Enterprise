import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch()
            print("Successfully launched Chromium!")
            await browser.close()
        except Exception as e:
            print(f"Failed to launch Chromium: {e}")

if __name__ == "__main__":
    asyncio.run(run())
