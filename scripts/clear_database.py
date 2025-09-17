#!/usr/bin/env python3
"""
Database Cleanup Script for FlowTester

This script deletes all data from the local PostgreSQL database.
It truncates all tables while preserving the schema structure.

Usage:
    python scripts/clear_database.py

Warning: This will permanently delete ALL data in the database!
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from urllib.parse import urlparse
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database configuration
DB_URL = 'postgres://flow-tester-user:flow-tester-password@127.0.0.1:5432/flow-tester'

def get_db_connection():
    """Establish database connection"""
    try:
        parsed_url = urlparse(DB_URL)
        connection = psycopg2.connect(
            host=parsed_url.hostname,
            port=parsed_url.port,
            database=parsed_url.path[1:],  # Remove leading slash
            user=parsed_url.username,
            password=parsed_url.password
        )
        logger.info("Successfully connected to PostgreSQL database")
        return connection
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        return None

def get_all_tables(connection):
    """Get list of all tables in the database (excluding system tables)"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                AND tablename NOT LIKE 'pg_%'
                AND tablename NOT LIKE 'sql_%'
                ORDER BY tablename;
            """)
            tables = [row[0] for row in cursor.fetchall()]
            logger.info(f"Found {len(tables)} tables: {', '.join(tables)}")
            return tables
    except Exception as e:
        logger.error(f"Error getting table list: {e}")
        return []

def disable_foreign_key_checks(connection):
    """Disable foreign key constraints temporarily"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SET session_replication_role = replica;")
            connection.commit()
            logger.info("Disabled foreign key constraints")
            return True
    except Exception as e:
        logger.error(f"Error disabling foreign key constraints: {e}")
        return False

def enable_foreign_key_checks(connection):
    """Re-enable foreign key constraints"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SET session_replication_role = DEFAULT;")
            connection.commit()
            logger.info("Re-enabled foreign key constraints")
            return True
    except Exception as e:
        logger.error(f"Error re-enabling foreign key constraints: {e}")
        return False

def truncate_tables(connection, tables):
    """Truncate all tables"""
    try:
        with connection.cursor() as cursor:
            for table in tables:
                logger.info(f"Truncating table: {table}")
                # Use TRUNCATE CASCADE to handle any remaining foreign key issues
                cursor.execute(sql.SQL("TRUNCATE TABLE {} RESTART IDENTITY CASCADE").format(
                    sql.Identifier(table)
                ))
            
            connection.commit()
            logger.info(f"Successfully truncated {len(tables)} tables")
            return True
    except Exception as e:
        logger.error(f"Error truncating tables: {e}")
        connection.rollback()
        return False

def reset_sequences(connection):
    """Reset all sequences to start from 1"""
    try:
        with connection.cursor() as cursor:
            # Get all sequences
            cursor.execute("""
                SELECT sequence_name 
                FROM information_schema.sequences 
                WHERE sequence_schema = 'public';
            """)
            sequences = [row[0] for row in cursor.fetchall()]
            
            for sequence in sequences:
                logger.info(f"Resetting sequence: {sequence}")
                cursor.execute(sql.SQL("ALTER SEQUENCE {} RESTART WITH 1").format(
                    sql.Identifier(sequence)
                ))
            
            connection.commit()
            logger.info(f"Successfully reset {len(sequences)} sequences")
            return True
    except Exception as e:
        logger.error(f"Error resetting sequences: {e}")
        connection.rollback()
        return False

def confirm_deletion():
    """Ask for user confirmation before proceeding"""
    print("\n" + "="*60)
    print("⚠️  WARNING: DATABASE CLEANUP SCRIPT")
    print("="*60)
    print("This script will PERMANENTLY DELETE ALL DATA from your local database!")
    print("The following will happen:")
    print("  • All table data will be deleted")
    print("  • Auto-increment sequences will be reset")
    print("  • Database schema will remain intact")
    print("\nDatabase: flow-tester (localhost:5432)")
    print("="*60)
    
    response = input("\nAre you sure you want to proceed? Type 'YES' to confirm: ")
    return response.strip() == 'YES'

def main():
    """Main function"""
    print("FlowTester Database Cleanup Script")
    print("-" * 40)
    
    # Confirm with user
    if not confirm_deletion():
        print("Operation cancelled by user.")
        sys.exit(0)
    
    # Connect to database
    connection = get_db_connection()
    if not connection:
        print("Failed to connect to database. Exiting.")
        sys.exit(1)
    
    try:
        # Get all tables
        tables = get_all_tables(connection)
        if not tables:
            print("No tables found or error getting table list.")
            return
        
        # Disable foreign key constraints
        if not disable_foreign_key_checks(connection):
            print("Failed to disable foreign key constraints.")
            return
        
        # Truncate all tables
        if not truncate_tables(connection, tables):
            print("Failed to truncate tables.")
            return
        
        # Reset sequences
        if not reset_sequences(connection):
            print("Failed to reset sequences.")
            return
        
        # Re-enable foreign key constraints
        if not enable_foreign_key_checks(connection):
            print("Failed to re-enable foreign key constraints.")
            return
        
        print("\n" + "="*60)
        print("✅ DATABASE CLEANUP COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"• Truncated {len(tables)} tables")
        print("• Reset all auto-increment sequences")
        print("• Re-enabled foreign key constraints")
        print("• Database schema preserved")
        print("\nYour database is now clean and ready for fresh data.")
        
    except Exception as e:
        logger.error(f"Unexpected error during cleanup: {e}")
        print(f"Error during cleanup: {e}")
        sys.exit(1)
    
    finally:
        if connection:
            connection.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    main()