import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const GET = async (
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
  const { User, Organization, Project, Test } = dbModels;

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

    const tests = await Test.findAllByProjectSlug(projectSlug);

    const sanitizedTests = tests.map(test => ({
      slug: test.slug,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      versions: test.versions?.map(version => ({
        slug: version.slug,
        title: version.title,
        description: version.description,
        number: version.number,
        isDefault: version.isDefault,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt
      }))
    }));

    return NextResponse.json(sanitizedTests);
  } catch (err: any) {
    console.log(err);
    let message = "Failed to fetch tests";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};

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

    return NextResponse.json({
      test: {
        slug: test.slug,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      },
      testVersion: {
        slug: testVersion.slug,
        title: testVersion.title,
        description: testVersion.description,
        number: testVersion.number,
        isDefault: testVersion.isDefault,
        createdAt: testVersion.createdAt,
        updatedAt: testVersion.updatedAt
      },
      project: {
        name: project.name,
        slug: project.slug,
        profileImageURL: project.profileImageURL
      },
      organization: {
        name: organization.name,
        slug: organization.slug,
        domain: organization.domain,
        profileImageURL: organization.profileImageURL
      }
    });
  } catch (err: any) {
    console.log(err);
    let message = "Failed to create a test";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};
