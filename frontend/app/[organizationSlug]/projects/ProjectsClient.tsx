"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Toolbar,
  TableSortLabel,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";

type Order = "asc" | "desc";

interface HeadCell {
  id: keyof ProjectData;
  numeric: boolean;
  label: string;
}

const headCells: readonly HeadCell[] = [
  {
    id: "name",
    numeric: false,
    label: "Project Name",
  },
  {
    id: "slug",
    numeric: false,
    label: "Slug",
  },
  {
    id: "createdAt",
    numeric: false,
    label: "Created",
  },
  {
    id: "testCount",
    numeric: true,
    label: "Tests",
  },
];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string | Date },
  b: { [key in Key]: number | string | Date }
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  top: 20,
  width: 1,
} as const;

interface ProjectData {
  slug: string;
  name: string;
  createdAt: Date;
  testCount: number;
}

interface OrganizationData {
  slug: string;
  name: string;
}

interface ProjectsClientProps {
  organization: OrganizationData;
  projects: ProjectData[];
  organizationSlug: string;
}

interface EnhancedTableHeadProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof ProjectData) => void;
  order: Order;
  orderBy: string;
}

function EnhancedTableHead(props: EnhancedTableHeadProps) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property: keyof ProjectData) => (event: React.MouseEvent<unknown>) => {
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

export default function ProjectsClient({
  organization,
  projects,
  organizationSlug,
}: ProjectsClientProps) {
  const router = useRouter();
  const [order, setOrder] = React.useState<Order>("desc");
  const [orderBy, setOrderBy] = React.useState<keyof ProjectData>("testCount");

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof ProjectData
  ) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleProjectClick = (projectSlug: string) => {
    router.push(`/${organizationSlug}/projects/${projectSlug}`);
  };

  const handleNewProjectClick = () => {
    router.push(`/${organizationSlug}/projects/new`);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const sortedProjects = React.useMemo(() => {
    return [...projects].sort(getComparator(order, orderBy));
  }, [projects, order, orderBy]);

  return (
    <Box>
      <Card sx={{ borderRadius: 0 }}>
        <CardContent sx={{ p: 0 }}>

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
              component="h1"
            >
              {organization.name} Projects
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewProjectClick}
              sx={{ borderRadius: "25px", width: "240px" }}
              size="large"
            >
              New Project
            </Button>
          </Toolbar>
          {projects.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 6,
              }}
            >
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No projects yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first project to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewProjectClick}
              >
                Create Project
              </Button>
            </Box>
          ) : (
            <Table>
              <EnhancedTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
              />
              <TableBody>
                {sortedProjects.map((project) => (
                  <TableRow
                    key={project.slug}
                    onClick={() => handleProjectClick(project.slug)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {project.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {project.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(project.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {project.testCount}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}