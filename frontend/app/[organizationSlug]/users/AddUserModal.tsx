"use client";

import * as React from "react";
import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { ChangeEvent } from "react";

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (user: any) => void;
  onInviteSent: (email: string) => void;
  organization: {
    slug: string;
    name: string;
    domain: string;
  };
  currentUserRole: string;
  organizationSlug: string;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
  onInviteSent,
  organization,
  currentUserRole,
  organizationSlug,
}: AddUserModalProps) {
  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserRole, setNewUserRole] = React.useState("user");
  const [isAddingUser, setIsAddingUser] = React.useState(false);
  const [error, setError] = React.useState("");
  const [domainConfirmOpen, setDomainConfirmOpen] = React.useState(false);
  
  // Email validation state
  const [showEmailError, setShowEmailError] = React.useState(false);
  const [emailError, setEmailError] = React.useState(false);

  const handleClose = () => {
    if (isAddingUser) return;
    setNewUserEmail("");
    setNewUserRole("user");
    setError("");
    setDomainConfirmOpen(false);
    setShowEmailError(false);
    setEmailError(false);
    onClose();
  };

  const handleEmailChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setError("");
    setEmailError(false);
    setShowEmailError(false);

    const newEmail = event.target.value;
    setNewUserEmail(newEmail);
    if (newEmail.trim() !== "" && !validateEmail(newEmail)) {
      setEmailError(true);
    }
  };

  const handleEmailBlur = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setError("");
    setShowEmailError(false);

    const newEmail = event.target.value;
    if (newEmail.trim() !== "" && !validateEmail(newEmail)) {
      setShowEmailError(true);
    }
  };

  const checkEmailDomain = (email: string) => {
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const orgDomain = organization.domain?.toLowerCase();
    return emailDomain === orgDomain;
  };

  const handleAddUserConfirm = async () => {
    if (!newUserEmail.trim()) {
      setError("Email address is required");
      return;
    }

    if (!validateEmail(newUserEmail.trim())) {
      setShowEmailError(true);
      setError("Please enter a valid email address");
      return;
    }

    // Check if email domain matches organization domain
    if (!checkEmailDomain(newUserEmail.trim())) {
      setDomainConfirmOpen(true);
      return;
    }

    await addUser();
  };

  const addUser = async () => {
    setIsAddingUser(true);
    setError("");

    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newUserEmail.trim(),
            role: newUserRole,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.user) {
          onUserAdded(data.user);
        } else if (data.invite) {
          onInviteSent(newUserEmail);
        }
        handleClose();
      } else {
        setError(data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setError("An error occurred while adding the user");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDomainConfirmYes = async () => {
    setDomainConfirmOpen(false);
    await addUser();
  };

  const handleDomainConfirmNo = () => {
    setDomainConfirmOpen(false);
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={handleClose}
        aria-labelledby="add-user-modal-title"
        aria-describedby="add-user-modal-description"
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
              width: 600,
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
                sx={{ display: "flex", flexGrow: 1, alignItems: "center" }}
              >
                <Typography variant="button">Add User to {organization.name}</Typography>
              </Box>
              <Box sx={{ mr: 1 }}>
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleClose}
                  disabled={isAddingUser}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ p: 1.5 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    slotProps={{
                      htmlInput: {
                        autoComplete: 'disabled'
                      }
                    }}
                    label="Email Address"
                    type="email"
                    value={newUserEmail}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    disabled={isAddingUser}
                    error={showEmailError}
                    helperText={
                      showEmailError 
                        ? "Please enter a valid email address" 
                        : "Enter the email address of the user you want to add"
                    }
                  />
                </Grid>

                <Grid size={12}>
                  <FormControl fullWidth disabled={isAddingUser}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={newUserRole}
                      label="Role"
                      onChange={(e) => setNewUserRole(e.target.value)}
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="tester">Tester</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      {currentUserRole === "owner" && (
                        <MenuItem value="owner">Owner</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Box
              sx={{
                px: 1.5,
                pb: 1.5,
                display: "flex",
                gap: 2,
              }}
            >
              <Button
                sx={{ borderRadius: "25px" }}
                size="large"
                fullWidth
                onClick={handleClose}
                disabled={isAddingUser}
              >
                Cancel
              </Button>
              <Button
                sx={{ borderRadius: "25px" }}
                size="large"
                fullWidth
                variant="contained"
                onClick={handleAddUserConfirm}
                disabled={
                  isAddingUser || 
                  emailError || 
                  newUserEmail.trim() === "" ||
                  !validateEmail(newUserEmail.trim())
                }
                startIcon={isAddingUser ? <CircularProgress size={20} /> : <PersonAddIcon />}
              >
                {isAddingUser ? "Adding..." : "Add User"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Domain Confirmation Dialog */}
      <Dialog
        open={domainConfirmOpen}
        onClose={handleDomainConfirmNo}
        aria-labelledby="domain-confirm-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="domain-confirm-dialog-title">
          Different Email Domain
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The email address <strong>{newUserEmail}</strong> doesn't match your organization's domain <strong>{organization.domain}</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to invite this external user to your organization?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDomainConfirmNo} disabled={isAddingUser}>
            Cancel
          </Button>
          <Button 
            onClick={handleDomainConfirmYes} 
            color="primary" 
            variant="contained"
            disabled={isAddingUser}
          >
            Yes, Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}