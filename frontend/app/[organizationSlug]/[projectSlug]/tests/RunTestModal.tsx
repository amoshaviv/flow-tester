"use client";

import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface RunTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: any[];
  selectedTest: string;
  onTestChange: (testSlug: string) => void;
  onRunTest: () => void;
  isRunning: boolean;
}

export default function RunTestModal({
  isOpen,
  onClose,
  tests,
  selectedTest,
  onTestChange,
  onRunTest,
  isRunning,
}: RunTestModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Box
          sx={{
            maxWidth: `calc(100vw - 16px)`,
            height: `calc(var(--unit-100vh) - 16px)`,
            width: 480,
            bgcolor: "background.paper",
            border: "2px solid #000",
            borderRadius: 2,
            boxShadow: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              pl: 1.5,
              pt: 1,
              pb: 1,
              borderBottom: "#000 1px solid",
              display: "flex",
            }}
          >
            <Box
              key="model-title"
              sx={{ display: "flex", flexGrow: 1, alignItems: "center" }}
            >
              <Typography variant="button">Run Test</Typography>
            </Box>
            <Box sx={{ mr: 1 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={onClose}
                disabled={isRunning}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          <Box>
            <Grid container spacing={2} sx={{ p: 1.5 }}>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel id="test-select-label">Select Test</InputLabel>
                  <Select
                    labelId="test-select-label"
                    value={selectedTest}
                    label="Select Test"
                    onChange={(e) => onTestChange(e.target.value)}
                    disabled={isRunning}
                  >
                    {tests?.map((test) => (
                      <MenuItem key={test.slug} value={test.slug}>
                        {test.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
          <Box
            sx={{
              px: 1.5,
              pb: 1.5,
              borderBottom: "#000 1px solid",
              display: "flex",
              gap: 2,
            }}
          >
            <Button
              sx={{ borderRadius: "25px" }}
              size="large"
              fullWidth
              onClick={onClose}
              disabled={isRunning}
            >
              Cancel
            </Button>
            <Button
              sx={{ borderRadius: "25px" }}
              size="large"
              fullWidth
              variant="contained"
              color="success"
              onClick={onRunTest}
              disabled={isRunning || !selectedTest}
            >
              {isRunning ? (
                <CircularProgress size={24} />
              ) : (
                "Run Test"
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}