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
            return str(obj) 

def save_result_data(slug, result):
    model_actions = result.model_actions()     # All actions with their parameters
    actions_results = result.action_results()
    model_thoughts = result.model_thoughts()
    model_actions_filtered = result.model_actions_filtered()
    action_names = result.action_names()
    final_result = result.final_result()
    extracted_content = result.extracted_content()
    errors = result.errors()

    run_data = {
        "model_actions": model_actions,
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
        
        # Update status to 'succeeded' if task completed successfully
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
