import { getLambdaResponse } from "../../lib/lambda.mjs";
import sentry from "../../lib/sentry.mjs";
import {
  addFlowTestRunToQueue,
  countActiveMessagesInQueue,
} from "../../lib/queue.mjs";
import { getActiveInstancesList } from "../../lib/ec2.mjs";

const genericAddFlowTestError = {
  error: "Error adding a flow test run",
  httpCode: 401,
};

async function processMessage(record) {
  // Extract message details
  const messageBody = record.body;
  console.log('--------- message received ------------');
  console.log(messageBody);
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
      response,
      numberOfActiveMessages,
      activeInstances,
      httpCode: 200,
    };

    // Check if there are enough consumers live by checking the queue size and the number of consumers live
    // getActiveInstancesList

    // If there are enough consumers live, return 200

    // If there are not enough consumers live, create a new consumer
  } catch (err) {
    console.log(err);
    sentry.captureException(err);
    output = genericAddFlowTestError;
  }

  return getLambdaResponse(output);
}
