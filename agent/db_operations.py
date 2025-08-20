import os
import psycopg2
from psycopg2 import sql
from urllib.parse import urlparse
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_URL='postgres://flow-tester-user:flow-tester-password@127.0.0.1:5432/flow-tester'

class TestRunDB:
    def __init__(self):
        self.connection = None
        self.db_url = DB_URL
        
        if not self.db_url:
            raise ValueError("DB_URL environment variable is required")
    
    def connect(self):
        """Establish database connection"""
        try:
            # Parse the database URL
            parsed_url = urlparse(self.db_url)
            
            self.connection = psycopg2.connect(
                host=parsed_url.hostname,
                port=parsed_url.port,
                database=parsed_url.path[1:],  # Remove leading slash
                user=parsed_url.username,
                password=parsed_url.password
            )
            logger.info("Successfully connected to PostgreSQL database")
            return True
        except Exception as e:
            logger.error(f"Error connecting to database: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def update_test_run_status(self, test_run_slug, status):
        """
        Update the status of a test run by its slug
        
        Args:
            test_run_slug (str): The slug identifier of the test run
            status (str): The new status ('pending', 'running', 'failed', 'succeeded')
        
        Returns:
            bool: True if update was successful, False otherwise
        """
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            with self.connection.cursor() as cursor:
                # Update the status and updated_at timestamp
                update_query = sql.SQL("""
                    UPDATE tests_runs 
                    SET status = %s, updated_at = CURRENT_TIMESTAMP 
                    WHERE slug = %s AND deleted_at IS NULL
                """)
                
                cursor.execute(update_query, (status, test_run_slug))
                
                # Check if any row was updated
                if cursor.rowcount == 0:
                    logger.warning(f"No test run found with slug: {test_run_slug}")
                    return False
                
                # Commit the transaction
                self.connection.commit()
                logger.info(f"Successfully updated test run {test_run_slug} status to '{status}'")
                return True
                
        except Exception as e:
            logger.error(f"Error updating test run status: {e}")
            if self.connection:
                self.connection.rollback()
            return False
    
    def get_test_run_status(self, test_run_slug):
        """
        Get the current status of a test run by its slug
        
        Args:
            test_run_slug (str): The slug identifier of the test run
        
        Returns:
            str or None: The current status if found, None otherwise
        """
        if not self.connection:
            if not self.connect():
                return None
        
        try:
            with self.connection.cursor() as cursor:
                select_query = sql.SQL("""
                    SELECT status FROM tests_runs 
                    WHERE slug = %s AND deleted_at IS NULL
                """)
                
                cursor.execute(select_query, (test_run_slug,))
                result = cursor.fetchone()
                
                if result:
                    return result[0]
                else:
                    logger.warning(f"No test run found with slug: {test_run_slug}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting test run status: {e}")
            return None

def update_test_run_to_running(test_run_slug):
    """
    Convenience function to update a test run status to 'running'
    
    Args:
        test_run_slug (str): The slug identifier of the test run
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    db = TestRunDB()
    try:
        return db.update_test_run_status(test_run_slug, 'running')
    finally:
        db.disconnect()

def update_test_run_to_failed(test_run_slug):
    """
    Convenience function to update a test run status to 'failed'
    
    Args:
        test_run_slug (str): The slug identifier of the test run
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    db = TestRunDB()
    try:
        return db.update_test_run_status(test_run_slug, 'failed')
    finally:
        db.disconnect()

def update_test_run_to_succeeded(test_run_slug):
    """
    Convenience function to update a test run status to 'succeeded'
    
    Args:
        test_run_slug (str): The slug identifier of the test run
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    db = TestRunDB()
    try:
        return db.update_test_run_status(test_run_slug, 'succeeded')
    finally:
        db.disconnect()