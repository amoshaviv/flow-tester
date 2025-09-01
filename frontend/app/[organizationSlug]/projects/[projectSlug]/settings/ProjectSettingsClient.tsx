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
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { kebabCase } from "change-case";

interface ProjectData {
  slug: string;
  name: string;
}

interface ProjectSettingsClientProps {
  project: ProjectData;
  organizationSlug: string;
  projectSlug: string;
}

export default function ProjectSettingsClient({
  project: initialProject,
  organizationSlug,
  projectSlug,
}: ProjectSettingsClientProps) {
  const [name, setName] = React.useState<string>(initialProject.name);
  const [slug, setSlug] = React.useState<string>(initialProject.slug);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [success, setSuccess] = React.useState<string>("");
  const [suggestedSlug, setSuggestedSlug] = React.useState<string>("");
  const router = useRouter();

  // Auto-generate slug when name changes
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setName(newName);
    setSlug(kebabCase(newName));
  };

  const handleSlugChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
    setError("");
    setSuggestedSlug("");
  };

  const handleUseSuggestedSlug = () => {
    setSlug(suggestedSlug);
    setError("");
    setSuggestedSlug("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !slug.trim()) {
      setError("Both name and slug are required");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setSuggestedSlug("");

    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.project.slug !== projectSlug) {
          router.push(`/${organizationSlug}/projects/${data.project.slug}/settings`);
        }
      } else {
        setError(data.message);
        if (data.suggestedSlug) {
          setSuggestedSlug(data.suggestedSlug);
        }
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setError("An error occurred while updating the project settings");
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = name !== initialProject.name || slug !== initialProject.slug;

  return (
    <Box>
      <Box
        sx={{
          width: '100%',
          pl: { sm: 2 },
          pr: { xs: 1, sm: 2 },
          height: 64,
          display: 'flex',
          alignItems: 'center',
        }}>
        <Grid container width="100%">
          <Grid size={{ md: 6, xs: 12 }}>
            <Typography variant="h6" component="h1">
              Project Settings
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Card sx={{ ml: 2, mr: 2 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ sm: 12 }}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={name}
                  onChange={handleNameChange}
                  disabled={isLoading}
                  helperText="The display name for your project"
                />
              </Grid>

              <Grid size={{ sm: 12 }}>
                <TextField
                  fullWidth
                  label="Project Slug"
                  value={slug}
                  onChange={handleSlugChange}
                  disabled={isLoading}
                  helperText="The URL-friendly identifier for your project (lowercase, letters, numbers, and hyphens only)"
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
                  startIcon={<SaveIcon />}
                  disabled={isLoading || !hasChanges}
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