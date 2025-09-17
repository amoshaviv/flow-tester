from browser_use import Agent, ChatOpenAI, ChatGoogle, ChatAnthropic, Browser
from dotenv import load_dotenv
from boto3 import client
import os
import json
import logging
from db_operations import get_latest_successful_run_by_version

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


save_video_path = os.path.dirname(os.path.abspath(__file__)) + '/video'
print(save_video_path)
browser = Browser(
    window_size={'width': 1280, 'height': 800},
    record_video_dir=save_video_path
)

# Initialize S3 client
s3_client = client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)

def getLLM(task):
    modelProvider = task["modelProvider"]
    modelSlug = task["modelSlug"]
    
    if modelProvider.lower() == "openai":
        return ChatOpenAI(model=modelSlug)
    elif modelProvider.lower() == "google":
        return ChatGoogle(model=modelSlug)
    elif modelProvider.lower() == "anthropic":
        return ChatAnthropic(model=modelSlug)
    else:
        raise ValueError(f"Unsupported model provider: {modelProvider}")


def load_json_from_s3(test_run_slug):
    """
    Load the JSON file from S3 for a given test run slug
    
    Args:
        test_run_slug (str): The slug identifier of the test run
    
    Returns:
        dict or None: The JSON data if found and valid, None otherwise
    """
    try:
        bucket_name = os.getenv('S3_BUCKET_NAME', 'flow-tester')
        s3_key = f"test-runs/{test_run_slug}/run.json"
        
        logger.info(f"Attempting to load JSON from S3: s3://{bucket_name}/{s3_key}")
        
        # Download the file from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        file_content = response['Body'].read().decode('utf-8')
        
        # Parse JSON
        json_data = json.loads(file_content)
        logger.info(f"Successfully loaded JSON for test run: {test_run_slug}")
        
        return json_data
        
    except s3_client.exceptions.NoSuchKey:
        logger.warning(f"No JSON file found in S3 for test run: {test_run_slug}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format for test run {test_run_slug}: {e}")
        return None
    except Exception as e:
        logger.error(f"Error loading JSON from S3 for test run {test_run_slug}: {e}")
        return None


def get_successful_run_data(test_version_slug):
    """
    Get the latest successful run data for a test version, including the JSON from S3
    
    Args:
        test_version_slug (str): The slug identifier of the test version
    
    Returns:
        dict or None: Complete run data with JSON content if found, None otherwise
    """
    try:
        # Get the latest successful run from database
        run_info = get_latest_successful_run_by_version(test_version_slug)
        
        if not run_info:
            logger.info(f"No successful run found for test version: {test_version_slug}")
            return None
        
        logger.info(f"Found successful run: {run_info['slug']} for version: {test_version_slug}")
        
        # Load the JSON data from S3
        json_data = load_json_from_s3(run_info['slug'])
        
        if not json_data:
            logger.warning(f"Could not load JSON data for run: {run_info['slug']}")
            return None
        
        # Combine database info with S3 JSON data
        complete_data = {
            'run_info': run_info,
            'run_data': json_data
        }
        
        logger.info(f"Successfully retrieved complete data for test version: {test_version_slug}")
        return complete_data
        
    except Exception as e:
        logger.error(f"Error getting successful run data for version {test_version_slug}: {e}")
        return None


def prepareInitialActions(actions):
    """
    Prepare initial actions by filtering out unwanted actions and adding wait actions between each action.
    
    Args:
        actions (list): List of action dictionaries
        
    Returns:
        list: Filtered actions with wait actions added between them
    """
    action_types_to_filter = ["done"]
    wait_duration = 1
    
    if not actions:
        return []
    
    # Filter out unwanted actions
    filtered_actions = []
    for action in actions:
        # Check if this action should be filtered out
        should_filter = False
        for action_key in action.keys():
            if action_key in action_types_to_filter:
                should_filter = True
                break
        
        if not should_filter:
            filtered_actions.append(action)
    
    # Add wait actions between each action
    prepared_actions = []
    for i, action in enumerate(filtered_actions):
        prepared_actions.append(action)
        
        # Add wait action after each action except the last one
        if i < len(filtered_actions) - 1:
            wait_action = {
                "wait": {
                    "seconds": wait_duration
                },
                "interacted_element": None
            }
            prepared_actions.append(wait_action)
    
    return prepared_actions
    

async def processTask(message):
    task = message['task']
    # testVersionSlug = message['testVersionSlug']
    
    # # Get previous successful run data
    # previous_run_data = get_successful_run_data(testVersionSlug)
    
    # if previous_run_data:
    #     logger.info(f"Found previous successful run data for version: {testVersionSlug}")
        
    #     # You can now use the previous_run_data in your task
    #     # previous_run_data contains:
    #     # - run_info: database information about the run (slug, results_url, model, etc.)
    #     # - run_data: the complete JSON data from S3 (screenshots, actions, results, etc.)
        
    #     # Example: You could modify the task based on previous run data
    #     # task_with_context = f"{task}\n\nPrevious successful run info:\n{json.dumps(previous_run_data['run_info'], indent=2)}"
        
    #     # For now, we'll just log that we have the data
    #     # logger.info(f"Previous run had {len()} screenshots")
    # else:
    #     logger.info(f"No previous successful run found for version: {testVersionSlug}")
    
    llm = getLLM(message)
    # model_actions = prepareInitialActions(previous_run_data['run_data'].get('model_actions', []))
    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        calculate_cost=True,
        # initial_actions=model_actions
    )
    result = await agent.run()
    return result

