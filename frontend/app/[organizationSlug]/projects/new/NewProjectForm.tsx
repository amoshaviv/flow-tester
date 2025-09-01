"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import NavBar from "@/app/components/layout/NavBar";

import {
  CircularProgress,
  Button,
  FormControl,
  TextField,
  Typography,
} from "@mui/material";

const validateName = (name: string) => {
  return String(name).length > 0;
};

const validateDomain = (domain: string) => {
  return String(domain)
    .toLowerCase()
    .match(
      /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/
    );
};


interface NewProjectFormProps {
  organizationSlug: string;
}

export default function NewProjectForm({ organizationSlug }: NewProjectFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>("");

  const [showNameError, setShowNameError] = useState<boolean>(false);
  const [nameError, setNameError] = useState<boolean>(false);
  const [name, setName] = useState<string>("");

  const handleNameChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setCreateError("");
    setNameError(false);
    setShowNameError(false);

    const newName = event.target.value;
    setName(newName);
    if (!validateName(newName)) {
      setNameError(true);
    }
  };

  const handleNameBlur = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setCreateError("");
    setShowNameError(false);

    const newName = event.target.value;
    if (!validateName(newName)) {
      setShowNameError(true);
    }
  };
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setIsSubmitting(true);
      await fetch(`/api/organizations/${organizationSlug}/projects`, {
        method: "PUT", // Method put is to create
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      })
        .then(async (res) => {
          const responseData = await res.json();
          if (res.status !== 200) {
            setIsSubmitting(false);
            setCreateError(
              responseData?.message || "An error occurred, please try again"
            );
          } else {
            router.push(`/${organizationSlug}/projects/${responseData.slug}`);
          }
        })
        .catch((e) => {
          setIsSubmitting(false);
          setCreateError("An error occurred, please try again");
        });
    } catch {
      setCreateError("An error occurred during login");
    }
  }

  return (
    <>
      <NavBar />
      <form onSubmit={handleSubmit}>
        <Grid
          justifyContent="center"
          alignItems="center"
          container
        >
          <Grid container size={{ xs: 10, md: 4 }} spacing={3}>
            <Grid justifyContent="center" alignItems="center" size={12}>
              <Typography textAlign="center" variant="h5">
                Create new project
              </Typography>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <TextField
                  required
                  id="name"
                  name="name"
                  label="Name"
                  variant="outlined"
                  placeholder="ACME"
                  onBlur={handleNameBlur}
                  onChange={handleNameChange}
                  error={showNameError}
                  disabled={isSubmitting}
                  helperText={showNameError ? "Please fill in a valid name" : ""}
                />
              </FormControl>
            </Grid>

            <Grid size={12}>
              <Button
                disabled={
                  nameError ||
                  name.trim() === "" ||
                  isSubmitting
                }
                fullWidth
                variant="contained"
                type="submit"
              >
                {isSubmitting ? (
                  <CircularProgress size={24} />
                ) : (
                  "Create Project"
                )}
              </Button>
            </Grid>
            {createError !== "" && (
              <Grid sx={{ textAlign: "center" }} size={12}>
                <Typography color="error" variant="caption">
                  {createError}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Grid>
      </form>
    </>
  );
}
