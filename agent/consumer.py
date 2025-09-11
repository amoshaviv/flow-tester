from boto3 import client
import asyncio
import time
from agent import processTask
from analyzer import processAnalysis
import json
import base64
from db_operations import update_test_run_to_running, update_test_run_to_failed, update_test_run_to_succeeded, create_new_analysis
import random
import string

# Generate random string of letters and digits
def generate_random_string(length):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=length))


s3 = client('s3')

# Config
S3_BUCKET_NAME='flow-tester'
QUEUE_URL = 'https://sqs.us-west-2.amazonaws.com/746664778706/flow-tester-test-runs-queue'
REGION = 'us-west-2'


# Initialize SQS client
sqs = client('sqs', region_name=REGION)

def base64_to_s3_image(base64_string: str, path: str):
    img_data = base64.b64decode(base64_string)
    s3.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=path,
        Body=img_data,
        ContentType='image/png',
    )

def save_result_screenshots(slug, result):
    screenshots = result.screenshots()
    number_screenshots = 0
    for next_screenshot in screenshots:
        number_screenshots=number_screenshots+1
        path = f"test-runs/{slug}/screenshots/{number_screenshots}.png"
        base64_to_s3_image(
            base64_string=str(next_screenshot),
            path=path
        )

class SafeJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        try:
            return super().default(obj)
        except TypeError:
            # If the object has a __dict__, convert it to a dictionary
            if hasattr(obj, '__dict__'):
                return obj.__dict__
            # If the object has attributes like 'thinking', 'evaluation_previous_goal', etc.
            # try to extract them as a dictionary
            elif hasattr(obj, 'thinking'):
                return {
                    'thinking': getattr(obj, 'thinking', ''),
                    'evaluation_previous_goal': getattr(obj, 'evaluation_previous_goal', ''),
                    'memory': getattr(obj, 'memory', ''),
                    'next_goal': getattr(obj, 'next_goal', ''),
                }
            elif hasattr(obj, 'is_done'):
                return {
                    'is_done': getattr(obj, 'is_done', None),
                    'success': getattr(obj, 'success', None),
                    'error': getattr(obj, 'error', None),
                    'attachments': getattr(obj, 'attachments', None),
                    'long_term_memory': getattr(obj, 'long_term_memory', ''),
                    'extracted_content': getattr(obj, 'extracted_content', ''),
                    'include_extracted_content_only_once': getattr(obj, 'include_extracted_content_only_once', None),
                    'include_in_memory': getattr(obj, 'include_in_memory', None),
                }
            # For any other non-serializable object, convert to string as fallback
            else:
                return str(obj) 

def map_screenshots_to_paths(slug, screenshots):
    mapped = []
    for idx, screenshot in enumerate(screenshots, start=1):
        path = f"test-runs/{slug}/screenshots/{idx}.png"
        mapped.append({"id": idx, "path": path})
    return mapped

def save_analysis(organization_slug, result):
    is_successful = result.is_successful()
    is_done = result.is_done()
    final_result = result.final_result()
    has_errors = result.has_errors()
    errors = result.errors()
    usage = result.usage

    analysis_data = {
        "usage": usage,
        "is_done": is_done,
        "is_successful": is_successful,
        "has_errors": has_errors,
        "final_result": final_result,
        "errors": errors,
    }
    analysis_json = json.dumps(analysis_data, cls=SafeJSONEncoder, indent=2)
    analysis_key = generate_random_string(14)
    key = f"organizations/{organization_slug}/analysis/{analysis_key}.json"
    s3.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=key,
        Body=analysis_json,
        ContentType='application/json',
    )
    
    return key
    
