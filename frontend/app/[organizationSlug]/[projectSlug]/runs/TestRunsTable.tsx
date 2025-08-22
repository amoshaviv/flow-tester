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

interface TestRunData {
  slug: string;
  testVersionTitle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  id: keyof TestRunData;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: "testVersionTitle",
    numeric: false,
    label: "Test",
  },
  {
    id: "status",
    numeric: false,
    label: "Status",
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
    property: keyof TestRunData
  ) => void;
  order: Order;
  orderBy: string;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler =
    (property: keyof TestRunData) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
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

interface EnhancedTableToolbarProps {
  title?: string;
}

function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const { title = "Test Runs" } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
      }}
    >
      <Typography
        sx={{ flex: "1 1 100%" }}
        variant="h6"
        id="tableTitle"
        component="div"
      >
        {title}
      </Typography>
    </Toolbar>
  );
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
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
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toISOString();
};

export default function TestRunsTable({ 
  testRuns, 
  organizationSlug, 
  projectSlug 
}: { 
  testRuns?: any[], 
  organizationSlug: string, 
  projectSlug: string 
}) {
  const [order, setOrder] = React.useState<Order>("desc");
  const [orderBy, setOrderBy] = React.useState<keyof TestRunData>("updatedAt");
  const router = useRouter();

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof TestRunData
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleRowClick = (testRun: any) => {
    // Navigate to the test run page using the test slug from the version
    const testSlug = testRun.version?.test?.slug;
    if (testSlug) {
      router.push(`/${organizationSlug}/${projectSlug}/tests/${testSlug}/runs/${testRun.slug}`);
    }
  };

  // Sort the test runs
  const sortedTestRuns = React.useMemo(() => {
    if (!testRuns) return [];
    
    return [...testRuns].sort(getComparator(order, orderBy));
  }, [testRuns, order, orderBy]);

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <EnhancedTableToolbar />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {sortedTestRuns?.map((testRun) => {
                return (
                  <TableRow 
                    hover 
                    tabIndex={-1} 
                    key={testRun.slug}
                    onClick={() => handleRowClick(testRun)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <TableCell>{testRun.version?.title || "N/A"}</TableCell>
                    <TableCell>
                      <Chip 
                        label={testRun.status}
                        color={getStatusColor(testRun.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(testRun.createdAt)}</TableCell>
                    <TableCell>{formatDate(testRun.updatedAt)}</TableCell>
                  </TableRow>
                );
              })}
              {(!testRuns || testRuns.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No test runs found
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