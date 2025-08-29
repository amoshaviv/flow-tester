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
import { getTestRunSummary } from "@/lib/s3";
import ScreenshotsGrid from "./ScreenshotsGrid";

interface TestRunData {
  slug: string;
  modelSlug: string;
  modelProvider: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  version: {
    slug: string;
    title: string;
    description: string;
    number: number;
    isDefault: boolean;
  };
  createdBy: {
    displayName: string;
    profileImageURL: string;
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

function formatDateTime(dateString: Date) {
  return new Date(dateString).toLocaleString();
}

async function fetchTestRunData(
  organizationSlug: string,
  projectSlug: string,
  testSlug: string,
  testRunSlug: string
): Promise<TestRunData | null> {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/organizations/${organizationSlug}/projects/${projectSlug}/tests/${testSlug}/runs/${testRunSlug}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.testRun;
  } catch (error) {
    console.error("Error fetching test run data:", error);
    return null;
  }
}

export default async function TestRunPage({
  params,
}: {
  params: Promise<{
    organizationSlug: string;
    projectSlug: string;
    testSlug: string;
    testRunSlug: string;
  }>;
}) {
  const { organizationSlug, projectSlug, testSlug, testRunSlug } = await params;

  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirect("/authentication/signin", RedirectType.push);

  const dbModels = await getDBModels();
  const { Organization, User, Project, Test, TestRun } = dbModels;

  const user = await User.findByEmail(email);
  if (!user) return redirect("/authentication/signin", RedirectType.push);

  // Check if user has access to this organization
  const organization = await Organization.findBySlugAndUserEmail(
    organizationSlug,
    email
  );
  if (!organization) return redirect("/organizations", RedirectType.push);

  // Check if project exists in this organization
  const project = await Project.findBySlugAndOrganizationSlug(
    projectSlug,
    organizationSlug
  );
  if (!project) return redirect(`/${organizationSlug}`, RedirectType.push);

  // We need to find the test slug from the test run
  // For now, we'll need to fetch all tests and find the matching one
  let testRun = await TestRun.findBySlug(testRunSlug, testSlug, project);

  if (!testRun) {
    return redirect(`/${organizationSlug}/${projectSlug}/runs`, RedirectType.push);
  }

  const testRunSummary = await getTestRunSummary(testRunSlug);

  return (
    <Box>
      <Box
        sx={{
          width: '100%',
          pl: { sm: 2 },
          pr: { xs: 1, sm: 2 },
          height: 64,
          display: 'flex',
          alignItems: 'center',
        }}>
        <Grid container width="100%">
          <Grid size={{ md: 6, xs: 12 }}>
            <Typography variant="h6" component="h1">
              {testRun.version.title} - Test Run Details
            </Typography>
          </Grid>
          <Grid size={{ md: 6, xs: 12 }} textAlign="right">
            <Chip
              label={capitalize(testRun.status)}
              color={getStatusColor(testRun.status)}
              sx={{ mt: 0.5, fontWeight: 'bold' }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 2 },
        }}>
        <Grid container spacing={2}>
          <Grid size={{ md: 6, xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Run Information
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                      Status:
                    </Typography>
                    <Typography fontWeight="bold" variant="body1" color={getStatusColor(testRun.status)}>
                      {capitalize(testRun.status)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                      Created:
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(testRun.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                      Last Updated:
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(testRun.updatedAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                      Created By:
                    </Typography>
                    <Typography variant="body1">
                      {testRun.createdBy.displayName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                      Test:
                    </Typography>
                    <Typography variant="body1">
                      {testRun.version.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                      Test Version:
                    </Typography>
                    <Typography variant="body1">
                      {testRun.version.number}
                      {testRun.version.isDefault && (<b>{" (Current Default)"}</b>)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                      Model:
                    </Typography>
                    <Typography variant="body1">
                      {testRun.modelSlug}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body1" color="text.secondary">
                      Test Description:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {testRun.version.description}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Agent Steps
                </Typography>
                {testRun.status === "pending" || testRun.status === "running" ? (
                  <Typography variant="body1" color="text.secondary">
                    Test results will be available after the test run completes.
                  </Typography>
                ) : (
                  testRunSummary && testRunSummary.model_thoughts.map((thought, idx) =>
                    <Box key={`thought-${idx}`} sx={{ mt: 2, display: 'flex' }}>
                      <Box sx={{ fontFamily: "monospace", fontWeight: 'bold', mr: 1, borderRadius: 1, height: 40, width: 40, border: '1px solid gray', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{idx + 1}</Box>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {thought.memory}
                      </Typography>
                    </Box>
                  )
                )}
              </CardContent>
            </Card>
          </Grid>
          {/* Screenshots Section */}
          <Grid size={{ md: 6, xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Final Result
                </Typography>
                {testRun.status === "pending" || testRun.status === "running" ? (
                  <Typography variant="body1" color="text.secondary">
                    Test results will be available after the test run completes.
                  </Typography>
                ) : (
                  testRunSummary &&
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {testRunSummary.final_result}
                  </Typography>
                )}
              </CardContent>
            </Card>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Screenshots
                </Typography>
                {testRun.status === "pending" || testRun.status === "running" ? (
                  <Typography variant="body1" color="text.secondary">
                    Screenshots will be available after the test run completes.
                  </Typography>
                ) : (
                  <ScreenshotsGrid 
                    screenshots={testRunSummary?.screenshots?.filter((value, idx) => idx > 0) || []}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}