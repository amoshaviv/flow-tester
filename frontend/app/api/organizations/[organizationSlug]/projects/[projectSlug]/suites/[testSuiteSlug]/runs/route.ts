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
      testSuiteSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSuiteSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, TestSuite } = dbModels;

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

    const testSuite = await TestSuite.findBySlugAndProject(testSuiteSlug, project);
    if (!testSuite) {
      return NextResponse.json({ message: "Test suite not found" }, { status: 404 });
    }

    return NextResponse.json(testSuite.runs || []);
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to fetch test suite runs" },
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
      testSuiteSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSuiteSlug } = params;

  const body = await request.json().catch(() => ({}));
  const { versionSlug, modelSlug } = body;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, TestSuite, TestSuiteVersion, TestSuiteRun, TestSuiteTest, TestRun } = dbModels;

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

    // Find the test suite by slug
    const testSuite = await TestSuite.findOne({
      where: { slug: testSuiteSlug },
      include: [
        {
          model: TestSuiteVersion,
          as: "versions",
        },
      ],
    });

    if (!testSuite) {
      return NextResponse.json({ message: "Test suite not found" }, { status: 404 });
    }

    if (!testSuite.versions || testSuite.versions.length === 0) {
      return NextResponse.json(
        { message: "No versions found for test suite" },
        { status: 404 }
      );
    }

    // Find the specified version or use the default version
    let targetVersion;
    if (versionSlug) {
      targetVersion = testSuite.versions.find((v) => v.slug === versionSlug);
      if (!targetVersion) {
        return NextResponse.json(
          { message: "Specified version not found" },
          { status: 404 }
        );
      }
    } else {
      targetVersion = testSuite.versions.find((v) => v.isDefault);
      if (!targetVersion) {
        return NextResponse.json(
          { message: "No default version found for test suite" },
          { status: 404 }
        );
      }
    }

    // Get tests in this test suite version
    const testsInSuite = await TestSuiteTest.findTestsByTestSuiteVersion(targetVersion.id);
    
    if (!testsInSuite || testsInSuite.length === 0) {
      return NextResponse.json(
        { message: "No tests found in this test suite version" },
        { status: 404 }
      );
    }

    // Get model provider from the selected model
    let modelProvider = null;
    if (modelSlug) {
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

      for (const category of Object.values(MODELS)) {
        const model = category.find((m) => m.api_slug === modelSlug);
        if (model) {
          modelProvider = model.provider;
          break;
        }
      }
    }

    if (!modelProvider) {
      return NextResponse.json(
        { message: "No valid model provider found" },
        { status: 404 }
      );
    }

    // Create new test suite run
    const newTestSuiteRun = await TestSuiteRun.createWithUserAndVersion(
      user,
      targetVersion,
      modelSlug,
      modelProvider
    );

    // Create test runs for each test in the suite
    const testRuns = [];
    for (const testInSuite of testsInSuite) {
      if (testInSuite.defaultVersion) {
        const newTestRun = await TestRun.createWithUserAndVersion(
          user,
          testInSuite.defaultVersion,
          modelSlug,
          modelProvider
        );

        // Link the test run to the test suite run
        await newTestRun.update({ test_suite_run_id: newTestSuiteRun.id });

        testRuns.push(newTestRun);

        // Send message to SQS queue for each test
        try {
          const message = {
            taskType: "test-run",
            testRunSlug: newTestRun.slug,
            testVersionSlug: testInSuite.defaultVersion.slug,
            testSlug: testInSuite.slug,
            projectSlug: projectSlug,
            organizationSlug: organizationSlug,
            testSuiteRunSlug: newTestSuiteRun.slug,
            createdAt: newTestRun.createdAt,
            userEmail: user.email,
            task: testInSuite.defaultVersion.description,
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
      }
    }

    return NextResponse.json({
      message: "Test suite run created successfully",
      testSuiteRun: {
        slug: newTestSuiteRun.slug,
        modelSlug,
        modelProvider,
        createdAt: newTestSuiteRun.createdAt,
        version: {
          slug: targetVersion.slug,
          title: targetVersion.title,
          description: targetVersion.description,
          number: targetVersion.number,
          isDefault: targetVersion.isDefault,
        },
        testRuns: testRuns.map(run => ({
          slug: run.slug,
          modelSlug,
          modelProvider,
          createdAt: run.createdAt,
        })),
      },
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to create test suite run";
    let status = 500;

    return NextResponse.json({ message }, { status });
  }
};