import sqlite3
import os

db_path = r'c:\Users\rahul\OneDrive\Desktop\Anti_Gravity_Workspace\job automatic appllications\backend\job_automator.db'
if not os.path.exists(db_path):
    print(f"ERROR: DB NOT FOUND AT {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT id, company_name, job_title FROM job LIMIT 3")
rows = cursor.fetchall()
for r in rows:
    print(f"ID: {r[0]} | COMPANY: {r[1]} | TITLE: {r[2]}")
conn.close()
