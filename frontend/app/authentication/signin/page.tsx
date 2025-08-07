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

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const validatePassword = (password: string) => {
  return String(password).length > 7;
};

export default function SigninPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [signinError, setSigninError] = useState<string | null>("");

  const [showEmailError, setShowEmailError] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const [showPasswordError, setShowPasswordError] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

  const handleEmailChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setSigninError("");
    setEmailError(false);
    setShowEmailError(false);

    const newEmail = event.target.value;
    setEmail(newEmail);
    if (!validateEmail(newEmail)) {
      setEmailError(true);
    }
  };

  const handleEmailBlur = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setSigninError("");
    setShowEmailError(false);

    const newEmail = event.target.value;
    if (!validateEmail(newEmail)) {
      setShowEmailError(true);
    }
  };

  const handlePasswordChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setSigninError("");
    setPasswordError(false);
    setShowPasswordError(false);

    const newPassword = event.target.value;
    setPassword(newPassword);
    if (!validatePassword(newPassword)) {
      setPasswordError(true);
    }
  };

  const handlePasswordBlur = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setSigninError("");
    setShowPasswordError(false);

    const newPassword = event.target.value;
    if (!validatePassword(newPassword)) {
      setShowPasswordError(true);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setIsSubmitting(true);
      const response = await signIn("credentials", {
        ...Object.fromEntries(formData),
        redirect: false,
      });

      if (response?.error) {
        setIsSubmitting(false);
        setSigninError("Invalid credentials");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setSigninError("An error occurred during login");
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
              Sign in to Flowtester
            </Typography>
          </Grid>
          <Grid size={12}>
            <FormControl fullWidth>
              <TextField
                required
                id="email"
                name="email"
                label="Email"
                variant="outlined"
                onBlur={handleEmailBlur}
                onChange={handleEmailChange}
                error={showEmailError}
                disabled={isSubmitting}
                helperText={
                  showEmailError ? "Please fill in a valid email" : ""
                }
              />
            </FormControl>
          </Grid>
          <Grid size={12}>
            <FormControl fullWidth>
              <TextField
                required
                id="password"
                name="password"
                type="password"
                label="Password"
                variant="outlined"
                onBlur={handlePasswordBlur}
                onChange={handlePasswordChange}
                error={showPasswordError}
                disabled={isSubmitting}
                helperText={
                  showPasswordError
                    ? "Please enter a valid password(At least 8 characters)"
                    : ""
                }
              />
            </FormControl>
          </Grid>

          <Grid size={12}>
            <Button
              disabled={
                emailError ||
                passwordError ||
                email.trim() === "" ||
                password.trim() === "" ||
                isSubmitting
              }
              fullWidth
              variant="contained"
              type="submit"
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
          </Grid>
          {signinError !== "" && (
            <Grid sx={{ textAlign: "center" }} size={12}>
              <Typography color="error" variant="caption">
                {signinError}
              </Typography>
            </Grid>
          )}
          <Grid sx={{ textAlign: "center" }} size={12}>
            <Typography variant="caption">
              By clicking Sign In, you agree to our{" "}
              <a href="/terms-of-service.html">Terms</a>. Learn how we collect,
              use and share your data in our{" "}
              <a href="/privacy-policy.html">Privacy Policy</a> and how we use
              cookies and similar technology in our{" "}
              <a href="/cookies-policy.html">Cookies Policy</a>.
            </Typography>
          </Grid>
          <Grid sx={{ textAlign: "center" }} size={12}>
            <Link
              href="/authentication/signup"
              className="text-blue-600 hover:underline"
            >
              No account? Register.
            </Link>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
}
