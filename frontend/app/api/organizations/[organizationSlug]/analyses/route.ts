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
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization } = dbModels;

  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );

    if (!organization) return notAuthorized();

    // Get all analyses for this organization
    const analyses = await organization.getAnalyses();

    return NextResponse.json({
      analyses,
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to fetch analyses" },
      { status: 500 }
    );
  }
};

export const POST = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, OrganizationAnalysis } = dbModels;

  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  try {
    const organizationWithRole =
      await Organization.findBySlugAndUserEmailWithRole(
        organizationSlug,
        email
      );

    if (!organizationWithRole) return notAuthorized();
    const { organization, userRole } = organizationWithRole;

    // Only owners and admins can create analyses
    if (userRole !== "owner" && userRole !== "admin") {
      return notAuthorized();
    }

    // Create new analysis
    const newAnalysis = await OrganizationAnalysis.createWithOrganization(organization);

    return NextResponse.json({
      message: "Analysis created successfully",
      analysis: newAnalysis,
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to create analysis" },
      { status: 500 }
    );
  }
};