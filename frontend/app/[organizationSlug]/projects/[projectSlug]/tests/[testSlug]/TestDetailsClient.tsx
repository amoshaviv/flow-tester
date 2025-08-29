"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Grid,
} from "@mui/material";
import TestRunsTable from "../../runs/TestRunsTable";

interface TestVersion {
  slug: string;
  title: string;
  description: string;
  number: number;
  isDefault: boolean;
}

interface TestData {
  slug: string;
  title: string;
  description: string;
  versions: TestVersion[];
  defaultVersion: TestVersion;
  totalVersions: number;
  totalRuns: number;
  pendingRuns: number;
  runningRuns: number;
  successfulRuns: number;
  failedRuns: number;
  runs: any[];
}

interface TestDetailsClientProps {
  testData: TestData;
  organizationSlug: string;
  projectSlug: string;
}

export default function TestDetailsClient({
  testData,
  organizationSlug,
  projectSlug,
}: TestDetailsClientProps) {
  const [selectedVersionSlug, setSelectedVersionSlug] = React.useState<string>(
    testData.defaultVersion?.slug || ""
  );

  const selectedVersion = React.useMemo(() => {
    if (!selectedVersionSlug) return null;
    return testData.versions.find(v => v.slug === selectedVersionSlug) || null;
  }, [testData.versions, selectedVersionSlug]);

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ sm: 9 }}>
              {selectedVersion && (
                <Box>
                  <Typography variant="h6">
                    {selectedVersion.title}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }} color="textSecondary">
                    {selectedVersion.description}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid size={{ sm: 3 }}>
              <Box sx={{ display: "block", mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="version-select-label">Version</InputLabel>
                  <Select
                    labelId="version-select-label"
                    value={selectedVersionSlug}
                    label="Version"
                    onChange={(e) => setSelectedVersionSlug(e.target.value)}
                    fullWidth
                  >
                    {testData.versions.map((version) => (
                      <MenuItem key={version.slug} value={version.slug}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          V.{version.number} - {version.title}
                          {version.isDefault && (
                            <Chip label="Default" size="small" color="primary" />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            <Grid size={{ sm: 12 }}>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Runs
              </Typography>
              <Typography variant="h6">{testData.totalRuns}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
              <Typography variant="h6" color="warning.main">
                {testData.pendingRuns}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Running
              </Typography>
              <Typography variant="h6" color="info  ">
                {testData.runningRuns}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Successful
              </Typography>
              <Typography variant="h6" color="success.main">
                {testData.successfulRuns}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
              <Typography variant="h6" color="error.main">
                {testData.failedRuns}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <TestRunsTable
        testRuns={testData.runs}
        organizationSlug={organizationSlug}
        projectSlug={projectSlug}
      />
    </Box>
  );
}