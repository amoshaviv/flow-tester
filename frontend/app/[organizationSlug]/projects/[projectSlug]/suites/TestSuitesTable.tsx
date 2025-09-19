"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { visuallyHidden } from "@mui/utils";
import AddNewTestSuiteModal from "./NewTestSuiteModal";
import EditTestSuiteModal from "./EditTestSuiteModal";
import RunTestSuiteModal from "./RunTestSuiteModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = "asc" | "desc";

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  id: string;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: "run",
    numeric: false,
    label: "",
  },
  {
    id: "title",
    numeric: false,
    label: "Title",
  },
  {
    id: "versions",
    numeric: true,
    label: "Versions",
  },
  {
    id: "totalRuns",
    numeric: true,
    label: "Total Runs",
  },
  {
    id: "pendingRuns",
    numeric: true,
    label: "Pending Runs",
  },
  {
    id: "successfulRuns",
    numeric: true,
    label: "Successful Runs",
  },
  {
    id: "failedRuns",
    numeric: true,
    label: "Failed Runs",
  },
  {
    id: "edit",
    numeric: true,
    label: "",
  },
  {
    id: "delete",
    numeric: false,
    label: "",
  },
];

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
  order: Order;
  orderBy: string;
}

const buttonCellStyle = { width: "28px" };

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler =
    (property: string) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "center" : "left"}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={["run"].includes(headCell.id) ? buttonCellStyle : {}}
          >
            {headCell.label !== "" && (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : "asc"}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === "desc" ? "sorted descending" : "sorted ascending"}
                  </Box>
                ) : null}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  onTestSuitesChange?: () => void;
}

function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const { onTestSuitesChange } = props;
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 2 },
      }}
    >
      <Typography
        sx={{ flex: "1 1 100%" }}
        variant="h6"
        id="tableTitle"
        component="div"
      >
        Test Suites
      </Typography>
      <AddNewTestSuiteModal onTestSuiteCreated={onTestSuitesChange} />
    </Toolbar>
  );
}

