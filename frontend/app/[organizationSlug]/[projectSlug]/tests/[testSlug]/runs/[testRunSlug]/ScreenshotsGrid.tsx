"use client";

import * as React from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import ImageGallery from "./ImageGallery";

interface Screenshot {
  id: number;
  path: string;
}

interface ScreenshotsGridProps {
  screenshots: Screenshot[];
}

const ScreenshotsGrid: React.FC<ScreenshotsGridProps> = ({ screenshots }) => {
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setGalleryOpen(true);
  };

  const handleGalleryClose = () => {
    setGalleryOpen(false);
  };

  return (
    <>
      <Grid container spacing={1}>
        {screenshots.map((screenshot, index) => (
          <Grid
            key={screenshot.id}
            sx={{ display: 'flex' }} 
            size={{ md: 6, xs: 12 }}
          >
            <Box
              component="img"
              src={`https://flow-tester.s3.us-west-2.amazonaws.com/${screenshot.path}`}
              alt={`Screenshot ${index + 1}`}
              onClick={() => handleImageClick(index)}
              sx={{
                width: "100%",
                cursor: "pointer",
                borderRadius: 1,
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Image Gallery Modal */}
      <ImageGallery
        screenshots={screenshots}
        open={galleryOpen}
        onClose={handleGalleryClose}
        initialIndex={selectedImageIndex}
      />
    </>
  );
};

export default ScreenshotsGrid;