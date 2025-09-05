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
import { kebabCase } from "change-case";
import { ChangeEvent } from "react";

// Validation functions
const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

const validateSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2;
};

const validateDomainFormat = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
};

interface OrganizationData {
  slug: string;
  name: string;
  domain: string;
  profileImageURL?: string;
}

interface OrganizationSettingsClientProps {
  organization: OrganizationData;
  organizationSlug: string;
}

export default function OrganizationSettingsClient({
  organization: initialOrganization,
  organizationSlug,
}: OrganizationSettingsClientProps) {
  const [name, setName] = React.useState<string>(initialOrganization.name);
  const [slug, setSlug] = React.useState<string>(initialOrganization.slug);
  const [domain, setDomain] = React.useState<string>(initialOrganization.domain);
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = React.useState<string>(
    initialOrganization.profileImageURL || ""
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const [suggestedSlug, setSuggestedSlug] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Validation state
  const [showNameError, setShowNameError] = React.useState(false);
  const [nameError, setNameError] = React.useState(false);
  const [showSlugError, setShowSlugError] = React.useState(false);
  const [slugError, setSlugError] = React.useState(false);
  const [showDomainError, setShowDomainError] = React.useState(false);
  const [domainError, setDomainError] = React.useState(false);

  // Auto-generate slug when name changes
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setNameError(false);
    setSlugError(false);
    setShowNameError(false);
    setShowSlugError(false);

    const newName = event.target.value;
    setName(newName);
    setSlug(kebabCase(newName));

    if (!validateName(newName)) {
      setNameError(true);
    }
  };

  const handleNameBlur = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setShowNameError(false);

    const newName = event.target.value;
    if (!validateName(newName)) {
      setShowNameError(true);
    }

    const newSlug = kebabCase(newName);
    if (!validateSlug(newSlug)) {
      setShowSlugError(true);
    }
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSlugError(false);
    setShowSlugError(false);
    setSuggestedSlug("");

    const newSlug = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSlug(newSlug);

    if (!validateSlug(newSlug)) {
      setSlugError(true);
    }
  };

  const handleSlugBlur = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setShowSlugError(false);

    const newSlug = event.target.value;
    if (!validateSlug(newSlug)) {
      setShowSlugError(true);
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
    setProfileImagePreview(initialOrganization.profileImageURL || "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUseSuggestedSlug = () => {
    setSlug(suggestedSlug);
    setError("");
    setSuggestedSlug("");
  };

  const handleDomainChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setDomainError(false);
    setShowDomainError(false);

    const newDomain = event.target.value;
    setDomain(newDomain);

    if (!validateDomainFormat(newDomain)) {
      setDomainError(true);
    }
  };

  const handleDomainBlur = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setShowDomainError(false);

    const newDomain = event.target.value;
    if (!validateDomainFormat(newDomain)) {
      setShowDomainError(true);
    }
  };

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !slug.trim() || !domain.trim()) {
      setError("Name, slug, and domain are required");
      return;
    }

    if (!validateDomain(domain.trim())) {
      setError("Please enter a valid domain (e.g., example.com, subdomain.example.org)");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setSuggestedSlug("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("slug", slug.trim());
      formData.append("domain", domain.trim());

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch(
        `/api/organizations/${organizationSlug}`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.organization.slug !== organizationSlug) {
          router.push(`/${data.organization.slug}/settings`);
        } else {
          // Update the profile image preview with the new URL if it was uploaded
          if (data.organization.profileImageURL) {
            router.refresh();
          }
        }
      } else {
        setError(data.message);
        if (data.suggestedSlug) {
          setSuggestedSlug(data.suggestedSlug);
        }
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      setError("An error occurred while updating the organization settings");
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges =
    name !== initialOrganization.name ||
    slug !== initialOrganization.slug ||
    domain !== initialOrganization.domain ||
    profileImage !== null;

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
              {name} Settings
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
                    {name.charAt(0).toUpperCase()}
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
                    {(profileImage) && (
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
                  Upload a profile image for your organization (JPEG, PNG, GIF, or WebP, max 5MB)
                </Typography>
              </Grid>

              <Grid size={{ sm: 12 }}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  value={name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  disabled={isLoading}
                  error={showNameError}
                  helperText={
                    showNameError
                      ? "Organization name must be at least 2 characters long"
                      : "The display name for your organization"
                  }
                />
              </Grid>

              <Grid size={{ sm: 12 }}>
                <TextField
                  fullWidth
                  label="Organization Slug"
                  value={slug}
                  onChange={handleSlugChange}
                  onBlur={handleSlugBlur}
                  disabled={isLoading}
                  error={showSlugError}
                  helperText={
                    showSlugError
                      ? "Slug must be at least 2 characters and contain only lowercase letters, numbers, and hyphens"
                      : "The URL-friendly identifier for your organization (lowercase, letters, numbers, and hyphens only)"
                  }
                />
              </Grid>

              <Grid size={{ sm: 12 }}>
                <TextField
                  fullWidth
                  label="Organization Domain"
                  value={domain}
                  onChange={handleDomainChange}
                  onBlur={handleDomainBlur}
                  disabled={isLoading}
                  error={showDomainError}
                  helperText={
                    showDomainError
                      ? "Please enter a valid domain (e.g., example.com, subdomain.example.org)"
                      : "The domain name for your organization (e.g., acme-corp.com)"
                  }
                />
              </Grid>

              {error && (
                <Grid size={{ sm: 12 }}>
                  <Alert severity="error">
                    {error}
                    {suggestedSlug && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Try this instead:{" "}
                          <Button
                            variant="text"
                            size="small"
                            onClick={handleUseSuggestedSlug}
                          >
                            {suggestedSlug}
                          </Button>
                        </Typography>
                      </Box>
                    )}
                  </Alert>
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
                    slugError ||
                    domainError ||
                    name.trim() === "" ||
                    slug.trim() === "" ||
                    domain.trim() === "" ||
                    !validateName(name) ||
                    !validateSlug(slug) ||
                    !validateDomainFormat(domain)
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