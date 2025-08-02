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

def base64_to_image(base64_string: str, output_filename: str):
    """Convert base64 string to image."""
    import base64
    import os

    if not os.path.exists(os.path.dirname(output_filename)):
        os.makedirs(os.path.dirname(output_filename))

    img_data = base64.b64decode(base64_string)
    with open(output_filename, "wb") as f:
        f.write(img_data)
    return output_filename

async def processTask(task):
    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
    )
    result = await agent.run()
    return result
    # print(result)
    # screenshots = result.screenshots()
    # number_screenshots = 0
    # for next_screenshot in screenshots:
    #     number_screenshots=number_screenshots+1
    #     path = f"./screenshots/{number_screenshots}.png"
    #     img_path = base64_to_image(
    #         base64_string=str(next_screenshot),
    #         output_filename=path
    #     )
    #     print(img_path)

def upload_file_to_s3(file_path, bucket_name, s3_key):
    s3 = client('s3')
    try:
        s3.upload_file(file_path, bucket_name, s3_key)
        print(f"Uploaded {file_path} to s3://{bucket_name}/{s3_key}")
    except Exception as e:
        print(f"Failed to upload {file_path} to S3: {e}")