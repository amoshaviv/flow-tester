import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const GET = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
      testSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, Test } = dbModels;

  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );
    if (!organization) return notAuthorized();

    const project = await Project.findBySlugAndOrganizationSlug(
      projectSlug,
      organizationSlug
    );
    if (!project) return notAuthorized();

    const test = await Test.findBySlugAndProject(testSlug, project);
    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    return NextResponse.json(test.runs || []);
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to fetch test runs" },
      { status: 500 }
    );
  }
};

const sqsClient = new SQSClient({ region: "us-west-2" });
const QUEUE_URL =
  "https://sqs.us-west-2.amazonaws.com/746664778706/flow-tester-test-runs-queue";

export const POST = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      projectSlug: string;
      testSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSlug } = params;

  // Parse request body to get version selection and model
  const body = await request.json().catch(() => ({}));
  const { versionSlug, modelSlug } = body;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, Test, TestVersion, TestRun } = dbModels;

  // Make sure user is authorized
  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );
    if (!organization) return notAuthorized();

    const project = await Project.findBySlugAndOrganizationSlug(
      projectSlug,
      organizationSlug
    );
    if (!project) return notAuthorized();

    // Find the test by slug
    const test = await Test.findOne({
      where: { slug: testSlug },
      include: [
        {
          model: TestVersion,
          as: "versions",
        },
      ],
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    if (!test.versions || test.versions.length === 0) {
      return NextResponse.json(
        { message: "No versions found for test" },
        { status: 404 }
      );
    }

    // Find the specified version or use the default version
    let targetVersion;
    if (versionSlug) {
      targetVersion = test.versions.find((v) => v.slug === versionSlug);
      if (!targetVersion) {
        return NextResponse.json(
          { message: "Specified version not found" },
          { status: 404 }
        );
      }
    } else {
      targetVersion = test.versions.find((v) => v.isDefault);
      if (!targetVersion) {
        return NextResponse.json(
          { message: "No default version found for test" },
          { status: 404 }
        );
      }
    }

    // Get model provider from the selected model
    let modelProvider = null;
    if (modelSlug) {
      // Define model data inline (would be better to move to a shared module)
      const MODELS = {
        light_cost_effective: [
          { provider: "Google", api_slug: "gemini-2.5-flash-lite" },
          { provider: "Google", api_slug: "gemini-2.0-flash-lite" },
          { provider: "OpenAI", api_slug: "gpt-5-nano" },
          { provider: "OpenAI", api_slug: "gpt-4.1-nano" },
          { provider: "OpenAI", api_slug: "gpt-4o-mini" },
          { provider: "Anthropic", api_slug: "claude-3-haiku-20240307" },
        ],
        medium_balanced: [
          { provider: "Google", api_slug: "gemini-2.5-flash" },
          { provider: "Google", api_slug: "gemini-2.0-flash" },
          { provider: "OpenAI", api_slug: "gpt-5-mini" },
          { provider: "OpenAI", api_slug: "gpt-4.1-mini" },
          { provider: "Anthropic", api_slug: "claude-3-5-haiku-20241022" },
        ],
        heavy_effective: [
          { provider: "Google", api_slug: "gemini-2.5-pro" },
          { provider: "OpenAI", api_slug: "gpt-5" },
          { provider: "OpenAI", api_slug: "gpt-4.1" },
          { provider: "Anthropic", api_slug: "claude-3-7-sonnet-20250219" },
          { provider: "Anthropic", api_slug: "claude-sonnet-4-20250514" },
        ],
        pro_reasoning: [
          { provider: "OpenAI", api_slug: "o3-mini" },
          { provider: "OpenAI", api_slug: "o4-mini" },
          { provider: "OpenAI", api_slug: "o3" },
          { provider: "OpenAI", api_slug: "o3-pro-2025-06-10" },
          { provider: "Anthropic", api_slug: "claude-opus-4-20250514" },
          { provider: "Anthropic", api_slug: "claude-opus-4-1-20250805" },
        ],
      };

      // Find the model provider
      for (const category of Object.values(MODELS)) {
        const model = category.find((m) => m.api_slug === modelSlug);
        if (model) {
          modelProvider = model.provider;
          break;
        }
      }
    }

    // Create new test run
    if (!modelProvider) {
      return NextResponse.json(
        { message: "No models found for test" },
        { status: 404 }
      );
    }

    const newTestRun = await TestRun.createWithUserAndVersion(
      user,
      targetVersion,
      modelSlug,
      modelProvider
    );

    // Send message to SQS queue
    try {
      const message = {
        taskType: "test-run",
        testRunSlug: newTestRun.slug,
        testVersionSlug: targetVersion.slug,
        testSlug: testSlug,
        projectSlug: projectSlug,
        organizationSlug: organizationSlug,
        createdAt: newTestRun.createdAt,
        userEmail: user.email,
        task: targetVersion.description,
        modelSlug: modelSlug || "gemini-2.5-flash",
        modelProvider: modelProvider || "Google",
      };

      const command = new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(message),
      });

      await sqsClient.send(command);
    } catch (sqsError) {
      console.error("Failed to send SQS message:", sqsError);
    }

    return NextResponse.json({
      message: "Test run created successfully",
      testRun: {
        slug: newTestRun.slug,
        modelSlug,
        modelProvider,
        createdAt: newTestRun.createdAt,
        version: {
          slug: targetVersion.slug,
          title: targetVersion.title,
          description: targetVersion.description,
          number: targetVersion.number,
          isDefault: targetVersion.isDefault,
        },
      },
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to create test run";
    let status = 500;

    return NextResponse.json({ message }, { status });
  }
};
