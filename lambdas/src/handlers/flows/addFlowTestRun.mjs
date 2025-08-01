import { getLambdaResponse } from "../../lib/lambda.mjs";
import sentry from "../../lib/sentry.mjs";
import { addFlowTestRunToQueue, countActiveMessagesInQueue } from "../../lib/queue.mjs";
import { getActiveInstancesList } from "../../lib/ec2.mjs";

const genericAddFlowTestError = {
  error: "Error adding a flow test run",
  httpCode: 401,
};

export default async function addFlowTestRunHandler(event) {
  let output = null;

  try {
    // Get flow test from API

    // TODO: Get the flow test from the DB in order to get it executed and make sure it exists
    // Make sure the flow test is valid and has all the required fields and that the user has access to it
    const flowTest = JSON.parse(event.body);
    
    // Add flow test to queue
    const response = await addFlowTestRunToQueue(flowTest);
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
