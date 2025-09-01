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
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Edit as EditIcon, PlayArrow as PlayArrowIcon, Delete as DeleteIcon } from "@mui/icons-material";
import TestRunsTable from "../../runs/TestRunsTable";
import EditTestModal from "../EditTestModal";
import RunTestModal from "../RunTestModal";
import { useRouter } from "next/navigation";

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
  testData: initialTestData,
  organizationSlug,
  projectSlug,
}: TestDetailsClientProps) {
  const [testData, setTestData] = React.useState<TestData>(initialTestData);
  const [selectedVersionSlug, setSelectedVersionSlug] = React.useState<string>(
    initialTestData.defaultVersion?.slug || ""
  );
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [runModalOpen, setRunModalOpen] = React.useState(false);
  const [selectedTestToRun, setSelectedTestToRun] = React.useState<string>("");
  const [selectedVersionToRun, setSelectedVersionToRun] = React.useState<string>("");
  const [selectedModelToRun, setSelectedModelToRun] = React.useState<string>("gpt-5-mini");
  const [isRunning, setIsRunning] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSettingDefault, setIsSettingDefault] = React.useState(false);
  const router = useRouter();

  const selectedVersion = React.useMemo(() => {
    if (!selectedVersionSlug) return null;
    return testData.versions.find(v => v.slug === selectedVersionSlug) || null;
  }, [testData.versions, selectedVersionSlug]);

  const fetchTestData = async () => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests/${testData.slug}`
      );
      if (response.ok) {
        const updatedTest = await response.json();
        setTestData(updatedTest);
        setSelectedVersionSlug(updatedTest.defaultVersion?.slug || "");
      }
    } catch (error) {
      console.error("Error fetching test data:", error);
    }
  };

  const handleEditTest = () => {
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
  };

  const handleTestUpdated = () => {
    setEditModalOpen(false);
    fetchTestData();
  };

  const handleRunTest = () => {
    setSelectedTestToRun(testData.slug);
    // Set the currently selected version as initially selected for running
    if (selectedVersionSlug) {
      setSelectedVersionToRun(selectedVersionSlug);
    } else {
      // Fallback to default version
      const defaultVersion = testData.versions.find((v) => v.isDefault);
      if (defaultVersion) {
        setSelectedVersionToRun(defaultVersion.slug);
      } else if (testData.versions.length > 0) {
        setSelectedVersionToRun(testData.versions[0].slug);
      }
    }
    setRunModalOpen(true);
  };

  const handleTestChange = (testSlug: string) => {
    setSelectedTestToRun(testSlug);
    // Since we only have one test, reset version to default
    const defaultVersion = testData.versions.find((v) => v.isDefault);
    if (defaultVersion) {
      setSelectedVersionToRun(defaultVersion.slug);
    } else if (testData.versions.length > 0) {
      setSelectedVersionToRun(testData.versions[0].slug);
    } else {
      setSelectedVersionToRun("");
    }
  };

  const handleVersionChange = (versionSlug: string) => {
    setSelectedVersionToRun(versionSlug);
  };

  const handleModelChange = (modelSlug: string) => {
    setSelectedModelToRun(modelSlug);
  };

  const handleConfirmRun = async () => {
    if (!selectedTestToRun || !selectedVersionToRun || !selectedModelToRun || isRunning) return;

    setIsRunning(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests/${selectedTestToRun}/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            versionSlug: selectedVersionToRun,
            modelSlug: selectedModelToRun
          }),
        }
      );

      if (response.ok) {
        setRunModalOpen(false);
        setSelectedTestToRun("");
        setSelectedVersionToRun("");
        setSelectedModelToRun("gpt-5-mini");
        // Refresh test data to get the new test run
        fetchTestData();
      } else {
        console.error("Failed to run test");
      }
    } catch (error) {
      console.error("Error running test:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancelRun = () => {
    if (isRunning) return;
    setRunModalOpen(false);
    setSelectedTestToRun("");
    setSelectedVersionToRun("");
    setSelectedModelToRun("gpt-5-mini");
  };

  const handleDeleteTest = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests/${testData.slug}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Navigate back to tests page after successful deletion
        router.push(`/${organizationSlug}/projects/${projectSlug}/tests`);
      } else {
        console.error("Failed to delete test");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting test:", error);
      setIsDeleting(false);
    }
    // Note: We don't reset isDeleting to false on success because we're navigating away
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
  };

  const handleMakeDefault = async () => {
    if (!selectedVersion || selectedVersion.isDefault || isSettingDefault) return;

    setIsSettingDefault(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests/${testData.slug}/versions/${selectedVersion.slug}`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        // Refresh test data to get the updated default status
        fetchTestData();
      } else {
        console.error("Failed to set version as default");
      }
    } catch (error) {
      console.error("Error setting version as default:", error);
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ sm: 9 }}>
              {selectedVersion && (
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="h6">
                      {selectedVersion.title}
                    </Typography>
                  </Box>
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
                <Button sx={{mt:1}} size="large" variant="contained" onClick={handleEditTest} fullWidth>
                  <EditIcon /> Add New Version
                </Button>
                <Button sx={{mt:1}} size="large" variant="contained" onClick={handleRunTest} fullWidth color="success">
                  <PlayArrowIcon /> Run Test
                </Button>
                <Button sx={{mt:1}} size="large" variant="contained" onClick={handleDeleteTest} fullWidth color="error">
                  <DeleteIcon /> Delete Test
                </Button>
                {selectedVersion && !selectedVersion.isDefault && (
                  <Button 
                    sx={{mt:1}} 
                    size="large" 
                    variant="contained" 
                    onClick={handleMakeDefault} 
                    fullWidth 
                    color="info"
                    disabled={isSettingDefault}
                  >
                    {isSettingDefault ? "Setting..." : "Make Default Version"}
                  </Button>
                )}
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

      <EditTestModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        test={testData}
        onTestUpdated={handleTestUpdated}
      />
      
      <RunTestModal
        isOpen={runModalOpen}
        onClose={handleCancelRun}
        tests={[testData]}
        selectedTest={selectedTestToRun}
        onTestChange={handleTestChange}
        selectedVersion={selectedVersionToRun}
        onVersionChange={handleVersionChange}
        selectedModel={selectedModelToRun}
        onModelChange={handleModelChange}
        onRunTest={handleConfirmRun}
        isRunning={isRunning}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Test</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the test "{testData.title}"? This
            action cannot be undone and will permanently remove the test and all
            its versions and test runs.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            color="primary"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}