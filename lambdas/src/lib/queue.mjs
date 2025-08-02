import {
  SQSClient,
  SendMessageCommand,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";

// Initialize the SQS client
const client = new SQSClient({
  region: "us-west-2",
});

// Define your queue URL and message
const queueUrl =
  "https://sqs.us-west-2.amazonaws.com/746664778706/flow-tester-test-runs-queue";

export async function addFlowTestRunToQueue(flowTestRun) {
  const params = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(flowTestRun),
  };

  try {
    const command = new SendMessageCommand(params);
    return await client.send(command);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

export async function countActiveMessagesInQueue() {
  const command = new GetQueueAttributesCommand({
    QueueUrl: queueUrl,
    AttributeNames: ["ApproximateNumberOfMessages"],
  });
  const response = await client.send(command);
  return response.Attributes.ApproximateNumberOfMessages;
}
