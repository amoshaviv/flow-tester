import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const PUT = async (
  request: NextRequest,
  context: {
    params: Promise<{ organizationSlug: string; projectSlug: string }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, projectSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, Project, Test, TestVersion } = dbModels;

  // Make sure user is authorized
  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  // Create test
  const { title, description } = await request.json();
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

    const test = await Test.createWithUserAndProject(user, project);
    const testVersion = await TestVersion.createWithTest(
      title,
      description,
      user,
      test,
      true
    );

    // const { email, displayName, profileImageURL } = user;
    // const output = {
    //   id: test.id, 
    //   createdBy: {
    //     email, displayName, profileImageURL
    //   }, 
    //   project: {
    //     name: project.name,
    //     slug: project.slug,
    //     organization: {
    //       name: organization.name,
    //       slug: organization.slug,
    //     }
    //   },
    //   defaultVersion: {
    //     id: 
    //   }
    // };

    return NextResponse.json({ test, testVersion, project, organization });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to create a test";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};
