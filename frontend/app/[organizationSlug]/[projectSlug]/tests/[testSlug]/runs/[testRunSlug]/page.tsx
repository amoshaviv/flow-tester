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

interface TestRunData {
  slug: string;
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

function formatDateTime(dateString: string) {
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
    <Grid>
      {/* Header with back button */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center"}}>
        <Button
          component={Link}
          href={`/${organizationSlug}/${projectSlug}/runs`}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Runs
        </Button>
        <Typography variant="h4" component="h1">
          Test Run Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Test Run Status and Basic Info */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Run Information
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column"}}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={testRun.status} 
                    color={getStatusColor(testRun.status)}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Run ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                    {testRun.slug}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(testRun.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(testRun.updatedAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body1">
                    {testRun.createdBy.displayName}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Version Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Version
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column"}}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1">
                    {testRun.version.title}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Version Number
                  </Typography>
                  <Typography variant="body1">
                    v{testRun.version.number}
                    {testRun.version.isDefault && (
                      <Chip 
                        label="Default" 
                        size="small" 
                        sx={{ ml: 1 }}
                        color="primary"
                      />
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Version ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                    {testRun.version.slug}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {testRun.version.description}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Screenshots Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Screenshots
              </Typography>
              {testRun.status === "pending" || testRun.status === "running" ? (
                <Typography variant="body1" color="text.secondary">
                  Screenshots will be available after the test run completes.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap"}}>
                  {/* We'll need to implement screenshot loading from S3 */}
                  <Typography variant="body1" color="text.secondary">
                    Screenshots loading will be implemented based on S3 storage structure.
                  </Typography>
                  {/* Placeholder for screenshots */}
                  {testRunSummary && testRunSummary.screenshots.map((screenshot) => (
                    <Box
                      key={screenshot.id}
                      sx={{
                        width: 200,
                        height: 150,
                        backgroundColor: "grey.200",
                        border: "1px solid",
                        borderColor: "grey.300",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img src={screenshot.path}/>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              {testRun.status === "pending" || testRun.status === "running" ? (
                <Typography variant="body1" color="text.secondary">
                  Test results will be available after the test run completes.
                </Typography>
              ) : (
                <Box>
                  <Typography variant="body1" color="text.secondary">
                    Detailed test results and execution data will be displayed here.
                  </Typography>
                  {/* Placeholder for results data */}
                  <Box sx={{ mt: 2, p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      Results data from S3: test-runs/{testRun.slug}/run.json
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}