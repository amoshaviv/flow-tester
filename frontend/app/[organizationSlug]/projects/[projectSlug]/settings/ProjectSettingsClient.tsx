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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Save as SaveIcon, Delete as DeleteIcon } from "@mui/icons-material";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const router = useRouter();

  // Validation state
  const [showNameError, setShowNameError] = React.useState(false);
  const [nameError, setNameError] = React.useState(false);
  const [showSlugError, setShowSlugError] = React.useState(false);
  const [slugError, setSlugError] = React.useState(false);

  // Auto-generate slug when name changes
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setNameError(false);
    setSlugError(false);
    setShowNameError(false);
    setShowSlugError(false);

    const newName = event.target.value;
    const newSlug = kebabCase(newName);
    setName(newName);
    setSlug(newSlug);
    
    if (!validateName(newName)) {
      setNameError(true);
    }

    if (!validateSlug(newSlug)) {
      setSlugError(true);
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        router.push(`/${organizationSlug}/projects`);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete project");
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      setError("An error occurred while deleting the project");
      setDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  const hasChanges = name !== initialProject.name || slug !== initialProject.slug;

  return (
    <Box>
      <Card sx={{ borderRadius: 0 }}>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              width: '100%',
              pl: { sm: 2 },
              pr: { xs: 1, sm: 2 },
              height: 64,
              display: 'flex',
              alignItems: 'center',
            }}>
            <Typography variant="h6" component="h1">
              Project Settings
            </Typography>
          </Box>
          <Box sx={{ px: 2 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ sm: 12 }}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={name}
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    disabled={isLoading}
                    error={showNameError}
                    helperText={
                      showNameError 
                        ? "Project name must be at least 2 characters long" 
                        : "The display name for your project"
                    }
                  />
                </Grid>

                <Grid size={{ sm: 12 }}>
                  <TextField
                    fullWidth
                    label="Project Slug"
                    value={slug}
                    onChange={handleSlugChange}
                    onBlur={handleSlugBlur}
                    disabled={isLoading}
                    error={showSlugError}
                    helperText={
                      showSlugError 
                        ? "Slug must be at least 2 characters and contain only lowercase letters, numbers, and hyphens" 
                        : "The URL-friendly identifier for your project (lowercase, letters, numbers, and hyphens only)"
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

                <Grid>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={
                      isLoading || 
                      !hasChanges ||
                      nameError || 
                      slugError || 
                      name.trim() === "" ||
                      slug.trim() === "" ||
                      !validateName(name) ||
                      !validateSlug(slug)
                    }
                    size="large"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </Grid>
                <Grid>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteClick}
                    disabled={isLoading || isDeleting}
                    size="large"
                  >
                    Delete Project
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Project "{initialProject.name}"?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            This action will permanently delete the project "{initialProject.name}" and all of its associated data including:
            <br />
            <br />
            • All tests and test configurations
            <br />
            • All test runs and their results
            <br />
            • All screenshots and artifacts
            <br />
            • All project settings and history
            <br />
            <br />
            <strong>This action cannot be undone.</strong> Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? undefined : <DeleteIcon />}
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}