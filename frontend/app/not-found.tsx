import * as React from "react";
import NavBar from "@/app/components/layout/NavBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default async function OrganizationLayout(props: {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}) {
  return (
    <Container maxWidth="lg">
      <NavBar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Could not found...
        </Typography>
      </Box>
    </Container>
  );
}
