import * as React from "react";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import Link from "next/link";

export default function ExpiredInvitePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
        <AccessTimeIcon sx={{ fontSize: 64, color: 'warning.main', mb: 3 }} />
        
        <Typography variant="h4" component="h1" gutterBottom>
          Invitation Expired
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          This invitation link has expired or is no longer valid. 
          Please contact the person who invited you to request a new invitation.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            component={Link}
            href="/authentication/signin"
            variant="contained"
            size="large"
          >
            Sign In
          </Button>
          
          <Button
            component={Link}
            href="/"
            variant="outlined"
            size="large"
          >
            Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}