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


save_conversation_path = os.path.dirname(os.path.abspath(__file__)) + '/log'

browser = Browser(
    window_size={'width': 1280, 'height': 800},
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
    

def getAnalysisTemplate(): 
    with open(f"{os.path.dirname(os.path.abspath(__file__))}/prompts/analyze-website.md", 'r') as file:
        content = file.read()  # Read entire file
        return(content)

async def processAnalysis(message):
    organization_domain = message['organizationDomain']
    task = getAnalysisTemplate() + ' \n\n ## Website to Analyze \n ' + organization_domain
    
    llm = getLLM(message)
    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        calculate_cost=True,
    )
    result = await agent.run()
    return result

