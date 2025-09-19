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

interface EditTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  testSuite: {
    slug: string;
    title: string;
    description: string;
  };
  onTestSuiteUpdated: () => void;
}

export default function EditTestSuiteModal({
  isOpen,
  onClose,
  testSuite,
  onTestSuiteUpdated,
}: EditTestSuiteModalProps) {
  const params = useParams();
  const { projectSlug, organizationSlug } = params;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editTestSuiteError, setEditTestSuiteError] = useState<string | null>("");

  const [showTitleError, setShowTitleError] = useState<boolean>(false);
  const [titleError, setTitleError] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");

  const [showDescriptionError, setShowDescriptionError] =
    useState<boolean>(false);
  const [descriptionError, setDescriptionError] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (testSuite && isOpen) {
      setTitle(testSuite.title);
      setDescription(testSuite.description);
      setEditTestSuiteError("");
      setShowTitleError(false);
      setTitleError(false);
      setShowDescriptionError(false);
      setDescriptionError(false);
    }
  }, [testSuite, isOpen]);

  const handleTitleChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setEditTestSuiteError("");
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
    setEditTestSuiteError("");
    setShowTitleError(false);

    const newTitle = event.target.value;
    if (!validateTitle(newTitle)) {
      setShowTitleError(true);
    }
  };

  const handleDescriptionChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setEditTestSuiteError("");
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
    setEditTestSuiteError("");
    setShowDescriptionError(false);

    const newDescription = event.target.value;
    if (!validateDescription(newDescription)) {
      setShowDescriptionError(true);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setIsSubmitting(true);
      await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${testSuite.slug}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Object.fromEntries(formData)),
        }
      )
        .then((res) => {
          setIsSubmitting(false);
          if (res.status === 200) {
            onTestSuiteUpdated();
            onClose();
            setEditTestSuiteError("");
          } else {
            res.json().then((data) => {
              setEditTestSuiteError(
                data?.message || "An error occurred, please try again"
              );
            });
          }
        })
        .catch((e) => {
          setIsSubmitting(false);
          setEditTestSuiteError("An error occurred, please try again");
        });
    } catch {
      setEditTestSuiteError("An error occurred, please try again");
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
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
              <Typography variant="button">Edit test suite</Typography>
            </Box>
            <Box sx={{ mr: 1 }}>
              <IconButton color="inherit" edge="start" onClick={onClose}>
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
                      value={title}
                      variant="outlined"
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
                      value={description}
                      minRows={6}
                      maxRows={14}
                      multiline
                      variant="outlined"
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
                {editTestSuiteError && (
                  <Grid size={12}>
                    <Typography color="error">{editTestSuiteError}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
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
                  "Update Test Suite"
                )}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Modal>
  );
}