"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FilterListIcon from "@mui/icons-material/FilterList";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import { visuallyHidden } from "@mui/utils";
import AddNewTestModal from "./NewTestModal";
import EditTestModal from "./EditTestModal";
import RunTestModal from "./RunTestModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

function createData(title: string, description: string, versions: number): any {
  return {
    title,
    description,
    versions,
  };
}

const rows = [];

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
            {headCell.label !== "" && <TableSortLabel
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
            </TableSortLabel>}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
interface EnhancedTableToolbarProps {
  onTestsChange?: () => void;
}
function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const { onTestsChange } = props;
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
        Tests
      </Typography>
      <AddNewTestModal onTestCreated={onTestsChange} />
    </Toolbar>
  );
}
export default function EnhancedTable({
  tests,
  onTestsChange,
  organizationSlug,
  projectSlug,
}: {
  tests?: any[];
  onTestsChange?: () => void;
  organizationSlug: string;
  projectSlug: string;
}) {
  const [order, setOrder] = React.useState<Order>("desc");
  const [orderBy, setOrderBy] = React.useState<string>("totalRuns");
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [testToDelete, setTestToDelete] = React.useState<any>(null);
  const [runModalOpen, setRunModalOpen] = React.useState(false);
  const [selectedTestToRun, setSelectedTestToRun] = React.useState<string>("");
  const [selectedVersionToRun, setSelectedVersionToRun] = React.useState<string>("");
  const [selectedModelToRun, setSelectedModelToRun] = React.useState<string>("gpt-5-mini");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const router = useRouter();

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: string
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleRowClick = (test: any) => {
    router.push(`/${organizationSlug}/projects/${projectSlug}/tests/${test.slug}`);
  };

  const handleEditTest = (test: any) => {
    setSelectedTest(test);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedTest(null);
  };

  const handleTestUpdated = () => {
    if (onTestsChange) {
      onTestsChange();
    }
  };

  const handleDeleteTest = (test: any) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests/${testToDelete.slug}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        if (onTestsChange) {
          onTestsChange();
        }
        setDeleteDialogOpen(false);
        setTestToDelete(null);
      } else {
        console.error("Failed to delete test");
      }
    } catch (error) {
      console.error("Error deleting test:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
    setTestToDelete(null);
  };

  const handleRunTest = (test: any) => {
    setSelectedTestToRun(test.slug);
    // Set the default version as initially selected
    const defaultVersion = test.versions?.find((v: any) => v.isDefault);
    if (defaultVersion) {
      setSelectedVersionToRun(defaultVersion.slug);
    } else if (test.versions && test.versions.length > 0) {
      // If no default, select the first version
      setSelectedVersionToRun(test.versions[0].slug);
    }
    setRunModalOpen(true);
  };

  const handleTestChange = (testSlug: string) => {
    setSelectedTestToRun(testSlug);
    // Reset version selection when test changes
    const selectedTest = tests?.find(test => test.slug === testSlug);
    const defaultVersion = selectedTest?.versions?.find((v: any) => v.isDefault);
    if (defaultVersion) {
      setSelectedVersionToRun(defaultVersion.slug);
    } else if (selectedTest?.versions && selectedTest.versions.length > 0) {
      setSelectedVersionToRun(selectedTest.versions[0].slug);
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
        if (onTestsChange) {
          onTestsChange();
        }
        setRunModalOpen(false);
        setSelectedTestToRun("");
        setSelectedVersionToRun("");
        setSelectedModelToRun("gpt-5-mini");
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

  const sortedTests = React.useMemo(() => {
    if (!tests) return [];

    return [...tests].sort(getComparator(order, orderBy));
  }, [tests, order, orderBy]);

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <EnhancedTableToolbar onTestsChange={onTestsChange} />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {sortedTests?.map((test, index) => {
                return (
                  <TableRow 
                    hover 
                    tabIndex={-1} 
                    key={test.slug}
                    onClick={() => handleRowClick(test)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={buttonCellStyle}>
                      <Tooltip title="Run test">
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRunTest(test);
                          }}
                          size="small"
                          color="success"
                          sx={{ padding: "4px" }}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{test.title}</TableCell>
                    <TableCell align="center">{test.totalVersions}</TableCell>
                    <TableCell align="center">{test.totalRuns}</TableCell>
                    <TableCell align="center">{test.pendingRuns}</TableCell>
                    <TableCell align="center">{test.successfulRuns}</TableCell>
                    <TableCell align="center">{test.failedRuns}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit test">
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditTest(test);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete test">
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteTest(test);
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

              {(!tests || tests.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No tests found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {selectedTest && (
        <EditTestModal
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          test={selectedTest}
          onTestUpdated={handleTestUpdated}
        />
      )}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Test</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the test "
            {testToDelete?.title || testToDelete?.versions?.[0]?.title}"? This
            action cannot be undone and will permanently remove the test and all
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
      <RunTestModal
        isOpen={runModalOpen}
        onClose={handleCancelRun}
        tests={tests || []}
        selectedTest={selectedTestToRun}
        onTestChange={handleTestChange}
        selectedVersion={selectedVersionToRun}
        onVersionChange={handleVersionChange}
        selectedModel={selectedModelToRun}
        onModelChange={handleModelChange}
        onRunTest={handleConfirmRun}
        isRunning={isRunning}
      />
    </Box>
  );
}
