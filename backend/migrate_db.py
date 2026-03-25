import sqlite3
import os

db_path = "c:/Users/rahul/OneDrive/Desktop/Anti_Gravity_Workspace/job automatic appllications/backend/job_automator.db"

def migrate():
    if not os.path.exists(db_path):
        print("DB not found")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current columns
        cursor.execute("PRAGMA table_info(job)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        if 'site' not in columns:
            print("Adding 'site' column to 'job' table...")
            cursor.execute("ALTER TABLE job ADD COLUMN site TEXT")
            print("'site' column added.")
        else:
            print("'site' column already exists.")

        if 'salary_extracted' not in columns:
            print("Adding 'salary_extracted' column to 'job' table...")
            cursor.execute("ALTER TABLE job ADD COLUMN salary_extracted TEXT")
            print("'salary_extracted' column added.")
            
        conn.commit()
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
