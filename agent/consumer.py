from boto3 import client
import asyncio
import time
from agent import processTask
import json
import base64
from db_operations import update_test_run_to_running, update_test_run_to_failed, update_test_run_to_succeeded

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


def save_result_data(slug, result):
    screenshots = map_screenshots_to_paths(slug, result.screenshots())
    model_actions = result.model_actions()
    actions_results = result.action_results()
    model_thoughts = result.model_thoughts()
    model_actions_filtered = result.model_actions_filtered()
    action_names = result.action_names()
    final_result = result.final_result()
    extracted_content = result.extracted_content()
    is_done = result.is_done()
    has_errors = result.has_errors()
    errors = result.errors()

    run_data = {
        "is_done": is_done,
        "has_errors": has_errors,
        "model_actions": model_actions,
        "screenshots": screenshots,
        "actions_results": actions_results,
        "model_actions_filtered": model_actions_filtered,
        "model_thoughts": model_thoughts,
        "action_names": action_names,
        "final_result": final_result,
        "extracted_content": extracted_content,
        "errors": errors
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
    task = message['task']
    slug = message['testRunSlug']
    
    # Update test run status to 'running' when processing starts
    print(f"Updating test run {slug} status to 'running'")
    if update_test_run_to_running(slug):
        print(f"Successfully updated test run {slug} status to 'running'")
    else:
        print(f"Failed to update test run {slug} status to 'running'")
    
    try:
        result = asyncio.run(processTask(task))
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
