import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

const sqsClient = new SQSClient({ region: "us-west-2" });
const QUEUE_URL = "https://sqs.us-west-2.amazonaws.com/746664778706/flow-tester-test-runs-queue";

export const POST = async (
  request: NextRequest,
  context: {
    params: Promise<{ organizationSlug: string; projectSlug: string; testSlug: string }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSlug } = params;

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

    // Find the test by slug and include the default version
    const test = await Test.findOne({
      where: { slug: testSlug },
      include: [
        {
          model: TestVersion,
          as: 'versions',
          where: { isDefault: true },
          required: true
        }
      ]
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    if (!test.versions || test.versions.length === 0) {
      return NextResponse.json({ message: "No default version found for test" }, { status: 404 });
    }

    const defaultVersion = test.versions[0];

    // Create new test run
    const newTestRun = await TestRun.createWithUserAndVersion(user, defaultVersion);

    // Send message to SQS queue
    try {
      const message = {
        taskType: "test-run",
        testRunSlug: newTestRun.slug,
        testSlug: testSlug,
        projectSlug: projectSlug,
        organizationSlug: organizationSlug,
        createdAt: newTestRun.createdAt,
        userEmail: user.email,
        task: defaultVersion.description,
      };

      const command = new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(message)
      });

      await sqsClient.send(command);
    } catch (sqsError) {
      console.error("Failed to send SQS message:", sqsError);
    }

    return NextResponse.json({ 
      message: "Test run created successfully",
      testRun: {
        id: newTestRun.id,
        createdAt: newTestRun.createdAt,
        version: {
          slug: defaultVersion.slug,
          title: defaultVersion.title,
          description: defaultVersion.description,
          number: defaultVersion.number,
          isDefault: defaultVersion.isDefault
        }
      }
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to create test run";
    let status = 500;

    return NextResponse.json({ message }, { status });
  }
};