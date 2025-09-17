import * as React from "react";
import { redirect, RedirectType } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import { getAnalysisSummary } from "@/lib/s3";
import AnalysisContent from "./AnalysisContent";
import { stat } from "fs";

interface AnalysisData {
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  organization: {
    slug: string;
    name: string;
  };
}

function capitalize(status: string) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "default";
    case "running":
      return "info";
    case "succeeded":
      return "success";
    case "failed":
      return "error";
    default:
      return "default";
  }
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{
    organizationSlug: string;
    projectSlug: string;
    analysisSlug: string;
  }>;
}) {
  const { organizationSlug, projectSlug, analysisSlug } = await params;

  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirect("/authentication/signin", RedirectType.push);

  const dbModels = await getDBModels();
  const { Organization, User, OrganizationAnalysis, Test, Project } = dbModels;

  const user = await User.findByEmail(email);
  if (!user) return redirect("/authentication/signin", RedirectType.push);

  // Check if user has access to this organization
  const organization = await Organization.findBySlugAndUserEmail(
    organizationSlug,
    email
  );
  if (!organization) return redirect("/organizations", RedirectType.push);

  const project = await Project.findBySlugAndOrganizationSlug(
    projectSlug,
    organizationSlug
  );
  if (!project) return redirect(`/organizations/${organizationSlug}/projects`, RedirectType.push);

  // Find the analysis by slug
  const analysis = await OrganizationAnalysis.findBySlugAndOrganization(analysisSlug, organization);
  if (!analysis || analysis.organization.slug !== organizationSlug) {
    return redirect(`/${organizationSlug}/analyses`, RedirectType.push);
  }

  // Get analysis summary from S3
  const analysisSummary = await getAnalysisSummary(analysisSlug);
  const finalResult = (analysisSummary && analysisSummary.final_result) ? JSON.parse(analysisSummary.final_result) : null;
  const analysisForClient = {
    slug: analysis.slug,
    status: analysis.status,
  };

  // Get all existing tests
  const tests = await Test.findAllByProjectSlug(projectSlug);


  return (
    <Box>
      <Box
        sx={{
          width: '100%',
          pl: { sm: 2 },
          pr: { xs: 1, sm: 2 },
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {capitalize(finalResult?.website) + ' Analysis' || "Website Analysis"}
            </Typography>
            {finalResult?.type && (
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Category: {finalResult?.type}
              </Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} textAlign={{ xs: "left", md: "right" }}>
            <Chip
              label={capitalize(analysis.status)}
              color={getStatusColor(analysis.status)}
              size="large"
              sx={{ fontWeight: 'bold', px: 2, py: 1 }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ p: { sm: 2 } }}>
        <AnalysisContent
          initialTests={tests}
          analysis={analysisForClient}
          analysisSummary={analysisSummary}
          organizationSlug={organizationSlug}
          projectSlug={projectSlug}
        />
      </Box>
    </Box>
  );
}