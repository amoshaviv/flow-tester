"use client";

import * as React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

interface Screenshot {
  id: number;
  path: string;
}

interface ImageGalleryProps {
  screenshots: Screenshot[];
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  screenshots,
  open,
  onClose,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Update current index when initial index changes
  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [open, currentIndex, screenshots.length]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === screenshots.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? screenshots.length - 1 : prevIndex - 1
    );
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const currentScreenshot = screenshots[currentIndex];
  const imageUrl = `https://flow-tester.s3.us-west-2.amazonaws.com/${currentScreenshot?.path}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.9)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
      >
        {/* Header with close button and counter */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            {currentIndex + 1} / {screenshots.length}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ color: 'white' }}
            size="large"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Main image area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Previous button */}
          {screenshots.length > 1 && (
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 16,
                zIndex: 2,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
              size="large"
            >
              <ArrowBackIosIcon />
            </IconButton>
          )}

          {/* Main image */}
          <Box
            component="img"
            src={imageUrl}
            alt={`Screenshot ${currentIndex + 1}`}
            sx={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: 1,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />

          {/* Next button */}
          {screenshots.length > 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 16,
                zIndex: 2,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
              size="large"
            >
              <ArrowForwardIosIcon />
            </IconButton>
          )}
        </Box>

        {/* Thumbnail strip at bottom */}
        {!isMobile && screenshots.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              overflowX: 'auto',
              maxHeight: 120,
            }}
          >
            {screenshots.map((screenshot, index) => (
              <Box
                key={screenshot.id}
                component="img"
                src={`https://flow-tester.s3.us-west-2.amazonaws.com/${screenshot.path}`}
                alt={`Thumbnail ${index + 1}`}
                onClick={() => handleThumbnailClick(index)}
                sx={{
                  width: 80,
                  height: 60,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: 1,
                  border: currentIndex === index ? '3px solid white' : '1px solid rgba(255,255,255,0.3)',
                  transition: 'all 0.2s ease',
                  opacity: currentIndex === index ? 1 : 0.7,
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.05)',
                  },
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ))}
          </Box>
        )}

        {/* Mobile navigation dots */}
        {isMobile && screenshots.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
            }}
          >
            {screenshots.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleThumbnailClick(index)}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: currentIndex === index ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'white',
                    transform: 'scale(1.2)',
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default ImageGallery;