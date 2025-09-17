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
      analysisSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, analysisSlug } = params;

  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User, Organization, OrganizationAnalysis } = dbModels;

  if (!email) return notAuthorized();
  const user = await User.findByEmail(email);
  if (!user) return notAuthorized();

  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );

    if (!organization) return notAuthorized();

    // Find the analysis by slug
    const analysis = await OrganizationAnalysis.findOne({
      where: { slug: analysisSlug },
      include: [
        {
          association: "organization",
          attributes: ["slug", "name"],
        },
      ],
    });

    if (!analysis || analysis.organization.slug !== organizationSlug) {
      return NextResponse.json(
        { message: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      analysis,
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      analysisSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, analysisSlug } = params;

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

    // Only owners and admins can update analyses
    if (userRole !== "owner" && userRole !== "admin") {
      return notAuthorized();
    }

    // Find the analysis by slug
    const analysis = await OrganizationAnalysis.findOne({
      where: { slug: analysisSlug },
      include: [
        {
          association: "organization",
          attributes: ["slug", "name"],
        },
      ],
    });

    if (!analysis || analysis.organization.slug !== organizationSlug) {
      return NextResponse.json(
        { message: "Analysis not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (status) {
      await analysis.update({ status });
    }

    return NextResponse.json({
      message: "Analysis updated successfully",
      analysis,
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to update analysis" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  request: NextRequest,
  context: {
    params: Promise<{
      organizationSlug: string;
      analysisSlug: string;
    }>;
  }
) => {
  const params = await context.params;
  const { organizationSlug, analysisSlug } = params;

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

    // Only owners and admins can delete analyses
    if (userRole !== "owner" && userRole !== "admin") {
      return notAuthorized();
    }

    // Find the analysis by slug
    const analysis = await OrganizationAnalysis.findOne({
      where: { slug: analysisSlug },
      include: [
        {
          association: "organization",
          attributes: ["slug", "name"],
        },
      ],
    });

    if (!analysis || analysis.organization.slug !== organizationSlug) {
      return NextResponse.json(
        { message: "Analysis not found" },
        { status: 404 }
      );
    }

    // Soft delete the analysis
    await analysis.destroy();

    return NextResponse.json({
      message: "Analysis deleted successfully",
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to delete analysis" },
      { status: 500 }
    );
  }
};