import sqlite3
import os

db_path = 'job_automator.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    print("--- JOBS TABLE ---")
    cur.execute("SELECT job_title, company_name, relevance_score, fit_summary FROM job")
    jobs = cur.fetchall()
    for j in jobs:
        print(f"Job: {j[0]} @ {j[1]} | Score: {j[2]}%")
        print(f"Summary: {j[3][:100]}...")
    
    print("\n--- CAMPAIGNS TABLE ---")
    cur.execute("SELECT target_role, tech_stack FROM campaign")
    campaigns = cur.fetchall()
    for c in campaigns:
        print(f"Role: {c[0]} | Tech: {c[1]}")
    
    conn.close()
