import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

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

export interface ImageUploadOptions {
  file: File;
  folder: string;
  filename?: string;
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp",
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
    };
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return {
      valid: false,
      error: "File size too large. Maximum 5MB allowed.",
    };
  }

  return { valid: true };
};

export const uploadImageToS3 = async (options: ImageUploadOptions): Promise<ImageUploadResult> => {
  const { file, folder, filename } = options;

  try {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const finalFilename = filename || `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${finalFilename}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    const url = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    return {
      success: false,
      error: "Failed to upload image to S3",
    };
  }
};

export const uploadOrganizationProfileImage = async (
  file: File,
  organizationSlug: string
): Promise<ImageUploadResult> => {
  return uploadImageToS3({
    file,
    folder: `uploads/organizations/${organizationSlug}`,
    filename: `profile-${uuidv4()}.${file.name.split(".").pop() || "jpg"}`,
  });
};

export const uploadProjectProfileImage = async (
  file: File,
  organizationSlug: string,
  projectSlug: string
): Promise<ImageUploadResult> => {
  return uploadImageToS3({
    file,
    folder: `uploads/organizations/${organizationSlug}/projects/${projectSlug}`,
    filename: `profile-${uuidv4()}.${file.name.split(".").pop() || "jpg"}`,
  });
};

export const uploadProfileImage = async (
  file: File,
  organizationSlug: string,
  projectSlug: string
): Promise<ImageUploadResult> => {
  return uploadImageToS3({
    file,
    folder: `uploads/profiles`,
    filename: `profile-${uuidv4()}.${file.name.split(".").pop() || "jpg"}`,
  });
};