"use client";

import * as React from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Grid,
} from "@mui/material";
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

interface Test {
  id: number;
  slug: string;
  title?: string;
  description?: string;
  defaultVersion?: {
    title: string;
    description: string;
    number: number;
    slug: string;
  };
}

interface ManageTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testSuiteSlug: string;
  versionSlug: string;
  organizationSlug: string;
  projectSlug: string;
  onTestsUpdated: () => void;
}

export default function ManageTestsModal({
  isOpen,
  onClose,
  testSuiteSlug,
  versionSlug,
  organizationSlug,
  projectSlug,
  onTestsUpdated,
}: ManageTestsModalProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [allTests, setAllTests] = React.useState<Test[]>([]);
  const [originalSuiteTests, setOriginalSuiteTests] = React.useState<Test[]>([]);
  const [currentSuiteTests, setCurrentSuiteTests] = React.useState<Test[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const fetchAllTests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests`
      );
      if (response.ok) {
        const tests = await response.json();
        setAllTests(tests);
      }
    } catch (err) {
      console.error("Failed to fetch tests:", err);
      setError("Failed to load tests");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuiteTests = async () => {
    if (!versionSlug) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${testSuiteSlug}/versions/${versionSlug}/tests`
      );
      if (response.ok) {
        const tests = await response.json();
        setOriginalSuiteTests(tests);
        setCurrentSuiteTests(tests);
      }
    } catch (err) {
      console.error("Failed to fetch suite tests:", err);
      setError("Failed to load suite tests");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchAllTests();
      fetchSuiteTests();
      setError("");
      setSearchTerm("");
    }
  }, [isOpen, versionSlug]);

  const handleAddTest = (test: Test) => {
    setCurrentSuiteTests(prev => [...prev, test]);
  };

  const handleRemoveTest = (testSlug: string) => {
    setCurrentSuiteTests(prev => prev.filter(test => test.slug !== testSlug));
  };

  const handleSave = async () => {
    const originalSlugs = new Set(originalSuiteTests.map(t => t.slug));
    const currentSlugs = new Set(currentSuiteTests.map(t => t.slug));

    const testsToAdd = currentSuiteTests.filter(t => !originalSlugs.has(t.slug));
    const testsToRemove = originalSuiteTests.filter(t => !currentSlugs.has(t.slug));

    if (testsToAdd.length === 0 && testsToRemove.length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      // Add all current tests to the new version
        const addResponse = await fetch(
          `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${testSuiteSlug}/tests`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              testSuiteVersionSlug: versionSlug,
              testSlugs: currentSuiteTests.map(t => t.slug),
            }),
          }
        );

        if (!addResponse.ok) {
          throw new Error("Failed to add tests to new version");
        }

      onTestsUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to save changes:", err);
      setError("Failed to save changes");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tests based on search term
  const getFilteredTests = (tests: Test[]) => {
    if (!searchTerm) return tests;

    return tests.filter(test => {
      const title = test.title || test.defaultVersion?.title || "";
      const description = test.description || test.defaultVersion?.description || "";
      return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.slug.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  // Get tests that are not in the current suite selection
  const availableTests = React.useMemo(() => {
    const currentSuiteTestSlugs = new Set(currentSuiteTests.map(t => t.slug));
    return allTests.filter(test => !currentSuiteTestSlugs.has(test.slug));
  }, [allTests, currentSuiteTests]);

  const filteredAvailableTests = getFilteredTests(availableTests);
  const filteredSuiteTests = getFilteredTests(currentSuiteTests);

  const hasChanges = React.useMemo(() => {
    const originalSlugs = new Set(originalSuiteTests.map(t => t.slug));
    const currentSlugs = new Set(currentSuiteTests.map(t => t.slug));

    return originalSlugs.size !== currentSlugs.size ||
      [...originalSlugs].some(slug => !currentSlugs.has(slug)) ||
      [...currentSlugs].some(slug => !originalSlugs.has(slug));
  }, [originalSuiteTests, currentSuiteTests]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="manage-tests-modal-title"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 1200,
          height: 700,
          bgcolor: "background.paper",
          border: "2px solid #000",
          borderRadius: 2,
          boxShadow: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            pl: 2,
            pt: 1,
            pb: 1,
            borderBottom: "#000 1px solid",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" component="h2" id="manage-tests-modal-title">
            Manage Tests in Suite
          </Typography>
          <IconButton onClick={onClose} disabled={isSubmitting}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {/* Available Tests Table */}
              <Grid size={{ xs: 6 }}>
                <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">
                      Available Tests ({filteredAvailableTests.length})
                    </Typography>
                  </Box>
                  <TableContainer sx={{ flex: 1 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Test Name</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell width={50}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAvailableTests.map((test) => (
                          <TableRow key={test.slug} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {test.title || test.defaultVersion?.title || `Test ${test.slug}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {test.defaultVersion && (
                                <Chip label={`V.${test.defaultVersion.number}`} size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleAddTest(test)}
                                sx={{ padding: "4px" }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredAvailableTests.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
                                {searchTerm ? "No tests match your search" : "All tests are in the suite"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Suite Tests Table */}
              <Grid size={{ xs: 6 }}>
                <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">
                      Tests in Suite ({filteredSuiteTests.length})
                    </Typography>
                  </Box>
                  <TableContainer sx={{ flex: 1 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Test Name</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell width={50}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredSuiteTests.map((test) => (
                          <TableRow key={test.slug} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {test.title || test.defaultVersion?.title || `Test ${test.slug}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {test.defaultVersion && (
                                <Chip label={`V.${test.defaultVersion.number}`} size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveTest(test.slug)}
                                sx={{ padding: "4px" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredSuiteTests.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
                                {searchTerm ? "No tests match your search" : "No tests in this suite"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {hasChanges ?
              `${currentSuiteTests.length} tests selected (${Math.abs(currentSuiteTests.length - originalSuiteTests.length)} changes)` :
              `${currentSuiteTests.length} tests (no changes)`
            }
            {hasChanges && (
              <Typography component="span" variant="body2" color="warning.main" sx={{ ml: 1 }}>
                • Will create new version
              </Typography>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges || isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={20} />
              ) : (
                hasChanges ? "Save Changes" : "No Changes"
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}