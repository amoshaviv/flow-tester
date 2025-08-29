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
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// LLM Model definitions - truncated for brevity, full definitions would go here
const MODELS = {
  "light_cost_effective": [
    { "provider": "Google", "model": "Gemini 2.5 Flash-Lite", "api_slug": "gemini-2.5-flash-lite" },
    { "provider": "Google", "model": "Gemini 2.0 Flash-Lite", "api_slug": "gemini-2.0-flash-lite" },
    { "provider": "OpenAI", "model": "GPT-5 Nano", "api_slug": "gpt-5-nano" },
    { "provider": "OpenAI", "model": "GPT-4.1 Nano", "api_slug": "gpt-4.1-nano" },
    { "provider": "OpenAI", "model": "GPT-4o Mini", "api_slug": "gpt-4o-mini" },
    { "provider": "Anthropic", "model": "Claude Haiku 3", "api_slug": "claude-3-haiku-20240307" }
  ],
  "medium_balanced": [
    { "provider": "Google", "model": "Gemini 2.5 Flash", "api_slug": "gemini-2.5-flash" },
    { "provider": "Google", "model": "Gemini 2.0 Flash", "api_slug": "gemini-2.0-flash" },
    { "provider": "OpenAI", "model": "GPT-5 Mini", "api_slug": "gpt-5-mini" },
    { "provider": "OpenAI", "model": "GPT-4.1 Mini", "api_slug": "gpt-4.1-mini" },
    { "provider": "Anthropic", "model": "Claude Haiku 3.5", "api_slug": "claude-3-5-haiku-20241022" }
  ],
  "heavy_effective": [
    { "provider": "Google", "model": "Gemini 2.5 Pro", "api_slug": "gemini-2.5-pro" },
    { "provider": "OpenAI", "model": "GPT-5", "api_slug": "gpt-5" },
    { "provider": "OpenAI", "model": "GPT-4.1", "api_slug": "gpt-4.1" },
    { "provider": "Anthropic", "model": "Claude Sonnet 3.7", "api_slug": "claude-3-7-sonnet-20250219" },
    { "provider": "Anthropic", "model": "Claude Sonnet 4", "api_slug": "claude-sonnet-4-20250514" }
  ],
  "pro_reasoning": [
    { "provider": "OpenAI", "model": "o3-mini", "api_slug": "o3-mini" },
    { "provider": "OpenAI", "model": "o4-mini", "api_slug": "o4-mini" },
    { "provider": "OpenAI", "model": "o3", "api_slug": "o3" },
    { "provider": "OpenAI", "model": "o3-pro", "api_slug": "o3-pro-2025-06-10" },
    { "provider": "Anthropic", "model": "Claude Opus 4", "api_slug": "claude-opus-4-20250514" },
    { "provider": "Anthropic", "model": "Claude Opus 4.1", "api_slug": "claude-opus-4-1-20250805" }
  ]
};

const CATEGORY_LABELS = {
  "light_cost_effective": "Light & Cost Effective",
  "medium_balanced": "Balanced",
  "heavy_effective": "Heavy Duty",
  "pro_reasoning": "Pro Reasoning"
};

interface RunTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: any[];
  selectedTest: string;
  onTestChange: (testSlug: string) => void;
  selectedVersion: string;
  onVersionChange: (versionSlug: string) => void;
  selectedModel: string;
  onModelChange: (modelSlug: string) => void;
  onRunTest: () => void;
  isRunning: boolean;
}

export default function RunTestModal({
  isOpen,
  onClose,
  tests,
  selectedTest,
  onTestChange,
  selectedVersion,
  onVersionChange,
  selectedModel,
  onModelChange,
  onRunTest,
  isRunning,
}: RunTestModalProps) {
  // Get versions for the selected test
  const selectedTestObj = tests.find(test => test.slug === selectedTest);
  const versions = selectedTestObj?.versions || [];
  const selectedVersionObj = selectedTestObj?.versions.find(version => version.slug === selectedVersion);

  // Get all models for the select dropdown
  const allModels = Object.entries(MODELS).flatMap(([category, models]) =>
    models.map(model => ({ ...model, category }))
  );

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
            width: 800,
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
              <Grid size={6}>
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
                <FormControl fullWidth sx={{ mt: 1.6 }}>
                  <InputLabel id="version-select-label">Select Version</InputLabel>
                  <Select
                    labelId="version-select-label"
                    value={selectedVersion}
                    label="Select Version"
                    onChange={(e) => onVersionChange(e.target.value)}
                    disabled={isRunning || !selectedTest}
                  >
                    {versions.map((version) => (
                      <MenuItem key={version.slug} value={version.slug}>
                        V.{version.number}
                        {version.isDefault && " (Default)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mt: 1.6 }}>
                  <InputLabel id="model-select-label">Select Model</InputLabel>
                  <Select
                    labelId="model-select-label"
                    value={selectedModel}
                    label="Select Model"
                    onChange={(e) => onModelChange(e.target.value)}
                    disabled={isRunning}
                    MenuProps={{
                      slotProps: {
                        paper: {
                          style: {
                            maxHeight: '240px'
                          }
                        }
                      }
                    }}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([categoryKey, categoryLabel]) => [
                      <MenuItem key={categoryKey} disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {categoryLabel}
                      </MenuItem>,
                      ...MODELS[categoryKey].map((model) => (
                        <MenuItem key={model.api_slug} value={model.api_slug} sx={{ pl: 4 }}>
                          {model.provider} {model.model}
                        </MenuItem>
                      ))
                    ])}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth>
                  <TextField
                    required
                    id="description"
                    name="description"
                    label="Description"
                    minRows={4}
                    maxRows={14}
                    value={selectedVersionObj?.description}
                    multiline
                    variant="outlined"
                    disabled
                  />
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
              disabled={isRunning || !selectedTest || !selectedVersion}
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