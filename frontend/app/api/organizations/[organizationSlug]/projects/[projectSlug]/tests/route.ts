import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";

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
  const { User, Organization, Project } = dbModels;

  // Make sure user is authorized
  if (!email)
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
  const user = await User.findByEmail(email);
  if (!user)
    return NextResponse.json({ message: "Not Authorized" }, { status: 401 });

  // Create test
  const { title, description } = await request.json();
  try {
    console.log(title, description, organizationSlug, projectSlug)
    // return NextResponse.json(organization);
  } catch (err: any) {
    let message = "Failed to create a test";
    let status = 400;

    return NextResponse.json({ message }, { status });
  }
};
