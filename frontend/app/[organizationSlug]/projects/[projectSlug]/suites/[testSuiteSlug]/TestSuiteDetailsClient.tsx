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
import { 
  Edit as EditIcon, 
  PlayArrow as PlayArrowIcon, 
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";
import TestSuiteRunsTable from "../../runs/TestSuiteRunsTable";
import EditTestSuiteModal from "../EditTestSuiteModal";
import RunTestSuiteModal from "../RunTestSuiteModal";
import ManageTestsModal from "./ManageTestsModal";
import SuiteTestsTable from "./SuiteTestsTable";
import { useRouter } from "next/navigation";

interface TestSuiteVersion {
  slug: string;
  title: string;
  description: string;
  number: number;
  isDefault: boolean;
}

interface TestSuiteData {
  slug: string;
  title: string;
  description: string;
  versions: TestSuiteVersion[];
  defaultVersion: TestSuiteVersion;
  totalVersions: number;
  totalRuns: number;
  pendingRuns: number;
  runningRuns: number;
  successfulRuns: number;
  failedRuns: number;
  runs: any[];
}

interface TestSuiteDetailsClientProps {
  testSuiteData: TestSuiteData;
  organizationSlug: string;
  projectSlug: string;
}

export default function TestSuiteDetailsClient({
  testSuiteData: initialTestSuiteData,
  organizationSlug,
  projectSlug,
}: TestSuiteDetailsClientProps) {
  const [testSuiteData, setTestSuiteData] = React.useState<TestSuiteData>(initialTestSuiteData);
  const [selectedVersionSlug, setSelectedVersionSlug] = React.useState<string>(
    initialTestSuiteData.defaultVersion?.slug || ""
  );
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [runModalOpen, setRunModalOpen] = React.useState(false);
  const [manageTestsModalOpen, setManageTestsModalOpen] = React.useState(false);
  const [selectedTestSuiteToRun, setSelectedTestSuiteToRun] = React.useState<string>("");
  const [selectedVersionToRun, setSelectedVersionToRun] = React.useState<string>("");
  const [selectedModelToRun, setSelectedModelToRun] = React.useState<string>("gemini-2.5-flash");
  const [isRunning, setIsRunning] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSettingDefault, setIsSettingDefault] = React.useState(false);
  const [suiteTests, setSuiteTests] = React.useState<any[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const router = useRouter();

  const selectedVersion = React.useMemo(() => {
    if (!selectedVersionSlug) return null;
    return testSuiteData.versions.find(v => v.slug === selectedVersionSlug) || null;
  }, [testSuiteData.versions, selectedVersionSlug]);

  const fetchTestSuiteData = async () => {
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${testSuiteData.slug}`
      );
      if (response.ok) {
        const updatedTestSuite = await response.json();
        setTestSuiteData(updatedTestSuite);
        setSelectedVersionSlug(updatedTestSuite.defaultVersion?.slug || "");
      }
    } catch (error) {
      console.error("Error fetching test suite data:", error);
    }
  };

  const fetchSuiteTests = async () => {
    if (!selectedVersion) return;
    
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${testSuiteData.slug}/versions/${selectedVersion.slug}/tests`
      );
      if (response.ok) {
        const tests = await response.json();
        setSuiteTests(tests);
      }
    } catch (error) {
      console.error("Error fetching suite tests:", error);
    }
  };

  React.useEffect(() => {
    fetchSuiteTests();
  }, [selectedVersion, refreshKey]);

  const handleEditTestSuite = () => {
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
  };

  const handleTestSuiteUpdated = () => {
    setEditModalOpen(false);
    fetchTestSuiteData();
  };

  const handleRunTestSuite = () => {
    setSelectedTestSuiteToRun(testSuiteData.slug);
    if (selectedVersionSlug) {
      setSelectedVersionToRun(selectedVersionSlug);
    } else {
      const defaultVersion = testSuiteData.versions.find((v) => v.isDefault);
      if (defaultVersion) {
        setSelectedVersionToRun(defaultVersion.slug);
      } else if (testSuiteData.versions.length > 0) {
        setSelectedVersionToRun(testSuiteData.versions[0].slug);
      }
    }
    setRunModalOpen(true);
  };

  const handleTestSuiteChange = (testSuiteSlug: string) => {
    setSelectedTestSuiteToRun(testSuiteSlug);
    const defaultVersion = testSuiteData.versions.find((v) => v.isDefault);
    if (defaultVersion) {
      setSelectedVersionToRun(defaultVersion.slug);
    } else if (testSuiteData.versions.length > 0) {
      setSelectedVersionToRun(testSuiteData.versions[0].slug);
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
    if (!selectedTestSuiteToRun || !selectedVersionToRun || !selectedModelToRun || isRunning) return;

    setIsRunning(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${selectedTestSuiteToRun}/runs`,
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
        setSelectedTestSuiteToRun("");
        setSelectedVersionToRun("");
        setSelectedModelToRun("gemini-2.5-flash");
        fetchTestSuiteData();
      } else {
        console.error("Failed to run test suite");
      }
    } catch (error) {
      console.error("Error running test suite:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCancelRun = () => {
    if (isRunning) return;
    setRunModalOpen(false);
    setSelectedTestSuiteToRun("");
    setSelectedVersionToRun("");
    setSelectedModelToRun("gemini-2.5-flash");
  };

  const handleDeleteTestSuite = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${testSuiteData.slug}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        router.push(`/${organizationSlug}/projects/${projectSlug}/suites`);
      } else {
        console.error("Failed to delete test suite");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting test suite:", error);
      setIsDeleting(false);
    }
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
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${testSuiteData.slug}/versions/${selectedVersion.slug}`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        fetchTestSuiteData();
      } else {
        console.error("Failed to set version as default");
      }
    } catch (error) {
      console.error("Error setting version as default:", error);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleManageTests = () => {
    setManageTestsModalOpen(true);
  };

  const handleCloseManageTestsModal = () => {
    setManageTestsModalOpen(false);
  };

  const handleTestsUpdated = () => {
    setManageTestsModalOpen(false);
    setRefreshKey(prev => prev + 1);
    fetchTestSuiteData();
  };

  return (
    <Box>
      <Card sx={{ mb: 3, borderRadius: 0 }}>
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
                    {testSuiteData.versions.map((version) => (
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
                <Button sx={{mt:1}} size="large" variant="contained" onClick={handleEditTestSuite} fullWidth>
                  <EditIcon /> Add New Version
                </Button>
                <Button sx={{mt:1}} size="large" variant="contained" onClick={handleManageTests} fullWidth color="info">
                  <SettingsIcon /> Manage Tests
                </Button>
                <Button sx={{mt:1}} size="large" variant="contained" onClick={handleRunTestSuite} fullWidth color="success">
                  <PlayArrowIcon /> Run Test Suite
                </Button>
                <Button sx={{mt:1}} size="large" variant="contained" onClick={handleDeleteTestSuite} fullWidth color="error">
                  <DeleteIcon /> Delete Test Suite
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
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 0 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Runs
              </Typography>
              <Typography variant="h6">{testSuiteData.totalRuns}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
              <Typography variant="h6" color="warning.main">
                {testSuiteData.pendingRuns}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Running
              </Typography>
              <Typography variant="h6" color="info.main">
                {testSuiteData.runningRuns}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Successful
              </Typography>
              <Typography variant="h6" color="success.main">
                {testSuiteData.successfulRuns}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
              <Typography variant="h6" color="error.main">
                {testSuiteData.failedRuns}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <SuiteTestsTable 
        tests={suiteTests}
        organizationSlug={organizationSlug}
        projectSlug={projectSlug}
        onRefresh={() => setRefreshKey(prev => prev + 1)}
      />

      <TestSuiteRunsTable
        testSuiteRuns={testSuiteData.runs}
        organizationSlug={organizationSlug}
        projectSlug={projectSlug}
      />

      <EditTestSuiteModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        testSuite={testSuiteData}
        onTestSuiteUpdated={handleTestSuiteUpdated}
      />
      
      <RunTestSuiteModal
        isOpen={runModalOpen}
        onClose={handleCancelRun}
        testSuites={[testSuiteData]}
        selectedTestSuite={selectedTestSuiteToRun}
        onTestSuiteChange={handleTestSuiteChange}
        selectedVersion={selectedVersionToRun}
        onVersionChange={handleVersionChange}
        selectedModel={selectedModelToRun}
        onModelChange={handleModelChange}
        onRunTestSuite={handleConfirmRun}
        isRunning={isRunning}
      />

      <ManageTestsModal
        isOpen={manageTestsModalOpen}
        onClose={handleCloseManageTestsModal}
        testSuiteSlug={testSuiteData.slug}
        versionSlug={selectedVersionSlug}
        organizationSlug={organizationSlug}
        projectSlug={projectSlug}
        onTestsUpdated={handleTestsUpdated}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Test Suite</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the test suite "{testSuiteData.title}"? This
            action cannot be undone and will permanently remove the test suite and all
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