export default function TestSuitesTable({
  testSuites,
  onTestSuitesChange,
  organizationSlug,
  projectSlug,
}: {
  testSuites?: any[];
  onTestSuitesChange?: () => void;
  organizationSlug: string;
  projectSlug: string;
}) {
  const [order, setOrder] = React.useState<Order>("desc");
  const [orderBy, setOrderBy] = React.useState<string>("totalRuns");
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedTestSuite, setSelectedTestSuite] = React.useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [testSuiteToDelete, setTestSuiteToDelete] = React.useState<any>(null);
  const [runModalOpen, setRunModalOpen] = React.useState(false);
  const [selectedTestSuiteToRun, setSelectedTestSuiteToRun] = React.useState<string>("");
  const [selectedVersionToRun, setSelectedVersionToRun] = React.useState<string>("");
  const [selectedModelToRun, setSelectedModelToRun] = React.useState<string>("gemini-2.5-flash");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [testSuiteRunSlug, setTestSuiteRunSlug] = React.useState<string>("");
  const [snackbarTestSuiteSlug, setSnackbarTestSuiteSlug] = React.useState<string>("");
  const router = useRouter();

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: string
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleRowClick = (testSuite: any) => {
    router.push(`/${organizationSlug}/projects/${projectSlug}/suites/${testSuite.slug}`);
  };

  const handleEditTestSuite = (testSuite: any) => {
    setSelectedTestSuite(testSuite);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedTestSuite(null);
  };

  const handleTestSuiteUpdated = () => {
    if (onTestSuitesChange) {
      onTestSuitesChange();
    }
  };

  const handleDeleteTestSuite = (testSuite: any) => {
    setTestSuiteToDelete(testSuite);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testSuiteToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites/${testSuiteToDelete.slug}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        if (onTestSuitesChange) {
          onTestSuitesChange();
        }
        setDeleteDialogOpen(false);
        setTestSuiteToDelete(null);
      } else {
        console.error("Failed to delete test suite");
      }
    } catch (error) {
      console.error("Error deleting test suite:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
    setTestSuiteToDelete(null);
  };

  const handleRunTestSuite = (testSuite: any) => {
    setSelectedTestSuiteToRun(testSuite.slug);
    const defaultVersion = testSuite.versions?.find((v: any) => v.isDefault);
    if (defaultVersion) {
      setSelectedVersionToRun(defaultVersion.slug);
    } else if (testSuite.versions && testSuite.versions.length > 0) {
      setSelectedVersionToRun(testSuite.versions[0].slug);
    }
    setRunModalOpen(true);
  };

  const handleTestSuiteChange = (testSuiteSlug: string) => {
    setSelectedTestSuiteToRun(testSuiteSlug);
    const selectedTestSuite = testSuites?.find(suite => suite.slug === testSuiteSlug);
    const defaultVersion = selectedTestSuite?.versions?.find((v: any) => v.isDefault);
    if (defaultVersion) {
      setSelectedVersionToRun(defaultVersion.slug);
    } else if (selectedTestSuite?.versions && selectedTestSuite.versions.length > 0) {
      setSelectedVersionToRun(selectedTestSuite.versions[0].slug);
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
        const data = await response.json();
        const runSlug = data.testSuiteRun?.slug;
        
        if (onTestSuitesChange) {
          onTestSuitesChange();
        }
        
        if (runSlug) {
          setTestSuiteRunSlug(runSlug);
          setSnackbarTestSuiteSlug(selectedTestSuiteToRun);
          setSnackbarOpen(true);
        }
        
        setRunModalOpen(false);
        setSelectedTestSuiteToRun("");
        setSelectedVersionToRun("");
        setSelectedModelToRun("gemini-2.5-flash");
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

  const sortedTestSuites = React.useMemo(() => {
    if (!testSuites) return [];

    return [...testSuites].sort(getComparator(order, orderBy));
  }, [testSuites, order, orderBy]);

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", borderRadius: 0 }}>
        <EnhancedTableToolbar onTestSuitesChange={onTestSuitesChange} />
        <TableContainer>
          <Table aria-labelledby="tableTitle">
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {sortedTestSuites?.map((testSuite, index) => {
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={testSuite.slug}
                    onClick={() => handleRowClick(testSuite)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={buttonCellStyle}>
                      <Tooltip title="Run test suite">
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRunTestSuite(testSuite);
                          }}
                          size="small"
                          color="success"
                          sx={{ padding: "4px" }}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{testSuite.title}</TableCell>
                    <TableCell align="center">{testSuite.totalVersions}</TableCell>
                    <TableCell align="center">{testSuite.totalRuns}</TableCell>
                    <TableCell align="center">{testSuite.pendingRuns}</TableCell>
                    <TableCell align="center">{testSuite.successfulRuns}</TableCell>
                    <TableCell align="center">{testSuite.failedRuns}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit test suite">
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditTestSuite(testSuite);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete test suite">
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteTestSuite(testSuite);
                          }}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}

              {(!testSuites || testSuites.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No test suites found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {selectedTestSuite && (
        <EditTestSuiteModal
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          testSuite={selectedTestSuite}
          onTestSuiteUpdated={handleTestSuiteUpdated}
        />
      )}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Test Suite</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the test suite "
            {testSuiteToDelete?.title || testSuiteToDelete?.versions?.[0]?.title}"? This
            action cannot be undone and will permanently remove the test suite and all
            its versions.
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
      <RunTestSuiteModal
        isOpen={runModalOpen}
        onClose={handleCancelRun}
        testSuites={testSuites || []}
        selectedTestSuite={selectedTestSuiteToRun}
        onTestSuiteChange={handleTestSuiteChange}
        selectedVersion={selectedVersionToRun}
        onVersionChange={handleVersionChange}
        selectedModel={selectedModelToRun}
        onModelChange={handleModelChange}
        onRunTestSuite={handleConfirmRun}
        isRunning={isRunning}
      />
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
          action={
            <Button
              component={Link}
              href={`/${organizationSlug}/projects/${projectSlug}/suites/${snackbarTestSuiteSlug}/runs/${testSuiteRunSlug}`}
              color="inherit"
              size="small"
              sx={{ color: 'white', textDecoration: 'underline' }}
            >
              View Run
            </Button>
          }
        >
          Test suite run started successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}