"""
Show how to use custom outputs.

@dev You need to add OPENAI_API_KEY to your environment variables.
"""

import asyncio
import os
import sys

# sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from dotenv import load_dotenv

load_dotenv()

from pydantic import BaseModel

from browser_use import Agent, ChatGoogle

class TestCase(BaseModel):
	title: str
	description: str
class TestCases(BaseModel):
	tests: list[TestCase]

def getAnalysisTemplate(): 
    with open(f"{os.path.dirname(os.path.abspath(__file__))}/prompts/analyze-website.md", 'r') as file:
        content = file.read()  # Read entire file
        return(content)
    
async def main():
	task = 'Go to Booking.com and generate test cases for important flows on the website, the test cases should be with following json format:  ' + """```json
    {
    "website": "WebsiteName.com",
    "type": "Category",
    "tests": [
        {
        "title": "Descriptive Test Title",
        "description": "Step-by-step instructions with specific data",
        "outputStructure": "JSON or text"
        }
    ]
    }
    ```"""
	model = ChatGoogle(model='gemini-2.5-flash')
	agent = Agent(task=task, llm=model, output_model_schema=TestCases)

	history = await agent.run()

	# result = history.final_result()
	# if result:
	# 	parsed: Posts = Posts.model_validate_json(result)

	# 	for post in parsed.posts:
	# 		print('\n--------------------------------')
	# 		print(f'Title:            {post.post_title}')
	# 		print(f'URL:              {post.post_url}')
	# 		print(f'Comments:         {post.num_comments}')
	# 		print(f'Hours since post: {post.hours_since_post}')
	# else:
	# 	print('No result')


if __name__ == '__main__':
	asyncio.run(main())