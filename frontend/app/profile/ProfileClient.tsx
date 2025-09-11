"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Avatar,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Save as SaveIcon, PhotoCamera, Delete as DeleteIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChangeEvent } from "react";

// Validation functions
const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

const validateEmail = (email: string): boolean => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    ) !== null;
};

interface UserData {
  email: string;
  displayName: string;
  profileImageURL?: string;
}

interface ProfileClientProps {
  user: UserData;
}

export default function ProfileClient({
  user: initialUser,
}: ProfileClientProps) {
  const [displayName, setDisplayName] = React.useState<string>(initialUser.displayName || "");
  const [email, setEmail] = React.useState<string>(initialUser.email);
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = React.useState<string>(
    initialUser.profileImageURL || ""
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { update } = useSession();

  // Validation state
  const [showNameError, setShowNameError] = React.useState(false);
  const [nameError, setNameError] = React.useState(false);
  const [showEmailError, setShowEmailError] = React.useState(false);
  const [emailError, setEmailError] = React.useState(false);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setNameError(false);
    setShowNameError(false);

    const newName = event.target.value;
    setDisplayName(newName);

    if (newName.trim() !== "" && !validateName(newName)) {
      setNameError(true);
    }
  };

  const handleNameBlur = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setShowNameError(false);

    const newName = event.target.value;
    if (newName.trim() !== "" && !validateName(newName)) {
      setShowNameError(true);
    }
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setEmailError(false);
    setShowEmailError(false);

    const newEmail = event.target.value;
    setEmail(newEmail);

    if (newEmail.trim() !== "" && !validateEmail(newEmail)) {
      setEmailError(true);
    }
  };

  const handleEmailBlur = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setShowEmailError(false);

    const newEmail = event.target.value;
    if (newEmail.trim() !== "" && !validateEmail(newEmail)) {
      setShowEmailError(true);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Maximum 5MB allowed.");
        return;
      }

      setProfileImage(file);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(initialUser.profileImageURL || "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!displayName.trim() || !email.trim()) {
      setError("Display name and email are required");
      return;
    }

    if (!validateName(displayName.trim())) {
      setError("Please enter a valid display name (at least 2 characters)");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("displayName", displayName.trim());
      formData.append("email", email.trim());

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Profile updated successfully");

        // Update the profile image preview with the new URL if it was uploaded
        if (data.user.profileImageURL) {
          setProfileImagePreview(data.user.profileImageURL);
          setProfileImage(null);
        }

        // Update the NextAuth session with new user data
        try {
          console.log('Attempting to update session with:', data.user);
          await update({
            email: data.user.email,
            displayName: data.user.displayName,
            profileImageURL: data.user.profileImageURL,
          });
          console.log('Session update completed successfully');
        } catch (updateError) {
          console.error('Session update failed:', updateError);
        }

        // Refresh the page to ensure all components reflect the changes
        router.refresh();
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred while updating your profile");
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    displayName !== (initialUser.displayName || "") ||
    email !== initialUser.email ||
    profileImage !== null;

  const getInitials = (name?: string, emailAddr?: string) => {
    if (name && name.trim()) {
      return name.split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return emailAddr ? emailAddr[0].toUpperCase() : '?';
  };

  return (
    <Box>
      <Card>
        <CardContent sx={{ py: 0 }}>
          <Box
            sx={{
              width: '100%',
              height: 64,
              display: 'flex',
              alignItems: 'center',
            }}>
            <Typography variant="h6" component="h1">
              Profile Settings
            </Typography>
          </Box>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ sm: 12 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar
                    src={profileImagePreview}
                    sx={{ width: 80, height: 80, borderRadius: 2, }}
                  >
                    {getInitials(displayName, email)}
                  </Avatar>
                  <Box>
                    <input
                      ref={fileInputRef}
                      accept="image/*"
                      type="file"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<PhotoCamera />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      sx={{ mr: 1 }}
                    >
                      Upload Image
                    </Button>
                    {profileImage && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleRemoveImage}
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Upload a profile image (JPEG, PNG, GIF, or WebP, max 5MB)
                </Typography>
              </Grid>

              <Grid size={{ sm: 12 }}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={displayName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  disabled={isLoading}
                  error={showNameError}
                  helperText={
                    showNameError
                      ? "Display name must be at least 2 characters long"
                      : "Your full name or display name"
                  }
                />
              </Grid>

              <Grid size={{ sm: 12 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  disabled={isLoading}
                  error={showEmailError}
                  helperText={
                    showEmailError
                      ? "Please enter a valid email address"
                      : "Your email address for account access and notifications"
                  }
                />
              </Grid>

              {error && (
                <Grid size={{ sm: 12 }}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              {success && (
                <Grid size={{ sm: 12 }}>
                  <Alert severity="success">{success}</Alert>
                </Grid>
              )}

              <Grid size={{ sm: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={
                    isLoading ||
                    !hasChanges ||
                    nameError ||
                    emailError ||
                    displayName.trim() === "" ||
                    email.trim() === "" ||
                    !validateName(displayName) ||
                    !validateEmail(email)
                  }
                  size="large"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}