def save_result_data(slug, result):
    screenshots = map_screenshots_to_paths(slug, result.screenshots())
    model_actions = result.model_actions()
    model_outputs = result.model_outputs()
    is_successful = result.is_successful()
    total_duration_seconds = result.total_duration_seconds()
    actions_results = result.action_results()
    model_thoughts = result.model_thoughts()
    model_actions_filtered = result.model_actions_filtered()
    action_names = result.action_names()
    final_result = result.final_result()
    extracted_content = result.extracted_content()
    is_done = result.is_done()
    has_errors = result.has_errors()
    errors = result.errors()
    usage = result.usage

    run_data = {
        "usage": usage,
        "is_done": is_done,
        "is_successful": is_successful,
        "total_duration_seconds": total_duration_seconds,
        "has_errors": has_errors,
        "model_actions": model_actions,
        "screenshots": screenshots,
        "actions_results": actions_results,
        "model_actions_filtered": model_actions_filtered,
        "model_thoughts": model_thoughts,
        "action_names": action_names,
        "final_result": final_result,
        "extracted_content": extracted_content,
        "errors": errors,
        "model_outputs": model_outputs
    }
    run_json = json.dumps(run_data, cls=SafeJSONEncoder, indent=2)
    actions_path = f"test-runs/{slug}/run.json"
    s3.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=actions_path,
        Body=run_json,
        ContentType='application/json',
    )

def save_result(slug, result):
    save_result_screenshots(slug, result)
    save_result_data(slug, result)

def process_message(body):
    """Process a task and update test run status."""
    print(f"Processing message: {body}")
    message = json.loads(body)
    type = message['taskType']
    
    if type == "website-analysis":
        organization_domain = message['organizationDomain']
        organization_slug = message['organizationSlug']
        organization_id = message['organizationId']
    
        print(f"Analyzing website: {organization_domain}")
        try:
            result = asyncio.run(processAnalysis(message))
            analysis_url = save_analysis(organization_slug, result)
            create_new_analysis(organization_id, analysis_url)
        except Exception as e:
            print(f"Analysis failed with error: {e}")
            raise e
        
    if type == "test-run":
        slug = message['testRunSlug']
        
        # Update test run status to 'running' when processing starts
        print(f"Updating test run {slug} status to 'running'")
        if update_test_run_to_running(slug):
            print(f"Successfully updated test run {slug} status to 'running'")
        else:
            print(f"Failed to update test run {slug} status to 'running'")
        
        try:
            result = asyncio.run(processTask(message))
            save_result(slug, result)
            is_done = result.is_done()
            model_actions = result.model_actions()

            mark_failed = False
            if is_done is False:
                mark_failed = True
            elif model_actions and isinstance(model_actions, list):
                last_action = model_actions[-1]
                if isinstance(last_action, dict):
                    done_prop = last_action.get("done")
                    if isinstance(done_prop, dict) and done_prop.get("success") is False:
                        mark_failed = True

            if mark_failed:
                print(f"Task failed, updating test run {slug} status to 'failed'")
                if update_test_run_to_failed(slug):
                    print(f"Successfully updated test run {slug} status to 'failed'")
                else:
                    print(f"Failed to update test run {slug} status to 'failed'")
            else:
                print(f"Task completed successfully, updating test run {slug} status to 'succeeded'")
                if update_test_run_to_succeeded(slug):
                    print(f"Successfully updated test run {slug} status to 'succeeded'")
                else:
                    print(f"Failed to update test run {slug} status to 'succeeded'")

            print("Task complete.")
        except Exception as e:
            # Update status to 'failed' if task failed
            print(f"Task failed with error: {e}")
            print(f"Updating test run {slug} status to 'failed'")
            if update_test_run_to_failed(slug):
                print(f"Successfully updated test run {slug} status to 'failed'")
            else:
                print(f"Failed to update test run {slug} status to 'failed'")
            raise e

def worker():
    time.sleep(10)

    response = sqs.receive_message(
        QueueUrl=QUEUE_URL,
        MaxNumberOfMessages=1
    )

    messages = response.get('Messages', [])
    if not messages:
        print("No messages found. Waiting...")

    for message in messages:
        # attempts = 0
        receipt_handle = message['ReceiptHandle']
        body = message['Body']

        try:
            print("Received message, marking as 'In Progress'")
            process_message(body)

            # Delete only after successful processing
            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=receipt_handle
            )
            print("Message deleted from queue (marked as Done).")

        except Exception as e:
            print(f"Error processing message: {e}")

if __name__ == "__main__":
    worker()
