"use client";

import * as React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Toolbar,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { PlayArrow as PlayArrowIcon, Visibility as ViewIcon } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Test {
  id: number;
  slug: string;
  defaultVersion?: {
    title: string;
    description: string;
    number: number;
    slug: string;
  };
}

interface SuiteTestsTableProps {
  tests: Test[];
  organizationSlug: string;
  projectSlug: string;
  onRefresh?: () => void;
}

export default function SuiteTestsTable({
  tests,
  organizationSlug,
  projectSlug,
  onRefresh,
}: SuiteTestsTableProps) {
  const router = useRouter();

  const handleRowClick = (test: Test) => {
    router.push(`/${organizationSlug}/projects/${projectSlug}/tests/${test.slug}`);
  };

  const handleRunTest = async (test: Test, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!test.defaultVersion) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests/${test.slug}/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            versionSlug: test.defaultVersion.slug,
            modelSlug: "gemini-2.5-flash",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const runSlug = data.testRun?.slug;
        if (runSlug) {
          router.push(`/${organizationSlug}/projects/${projectSlug}/tests/${test.slug}/runs/${runSlug}`);
        }
      } else {
        console.error("Failed to run test");
      }
    } catch (error) {
      console.error("Error running test:", error);
    }
  };

  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      <Paper sx={{ width: "100%", borderRadius: 0 }}>
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
            Tests in Suite ({tests.length})
          </Typography>
        </Toolbar>
        <TableContainer>
          <Table aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Version</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.map((test) => (
                <TableRow
                  hover
                  key={test.id}
                  onClick={() => handleRowClick(test)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell component="th" scope="row">
                    {test.defaultVersion?.title || `Test ${test.slug}`}
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 300, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {test.defaultVersion?.description || 'No description available'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {test.defaultVersion && (
                      <Chip 
                        label={`v${test.defaultVersion.number}`} 
                        size="small" 
                        color="primary" 
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {tests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No tests in this suite. Use "Manage Tests" to add tests.
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