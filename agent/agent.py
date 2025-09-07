from browser_use import Agent, ChatOpenAI, ChatGoogle, ChatAnthropic, Browser
from dotenv import load_dotenv
from boto3 import client
import os

load_dotenv()


save_conversation_path = os.path.dirname(os.path.abspath(__file__)) + '/log'

browser = Browser(
    window_size={'width': 1280, 'height': 800},
)

def getLLM(task):
    modelProvider = task["modelProvider"]
    modelSlug = task["modelSlug"]

    print(modelProvider, modelSlug)
    
    if modelProvider.lower() == "openai":
        return ChatOpenAI(model=modelSlug)
    elif modelProvider.lower() == "google":
        return ChatGoogle(model=modelSlug)
    elif modelProvider.lower() == "anthropic":
        return ChatAnthropic(model=modelSlug)
    else:
        raise ValueError(f"Unsupported model provider: {modelProvider}")


async def processTask(message):
    task = message['task']
    llm = getLLM(message)
    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        save_conversation_path=save_conversation_path,
        calculate_cost=True,
        generate_gif=save_conversation_path + '/gif',
    )
    result = await agent.run()
    return result

