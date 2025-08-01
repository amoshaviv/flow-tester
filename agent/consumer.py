from boto3 import client
import time

# Config
QUEUE_URL = 'https://sqs.us-west-2.amazonaws.com/746664778706/flow-tester-test-runs-queue'
REGION = 'us-west-2'

# Initialize SQS client
sqs = client('sqs', region_name=REGION)

def process_message(body):
    """Simulate a task, replace this with real logic."""
    print(f"Processing message: {body}")
    time.sleep(5)  # Simulate work
    print("Task complete.")

def worker():
    attempts = 0
    while attempts < 5:

        response = sqs.receive_message(
            QueueUrl=QUEUE_URL,
            MaxNumberOfMessages=1
        )

        messages = response.get('Messages', [])
        if not messages:
            print("No messages found. Waiting...")
            attempts += 1
            time.sleep(1)
            continue

        for message in messages:
            attempts = 0
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
                # Optional: log or send to DLQ manually if needed

if __name__ == "__main__":
    worker()
