"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
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

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>("");

  const [showNameError, setShowNameError] = useState<boolean>(false);
  const [nameError, setNameError] = useState<boolean>(false);
  const [name, setName] = useState<string>("");

  const [showDomainError, setShowDomainError] = useState<boolean>(false);
  const [domainError, setDomainError] = useState<boolean>(false);
  const [domain, setDomain] = useState<string>("");

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

  const handleDomainChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setCreateError("");
    setDomainError(false);
    setShowDomainError(false);

    const newDomain = event.target.value;
    setDomain(newDomain);
    if (!validateDomain(newDomain)) {
      setDomainError(true);
    }
  };

  const handleDomainBlur = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setCreateError("");
    setShowDomainError(false);

    const newDomain = event.target.value;
    if (!validateDomain(newDomain)) {
      setShowDomainError(true);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setIsSubmitting(true);
      await fetch("/api/organizations", {
        method: "PUT", // Method put is to create
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      })
        .then((res) => {
          console.log(res);
          setIsSubmitting(false);
          setCreateError("Invalid credentials");
        })
        .catch((e) => {
          setIsSubmitting(false);
          setCreateError("Invalid credentials");
        });

    //   router.push("/");
    //   router.refresh();
    } catch {
      setCreateError("An error occurred during login");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid
        justifyContent="center"
        alignItems="center"
        sx={{ mt: 6 }}
        container
      >
        <Grid container size={{ xs: 10, md: 4 }} spacing={3}>
          <Grid justifyContent="center" alignItems="center" size={12}>
            <Typography textAlign="center" variant="h5">
              Create new organization
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
            <FormControl fullWidth>
              <TextField
                required
                id="domain"
                name="domain"
                type="domain"
                placeholder="acme.com"
                label="Domain"
                variant="outlined"
                onBlur={handleDomainBlur}
                onChange={handleDomainChange}
                error={showDomainError}
                disabled={isSubmitting}
                helperText={
                  showDomainError ? "Please enter a valid domain" : ""
                }
              />
            </FormControl>
          </Grid>

          <Grid size={12}>
            <Button
              disabled={
                nameError ||
                domainError ||
                name.trim() === "" ||
                domain.trim() === "" ||
                isSubmitting
              }
              fullWidth
              variant="contained"
              type="submit"
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                "Create Organization"
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
  );
}
