import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { redirect, RedirectType } from "next/navigation";

import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import NewTestModal from "./NewTestModal";

export default async function Tests(props: {
  params: Promise<{ projectSlug: string; organizationSlug: string }>;
}) {
  const { params } = props;
  const { projectSlug, organizationSlug } = await params;
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirect("/authentication/signin", RedirectType.push);

  return (
    <Box sx={{ p: 1.2, pl: 2 }}>
      <Grid container>
        <Grid size="grow">
          <Typography variant="h4" fontWeight="bold" component="h1">
            Tests
          </Typography>
        </Grid>
        <Grid size={3}>
          <NewTestModal />
        </Grid>
      </Grid>
    </Box>
  );
}
