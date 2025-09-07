import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";
import { uploadOrganizationProfileImage, validateImageFile } from "@/lib/s3";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const PATCH = async (
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
    const organizationWithRole =
      await Organization.findBySlugAndUserEmailWithRole(
        organizationSlug,
        email
      );

    if (!organizationWithRole) return notAuthorized();
    const { organization, userRole } = organizationWithRole;

    // Only owners and admins can view user management
    if (userRole !== "owner" && userRole !== "admin") {
      return notAuthorized();
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const domain = formData.get("domain") as string;
    const imageFile = formData.get("profileImage") as File | null;

    if (!name || !slug || !domain) {
      return NextResponse.json(
        { message: "Name, slug, and domain are required" },
        { status: 400 }
      );
    }

    let profileImageURL: string | undefined = undefined;

    // Handle image upload to S3 if provided
    if (imageFile && imageFile.size > 0) {
      // Validate file first
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        return NextResponse.json(
          { message: validation.error },
          { status: 400 }
        );
      }

      // Upload to S3
      const uploadResult = await uploadOrganizationProfileImage(
        imageFile,
        organizationSlug
      );
      if (!uploadResult.success) {
        return NextResponse.json(
          { message: uploadResult.error || "Failed to upload image" },
          { status: 500 }
        );
      }

      profileImageURL = uploadResult.url;
    }

    const result = await Organization.updateOrganizationDetails(
      organization,
      name,
      slug,
      domain,
      profileImageURL
    );

    if (!result.success) {
      return NextResponse.json(
        {
          message: result.error,
          suggestedSlug: result.suggestedSlug,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Organization updated successfully",
      organization: {
        slug: result.organization?.slug,
        name: result.organization?.name,
        profileImageURL: result.organization?.profileImageURL,
      },
    });
  } catch (err: any) {
    console.log(err);
    return NextResponse.json(
      { message: "Failed to update organization" },
      { status: 500 }
    );
  }
};
