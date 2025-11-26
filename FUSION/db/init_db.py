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
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Read and execute schema
        with open(str(schema_path), 'r') as f:
            schema = f.read()
            cursor.executescript(schema)
        
        conn.commit()
        conn.close()
        
        print(f"Database initialized successfully: {db_path}")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

def main():
    """Main entry point for uv script"""
    db_path = sys.argv[1] if len(sys.argv) > 1 else "fusion.db"
    init_database(db_path)


if __name__ == "__main__":
    main()


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
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Read and execute schema
        with open(str(schema_path), 'r') as f:
            schema = f.read()
            cursor.executescript(schema)
        
        conn.commit()
        conn.close()
        
        print(f"Database initialized successfully: {db_path}")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

def main():
    """Main entry point for uv script"""
    db_path = sys.argv[1] if len(sys.argv) > 1 else "fusion.db"
    init_database(db_path)


if __name__ == "__main__":
    main()
