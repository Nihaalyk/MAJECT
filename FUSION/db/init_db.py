"""
Initialize FUSION database
Run this script to create the database schema
"""

import sqlite3
import os
import sys
from pathlib import Path

def init_database(db_path: str = "fusion.db"):
    """Initialize the database with schema"""
    try:
        # Get the directory of this file
        current_dir = Path(__file__).parent
        schema_path = current_dir / "schema.sql"
        
        if not schema_path.exists():
            print(f"Error: Schema file not found at {schema_path}")
            return False
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if tables already exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
        tables_exist = cursor.fetchone() is not None
        
        if tables_exist:
            print(f"Database tables already exist in {db_path}")
            print("Recreating tables...")
            # Drop existing tables in reverse order of dependencies
            cursor.execute("DROP TABLE IF EXISTS aggregated_metrics")
            cursor.execute("DROP TABLE IF EXISTS unified_metrics")
            cursor.execute("DROP TABLE IF EXISTS audio_metrics")
            cursor.execute("DROP TABLE IF EXISTS video_metrics")
            cursor.execute("DROP TABLE IF EXISTS sessions")
            conn.commit()
        
        # Read and execute schema
        with open(str(schema_path), 'r') as f:
            schema = f.read()
            cursor.executescript(schema)
        
        conn.commit()
        
        # Verify tables were created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Created tables: {', '.join(tables)}")
        
        conn.close()
        
        print(f"Database initialized successfully: {db_path}")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main entry point for uv script"""
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    else:
        # Default to fusion.db in the FUSION directory (parent of db/)
        current_dir = Path(__file__).parent
        fusion_dir = current_dir.parent
        db_path = str(fusion_dir / "fusion.db")
    
    init_database(db_path)


if __name__ == "__main__":
    main()

