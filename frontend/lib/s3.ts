import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-west-2",
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "flow-tester";

export interface TestRunSummary {
  is_done: boolean;
  has_errors: boolean;
  model_actions: any[];
  screenshots: Array<{
    id: number;
    path: string;
  }>;
  actions_results: any[];
  model_actions_filtered: any[];
  model_thoughts: any[];
  action_names: string[];
  final_result: any;
  extracted_content: any;
  errors: any[];
}

/**
 * Load test run summary data from S3
 * @param testRunSlug - The slug of the test run
 * @returns Promise<TestRunSummary | null> - The test run summary data or null if not found
 */
export async function getTestRunSummary(testRunSlug: string): Promise<TestRunSummary | null> {
  try {
    const key = `test-runs/${testRunSlug}/run.json`;
    
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      console.warn(`No body found for test run summary: ${testRunSlug}`);
      return null;
    }

    // Convert stream to string
    const bodyContents = await response.Body.transformToString();
    
    // Parse JSON
    const summaryData: TestRunSummary = JSON.parse(bodyContents);
    
    return summaryData;
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      console.warn(`Test run summary not found: ${testRunSlug}`);
      return null;
    }
    
    console.error(`Error fetching test run summary for ${testRunSlug}:`, error);
    throw new Error(`Failed to fetch test run summary: ${error.message}`);
  }
}