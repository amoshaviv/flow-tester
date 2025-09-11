import { NextRequest, NextResponse } from "next/server";
import { getDBModels } from "@/lib/sequelize";
import { getToken } from "next-auth/jwt";
import { uploadProfileImage } from "@/lib/s3";

const notAuthorized = () =>
  NextResponse.json({ message: "Not Authorized" }, { status: 401 });

export const PATCH = async (request: NextRequest) => {
  const dbModels = await getDBModels();
  const token = await getToken({ req: request });
  const email = token?.email;
  const { User } = dbModels;

  if (!email) return notAuthorized();
  
  try {
    const currentUser = await User.findByEmail(email);
    if (!currentUser) return notAuthorized();

    const formData = await request.formData();
    const displayName = formData.get("displayName") as string;
    const newEmail = formData.get("email") as string;
    const profileImage = formData.get("profileImage") as File | null;

    if (!displayName || !newEmail) {
      return NextResponse.json(
        { message: "Display name and email are required" },
        { status: 400 }
      );
    }

    // Validate display name
    if (displayName.trim().length < 2) {
      return NextResponse.json(
        { message: "Display name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(newEmail.trim())) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check if the new email is already taken by another user
    if (newEmail.trim() !== currentUser.email) {
      const existingUser = await User.findByEmail(newEmail.trim());
      if (existingUser) {
        return NextResponse.json(
          { message: "This email address is already in use" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {
      displayName: displayName.trim(),
      email: newEmail.trim(),
    };

    // Handle profile image upload
    if (profileImage && profileImage.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(profileImage.type)) {
        return NextResponse.json(
          { message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
          { status: 400 }
        );
      }

      // Validate file size (5MB limit)
      if (profileImage.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "File size too large. Maximum 5MB allowed." },
          { status: 400 }
        );
      }

      try {
        const uploadResult = await uploadProfileImage(profileImage);
        
        if (uploadResult.success && uploadResult.url) {
          updateData.profileImageURL = uploadResult.url;
        } else {
          return NextResponse.json(
            { message: "Failed to upload profile image" },
            { status: 500 }
          );
        }
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        return NextResponse.json(
          { message: "Failed to upload profile image" },
          { status: 500 }
        );
      }
    }

    // Update user
    await currentUser.update(updateData);

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        email: currentUser.email,
        displayName: currentUser.displayName,
        profileImageURL: currentUser.profileImageURL,
      },
    });
    
  } catch (err: any) {
    console.error("Error updating profile:", err);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
};