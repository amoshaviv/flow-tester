from browser_use.llm import ChatOpenAI
from browser_use.browser.browser import Browser, BrowserConfig
from browser_use import Agent
from dotenv import load_dotenv
from boto3 import client
load_dotenv()

llm = ChatOpenAI(model="gpt-4.1-mini")

browser = Browser(
    config=BrowserConfig(
    )
)

async def processTask(task):
    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
    )
    result = await agent.run()
    return result

