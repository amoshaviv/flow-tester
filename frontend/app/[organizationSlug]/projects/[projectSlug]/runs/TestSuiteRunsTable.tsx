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
import Chip from "@mui/material/Chip";
import { visuallyHidden } from "@mui/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TestSuiteRunData {
  slug: string;
  testSuiteVersionTitle: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  modelSlug: string;
  modelProvider: string;
}

function capitalize(status: string) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

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
  id: keyof TestSuiteRunData;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: "testSuiteVersionTitle",
    numeric: false,
    label: "Test Suite Version",
  },
  {
    id: "status",
    numeric: false,
    label: "Status",
  },
  {
    id: "modelProvider",
    numeric: false,
    label: "Model",
  },
  {
    id: "createdBy",
    numeric: false,
    label: "Created By",
  },
  {
    id: "createdAt",
    numeric: false,
    label: "Created",
  },
  {
    id: "updatedAt",
    numeric: false,
    label: "Updated",
  },
];

interface EnhancedTableProps {
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof TestSuiteRunData
  ) => void;
  order: Order;
  orderBy: string;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler =
    (property: keyof TestSuiteRunData) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
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
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar() {
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
        Test Suite Runs
      </Typography>
    </Toolbar>
  );
}

export default function TestSuiteRunsTable({
  testSuiteRuns,
  organizationSlug,
  projectSlug,
}: {
  testSuiteRuns?: any[];
  organizationSlug: string;
  projectSlug: string;
}) {
  const [order, setOrder] = React.useState<Order>("desc");
  const [orderBy, setOrderBy] = React.useState<keyof TestSuiteRunData>("createdAt");
  const router = useRouter();

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof TestSuiteRunData
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleRowClick = (testSuiteRun: any) => {
    // Navigate to test suite run details page
    router.push(
      `/${organizationSlug}/projects/${projectSlug}/suites/${testSuiteRun.version.testSuite.slug}/runs/${testSuiteRun.slug}`
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "succeeded":
        return "success";
      case "failed":
        return "error";
      case "running":
        return "info";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const sortedTestSuiteRuns = React.useMemo(() => {
    if (!testSuiteRuns) return [];

    const mappedRuns = testSuiteRuns.map((run) => ({
      ...run,
      testSuiteVersionTitle: run.version?.title || "Unknown Version",
      createdBy: run.createdBy?.displayName || run.createdBy?.email || "Unknown",
    }));

    return [...mappedRuns].sort(getComparator(order, orderBy));
  }, [testSuiteRuns, order, orderBy]);

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", mb: 2, borderRadius: 0 }}>
        <EnhancedTableToolbar />
        <TableContainer>
          <Table aria-labelledby="tableTitle">
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {sortedTestSuiteRuns.map((testSuiteRun, index) => {
                return (
                  <TableRow
                    hover
                    onClick={() => handleRowClick(testSuiteRun)}
                    tabIndex={-1}
                    key={testSuiteRun.slug}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell component="th" scope="row">
                      {testSuiteRun.testSuiteVersionTitle}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={capitalize(testSuiteRun.status)}
                        color={getStatusColor(testSuiteRun.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {testSuiteRun.modelProvider} - {testSuiteRun.modelSlug}
                      </Typography>
                    </TableCell>
                    <TableCell>{testSuiteRun.createdBy}</TableCell>
                    <TableCell>{formatDate(testSuiteRun.createdAt)}</TableCell>
                    <TableCell>{formatDate(testSuiteRun.updatedAt)}</TableCell>
                  </TableRow>
                );
              })}

              {(!testSuiteRuns || testSuiteRuns.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No test suite runs found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}