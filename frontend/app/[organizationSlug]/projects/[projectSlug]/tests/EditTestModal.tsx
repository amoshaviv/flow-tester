"use client";

import React, { ChangeEvent, FocusEvent, useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useParams } from "next/navigation";

const validateTitle = (title?: string) => title && title.length > 0;
const validateDescription = (description?: string) =>
  description && description.length > 0;

interface EditTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: {
    slug: string;
    title: string;
    description: string;
  };
  onTestUpdated: () => void;
}

export default function EditTestModal({
  isOpen,
  onClose,
  test,
  onTestUpdated,
}: EditTestModalProps) {
  const params = useParams();
  const { projectSlug, organizationSlug } = params;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editTestError, setEditTestError] = useState<string | null>("");

  const [showTitleError, setShowTitleError] = useState<boolean>(false);
  const [titleError, setTitleError] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");

  const [showDescriptionError, setShowDescriptionError] =
    useState<boolean>(false);
  const [descriptionError, setDescriptionError] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (test && isOpen) {
      setTitle(test.title);
      setDescription(test.description);
      setEditTestError("");
      setShowTitleError(false);
      setTitleError(false);
      setShowDescriptionError(false);
      setDescriptionError(false);
    }
  }, [test, isOpen]);

  const handleTitleChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setEditTestError("");
    setTitleError(false);
    setShowTitleError(false);

    const newTitle = event.target.value;
    setTitle(newTitle);
    if (!validateTitle(newTitle)) {
      setTitleError(true);
    }
  };

  const handleTitleBlur = (
    event: FocusEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setEditTestError("");
    setShowTitleError(false);

    const newTitle = event.target.value;
    if (!validateTitle(newTitle)) {
      setShowTitleError(true);
    }
  };

  const handleDescriptionChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setEditTestError("");
    setDescriptionError(false);
    setShowDescriptionError(false);

    const newDescription = event.target.value;
    setDescription(newDescription);
    if (!validateDescription(newDescription)) {
      setDescriptionError(true);
    }
  };

  const handleDescriptionBlur = (
    event: FocusEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setEditTestError("");
    setShowDescriptionError(false);

    const newDescription = event.target.value;
    if (!validateDescription(newDescription)) {
      setShowDescriptionError(true);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      setIsSubmitting(true);
      
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests/${test.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, description }),
        }
      );

      setIsSubmitting(false);
      
      if (response.status === 200) {
        onTestUpdated();
        onClose();
      } else {
        const data = await response.json();
        setEditTestError(
          data?.message || "An error occurred, please try again"
        );
      }
    } catch (error) {
      setIsSubmitting(false);
      setEditTestError("An error occurred, please try again");
    }
  }

  return (
    <Modal
      open={isOpen}
      aria-labelledby="edit-test-modal-title"
      aria-describedby="edit-test-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Box
          sx={{
            maxWidth: `calc(100vw - 16px)`,
            height: `calc(var(--unit-100vh) - 16px)`,
            width: 720,
            bgcolor: "background.paper",
            border: "2px solid #000",
            borderRadius: 2,
            boxShadow: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              pl: 1.5,
              pt: 1,
              pb: 1,
              borderBottom: "#000 1px solid",
              display: "flex",
            }}
          >
            <Box
              key="model-title"
              sx={{ display: "flex", flexGrow: 1, alignItems: "center" }}
            >
              <Typography variant="button">Create new version</Typography>
            </Box>
            <Box sx={{ mr: 1 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={onClose}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          <form onSubmit={handleSubmit}>
            <Box>
              <Grid container spacing={2} sx={{ p: 1.5 }}>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <TextField
                      required
                      id="title"
                      name="title"
                      label="Title"
                      placeholder="Search Results & Sorting"
                      variant="outlined"
                      value={title}
                      onBlur={handleTitleBlur}
                      onChange={handleTitleChange}
                      error={showTitleError}
                      disabled={isSubmitting}
                      helperText={
                        showTitleError ? "Please fill in a title" : ""
                      }
                    />
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <TextField
                      required
                      id="description"
                      name="description"
                      label="Description"
                      placeholder="Go to acme.com and search for straight boomerangs and sort by bananas score."
                      minRows={6}
                      multiline
                      variant="outlined"
                      value={description}
                      onBlur={handleDescriptionBlur}
                      onChange={handleDescriptionChange}
                      error={showDescriptionError}
                      disabled={isSubmitting}
                      helperText={
                        showDescriptionError
                          ? "Please fill in a valid description"
                          : ""
                      }
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            {editTestError && (
              <Box sx={{ px: 1.5, pb: 1 }}>
                <Typography color="error" variant="body2">
                  {editTestError}
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                px: 1.5,
                pb: 1.5,
                borderBottom: "#000 1px solid",
                display: "flex",
              }}
            >
              <Button
                sx={{ borderRadius: "25px" }}
                size="large"
                fullWidth
                type="submit"
                variant="contained"
                disabled={
                  titleError ||
                  descriptionError ||
                  title.trim() === "" ||
                  description.trim() === "" ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  "Update Test"
                )}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Modal>
  );
}