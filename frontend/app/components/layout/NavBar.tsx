"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import PersonIcon from "@mui/icons-material/Person";
import Link from "next/link";
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react";

import BookmarksIcon from "@mui/icons-material/Bookmarks";
import { Avatar, Menu, MenuItem, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";

export default function NavBar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const user = isAuthenticated ? session.user : null;

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSignout = () => {
    setAnchorElUser(null);
    signOut();
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar component="nav">
        <Toolbar>
          <Box sx={{ flexGrow: 0 }}>
            <IconButton
              sx={{
                ml: 0,
                visibility: "hidden",
              }}
              color="inherit"
              edge="start"
            >
              <BookmarksIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, textAlign: "center" }}>
            <Link href="/">
              <img
                alt="Application"
                src="/img/logo.png"
                style={{ height: 40, width: 40 }}
              />
            </Link>
          </Box>
          {!isAuthenticated && (
            <Box sx={{ flexGrow: 0 }}>
              <IconButton
                LinkComponent={Link}
                color="inherit"
                aria-label="Sign In"
                edge="start"
                href="/authentication/signin"
                sx={{ ml: 0 }}
              >
                <PersonIcon />
              </IconButton>
            </Box>
          )}
          {isAuthenticated && (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title={user?.displayName}>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.displayName} src={user?.profileImageURL} />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={handleCloseUserMenu}
                    component={Link}
                    href={"/dashboard"}
                  >
                    <ListItemText primary="Dashboard" />
                  </ListItemButton>
                </ListItem>
                <MenuItem onClick={handleSignout}>
                  <Typography sx={{ textAlign: "center" }}>Sign out</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main">
        <Toolbar />
      </Box>
    </Box>
  );
}
