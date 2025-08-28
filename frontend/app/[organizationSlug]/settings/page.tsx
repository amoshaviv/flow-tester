import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import NextLink from "next/link";
import { redirect, RedirectType } from 'next/navigation'

import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";

export default async function Home() {
  const session = await getSession();
  const email = session?.user?.email;
  if(!email) return redirect('/authentication/signin', RedirectType.push);

  const dbModels = await getDBModels();
  const { Organization, User } = dbModels;
  
  const user = await User.findByEmail(email);
  if(!user) return redirect('/authentication/signin', RedirectType.push);

  const organizations = await user.getOrganizations();
  
  if (!organizations || organizations.length === 0) return redirect('/organizations/create', RedirectType.push);
  
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Organization Settings
        </Typography>
      </Box>
    </Container>
  );
}
