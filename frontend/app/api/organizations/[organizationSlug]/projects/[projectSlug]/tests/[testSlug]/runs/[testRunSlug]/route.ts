import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const GET = async (
  request: NextRequest,
  context: {
    params: Promise<{ 
      organizationSlug: string; 
      projectSlug: string; 
      testSlug: string; 
      testRunSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug, testSlug, testRunSlug } = params;

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

    const testRun = await TestRun.findBySlug(testRunSlug, testSlug, project);
    if (!testRun) {
      return NextResponse.json({ message: "Test run not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      testRun: {
        slug: testRun.slug,
        status: testRun.status,
        createdAt: testRun.createdAt,
        updatedAt: testRun.updatedAt,
        version: {
          slug: testRun.version.slug,
          title: testRun.version.title,
          description: testRun.version.description,
          number: testRun.version.number,
          isDefault: testRun.version.isDefault
        },
        createdBy: {
          displayName: testRun.createdBy.displayName,
          profileImageURL: testRun.createdBy.profileImageURL
        }
      }
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to fetch test run";
    let status = 500;

    return NextResponse.json({ message }, { status });
  }
};