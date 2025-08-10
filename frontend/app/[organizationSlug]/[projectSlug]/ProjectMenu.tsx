"use client";

import * as React from "react";
import List from "@mui/material/List";
import Menu from "@mui/material/Menu";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Link from "next/link";
import { IProjectInstance } from "@/lib/sequelize/models/project";

export default function ProjectMenu(props: { project: IProjectInstance, organizationSlug: string }) {
  const { project, organizationSlug } = props;
  const [anchorElementProjectMenu, setAnchorElementProjectMenu] =
    React.useState<null | HTMLElement>(null);

  const handleOpenProjectMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElementProjectMenu(event.currentTarget);
  };

  const handleCloseProjectMenu = () => {
    setAnchorElementProjectMenu(null);
  };

  return (
    <React.Fragment>
      <List>
        <ListItem key={project.name} disablePadding>
          <ListItemButton onClick={handleOpenProjectMenu}>
            <ListItemText primary={<b>{project.name}</b>} />
            <ListItemIcon>
              <NavigateNextIcon />
            </ListItemIcon>
          </ListItemButton>
        </ListItem>
      </List>
      <Menu
        id="project-menu"
        anchorEl={anchorElementProjectMenu}
        sx={{ ml: 1 }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        keepMounted
        open={Boolean(anchorElementProjectMenu)}
        onClose={handleCloseProjectMenu}
      >
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleCloseProjectMenu}
            component={Link}
            href={`/${organizationSlug}/${project.slug}/settings`}
          >
            <ListItemText primary="Edit Project Settings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleCloseProjectMenu}
            component={Link}
            href={"/projects"}
          >
            <ListItemText primary="Change Project" />
          </ListItemButton>
        </ListItem>
      </Menu>
    </React.Fragment>
  );
}
