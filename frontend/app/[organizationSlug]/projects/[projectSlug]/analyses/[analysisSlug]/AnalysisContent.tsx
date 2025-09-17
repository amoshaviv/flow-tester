"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/navigation";
import { AnalysisSummary, AnalysisTestCase } from "@/lib/s3";
import TestsTable from "../../tests/TestsTable";

interface AnalysisContentProps {
  analysis: any;
  analysisSummary: AnalysisSummary | null;
  organizationSlug: string;
  projectSlug: string;
  initialTests: any[];
}

interface TestCreationStatus {
  [key: string]: boolean;
}

export default function AnalysisContent({
  analysis,
  analysisSummary,
  organizationSlug,
  projectSlug,
  initialTests,
}: AnalysisContentProps) {
  const finalResult = (analysisSummary && analysisSummary.final_result) ? JSON.parse(analysisSummary.final_result) : null;
  const [testCreationStatus, setTestCreationStatus] = React.useState<TestCreationStatus>({});
  const [isCreatingTest, setIsCreatingTest] = React.useState<string | null>(null);
  const [tests, setTests] = React.useState<any[]>(initialTests);
  const [testsLoading, setTestsLoading] = React.useState(true);

  // Load tests for the project
  const loadTests = React.useCallback(async () => {
    setTestsLoading(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests`
      );
      if (response.ok) {
        const data = await response.json();
        setTests(data || []);
      }
    } catch (error) {
      console.error("Failed to load tests:", error);
    } finally {
      setTestsLoading(false);
    }
  }, [organizationSlug, projectSlug]);

  const createTestFromCase = async (testCase: AnalysisTestCase, index: number) => {
    const testKey = `test-${index}`;
    setIsCreatingTest(testKey);

    try {
      // Create test in the project
      const testResponse = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: testCase.title,
            description: testCase.description,
          }),
        }
      );

      if (!testResponse.ok) {
        throw new Error("Failed to create test");
      }

      // Mark as created
      const newStatus = {
        ...testCreationStatus,
        [testKey]: true,
      };

      // Refresh the tests table
      await loadTests();

    } catch (error) {
      console.error("Failed to create test:", error);
      alert("Failed to create test. Please try again.");
    } finally {
      setIsCreatingTest(null);
    }
  };

  const handleTestsChange = () => {
    loadTests();
  };

  // Show loading or no data states
  if (analysis.status === "pending" || analysis.status === "running") {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" gutterBottom>
          Analysis in Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test cases will be available once the analysis completes.
        </Typography>
      </Box>
    );
  }

  if (analysis.status === "failed") {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" gutterBottom>
          Analysis Failed
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The analysis could not be completed. Please try running it again.
        </Typography>
      </Box>
    );
  }

  if (!finalResult?.tests?.length) {
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No Test Cases Found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This analysis did not generate any test cases.
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <TestsTable
            tests={tests}
            onTestsChange={handleTestsChange}
            organizationSlug={organizationSlug}
            projectSlug={projectSlug}
          />
        </Grid>
      </Grid>
    );
  }

  const testCases = finalResult?.tests || [];
  const filterTestCases = (testCase: any) => (!tests.find(test => (test.title === testCase.title && testCase.description === testCase.description)))
  return (
    <Grid container spacing={3}>
      {/* Left Column: Test Cases */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Grid container spacing={2}>
          {testCases.filter(filterTestCases).map((testCase, index) => {
            const testKey = `test-${index}`;
            const isCreated = testCreationStatus[testKey];
            const isCreating = isCreatingTest === testKey;

            return (
              <Grid size={{ xs: 12 }} key={index}>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    ...(isCreated && {
                      borderColor: 'success.main',
                      borderWidth: 2,
                    })
                  }}
                  variant={isCreated ? "outlined" : "elevation"}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {testCase.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        whiteSpace: "pre-wrap",
                        mb: 2,
                        lineHeight: 1.6,
                      }}
                    >
                      {testCase.description}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    {isCreated ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        disabled
                      >
                        Test Created
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => createTestFromCase(testCase, index)}
                        disabled={isCreating}
                      >
                        {isCreating ? "Creating..." : "Add To Project Tests"}
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Grid>

      {/* Right Column: Current Tests */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <TestsTable
          tests={tests}
          onTestsChange={handleTestsChange}
          organizationSlug={organizationSlug}
          projectSlug={projectSlug}
          isInAnalysis
        />
      </Grid>
    </Grid>
  );
}