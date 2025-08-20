import { getLambdaResponse } from "../../lib/lambda.mjs";
import sentry from "../../lib/sentry.mjs";
import {
  addFlowTestRunToQueue,
  countActiveMessagesInQueue,
} from "../../lib/queue.mjs";
import { getActiveInstancesList, launchInstanceFromTemplate } from "../../lib/ec2.mjs";

const genericAddFlowTestError = {
  error: "Error adding a flow test run",
  httpCode: 401,
};

async function processMessage(record) {
  // Extract message details
  const messageBody = JSON.parse(record.body);
  console.log('--------- message received ------------');
  
  // Check if message type is "test-run" and route to FlowTesterTestRunsQueue
  if (messageBody.taskType === "test-run") {
    console.log('Routing test-run message to FlowTesterTestRunsQueue');
    await addFlowTestRunToQueue(messageBody);
    console.log('Message successfully sent to FlowTesterTestRunsQueue');
    
    // Launch EC2 instance from template
    console.log('Launching EC2 instance from template');
    await launchInstanceFromTemplate();
    console.log('EC2 instance launch initiated');
  }
  
  console.log('--------- message processed ------------');
}

export default async function processTestRunHandler(event) {
  let output = null;

  try {
    // Process each message
    for (const record of event.Records) {
      try {
        await processMessage(record);
      } catch (error) {
        console.error("Error processing message:", error);
        // Throw error to send message back to queue or DLQ
        throw error;
      }
    }

    // Add flow test to queue
    const numberOfActiveMessages = await countActiveMessagesInQueue();
    const activeInstances = await getActiveInstancesList();

    output = {
      numberOfActiveMessages,
      activeInstances,
      httpCode: 200,
    };
  } catch (err) {
    console.log(err);
    sentry.captureException(err);
    output = genericAddFlowTestError;
  }

  return getLambdaResponse(output);
}
