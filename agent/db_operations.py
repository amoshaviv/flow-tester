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

class AnalysisDB:
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
    
    def update_analysis_status(self, analysis_slug, status):
        """
        Update the status of an analysis by its slug
        
        Args:
            analysis_slug (str): The slug identifier of the analysis
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
                    UPDATE organizations_analyses 
                    SET status = %s, updated_at = CURRENT_TIMESTAMP 
                    WHERE slug = %s AND deleted_at IS NULL
                """)
                
                cursor.execute(update_query, (status, analysis_slug))
                
                # Check if any row was updated
                if cursor.rowcount == 0:
                    logger.warning(f"No analysis found with slug: {analysis_slug}")
                    return False
                
                # Commit the transaction
                self.connection.commit()
                logger.info(f"Successfully updated analysis {analysis_slug} status to '{status}'")
                return True
                
        except Exception as e:
            logger.error(f"Error updating analysis status: {e}")
            if self.connection:
                self.connection.rollback()
            return False
    
    def get_analysis_status(self, analysis_slug):
        """
        Get the current status of an analysis by its slug
        
        Args:
            analysis_slug (str): The slug identifier of the analysis
        
        Returns:
            str or None: The current status if found, None otherwise
        """
        if not self.connection:
            if not self.connect():
                return None
        
        try:
            with self.connection.cursor() as cursor:
                select_query = sql.SQL("""
                    SELECT status FROM organizations_analyses 
                    WHERE slug = %s AND deleted_at IS NULL
                """)
                
                cursor.execute(select_query, (analysis_slug,))
                result = cursor.fetchone()
                
                if result:
                    return result[0]
                else:
                    logger.warning(f"No analysis found with slug: {analysis_slug}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting analysis status: {e}")
            return None
    
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

def create_new_analysis(organization_id, analysis_url):
    db = TestRunDB()
    try:
        if not db.connect():
            return None
        
        with db.connection.cursor() as cursor:
            # Update the status and updated_at timestamp
            insert_query = sql.SQL("""
                Insert Into organizations_analyses (organization_id, analysis_url, created_at, updated_at)
                Values(%s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """)
            
            cursor.execute(insert_query, (organization_id, analysis_url))
            
            # Check if any row was updated
            if cursor.rowcount == 0:
                logger.warning(f"Error creating analysis for organization id: {organization_id}")
                return False
            
            # Commit the transaction
            db.connection.commit()
            logger.info(f"Successfully created new analysis for organization id: {organization_id}")
            return True
                
    except Exception as e:
        logger.error(f"Error creating new analysis: {e}")
        return None
    finally:
        db.disconnect()

def update_analysis_to_running(analysis_slug):
    """
    Convenience function to update an analysis status to 'running'
    
    Args:
        analysis_slug (str): The slug identifier of the analysis
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    db = AnalysisDB()
    try:
        return db.update_analysis_status(analysis_slug, 'running')
    finally:
        db.disconnect()

def update_analysis_to_failed(analysis_slug):
    """
    Convenience function to update an analysis status to 'failed'
    
    Args:
        analysis_slug (str): The slug identifier of the analysis
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    db = AnalysisDB()
    try:
        return db.update_analysis_status(analysis_slug, 'failed')
    finally:
        db.disconnect()

def update_analysis_to_succeeded(analysis_slug):
    """
    Convenience function to update an analysis status to 'succeeded'
    
    Args:
        analysis_slug (str): The slug identifier of the analysis
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    db = AnalysisDB()
    try:
        return db.update_analysis_status(analysis_slug, 'succeeded')
    finally:
        db.disconnect()

def update_analysis_to_pending(analysis_slug):
    """
    Convenience function to update an analysis status to 'pending'
    
    Args:
        analysis_slug (str): The slug identifier of the analysis
    
    Returns:
        bool: True if update was successful, False otherwise
    """
    db = AnalysisDB()
    try:
        return db.update_analysis_status(analysis_slug, 'pending')
    finally:
        db.disconnect()

def get_analysis_status(analysis_slug):
    """
    Convenience function to get the current status of an analysis
    
    Args:
        analysis_slug (str): The slug identifier of the analysis
    
    Returns:
        str or None: The current status if found, None otherwise
    """
    db = AnalysisDB()
    try:
        return db.get_analysis_status(analysis_slug)
    finally:
        db.disconnect()
        
def get_latest_successful_run_by_version(test_version_slug):
    """
    Get the latest successful test run for a given test version slug
    
    Args:
        test_version_slug (str): The slug identifier of the test version
    
    Returns:
        dict or None: Test run details if found, None otherwise
    """
    db = TestRunDB()
    try:
        if not db.connect():
            return None
        
        with db.connection.cursor() as cursor:
            # Query to find the latest successful run for the given version
            # Join with tests_versions table to match by version slug
            select_query = sql.SQL("""
                SELECT 
                    tr.slug, 
                    tr.results_url,
                    tr.model_slug,
                    tr.model_provider,
                    tr.created_at,
                    tr.updated_at
                FROM tests_runs tr
                JOIN tests_versions tv ON tr.version_id = tv.id
                WHERE tv.slug = %s 
                    AND tr.status = 'succeeded' 
                    AND tr.deleted_at IS NULL 
                    AND tv.deleted_at IS NULL
                ORDER BY tr.updated_at DESC
                LIMIT 1
            """)
            
            cursor.execute(select_query, (test_version_slug,))
            result = cursor.fetchone()
            
            if result:
                return {
                    'slug': result[0],
                    'results_url': result[1],
                    'model_slug': result[2],
                    'model_provider': result[3],
                    'created_at': result[4],
                    'updated_at': result[5]
                }
            else:
                logger.info(f"No successful test run found for version: {test_version_slug}")
                return None
                
    except Exception as e:
        logger.error(f"Error getting latest successful run: {e}")
        return None
    finally:
        db.disconnect()