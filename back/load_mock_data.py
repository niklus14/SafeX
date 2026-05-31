"""
load_mock_data.py — Load mock data from SQL file into SQLite database
Run: cd back && python load_mock_data.py
"""
import sqlite3
import os

DB_PATH = "openwave.db"
SQL_FILE = "mock_data.sql"

def load_mock_data():
    """Load mock data from SQL file into SQLite database"""
    if not os.path.exists(SQL_FILE):
        print(f"Error: {SQL_FILE} not found")
        return False
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Read SQL file
    with open(SQL_FILE, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Execute SQL script
    try:
        cursor.executescript(sql_script)
        conn.commit()
        print("Mock data loaded successfully!")
        
        # Print statistics
        cursor.execute("SELECT COUNT(*) FROM organization")
        org_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM issue")
        issue_count = cursor.fetchone()[0]
        
        print(f"Organizations: {org_count}")
        print(f"Issues: {issue_count}")
        
        return True
    except Exception as e:
        print(f"Error loading data: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    load_mock_data()
