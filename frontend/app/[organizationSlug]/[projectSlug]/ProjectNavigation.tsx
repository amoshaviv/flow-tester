"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from '@mui/icons-material/Home';
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";

interface ProjectNavigationProps {
  organizationSlug: string;
  projectSlug: string;
}

export default function ProjectNavigation({ organizationSlug, projectSlug }: ProjectNavigationProps) {
  const pathname = usePathname();
  
  const isHomeSelected = pathname === `/${organizationSlug}/${projectSlug}`;
  const isTestsSelected = pathname === `/${organizationSlug}/${projectSlug}/tests`;
  const isRunsSelected = pathname === `/${organizationSlug}/${projectSlug}/runs`;
  const isSettingsSelected = pathname === `/${organizationSlug}/${projectSlug}/settings`;

  return (
    <List>
      <ListItem key={"Home"} disablePadding>
        <ListItemButton 
          selected={isHomeSelected}
          component={Link}
          href={`/${organizationSlug}/${projectSlug}`}
        >
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary={"Home"} />
        </ListItemButton>
      </ListItem>
      <ListItem key={"Tests"} disablePadding>
        <ListItemButton
          selected={isTestsSelected}
          component={Link}
          href={`/${organizationSlug}/${projectSlug}/tests`}
        >
          <ListItemIcon>
            <AccountTreeIcon />
          </ListItemIcon>
          <ListItemText primary={"Tests"} />
        </ListItemButton>
      </ListItem>
      <ListItem key={"Runs"} disablePadding>
        <ListItemButton
          selected={isRunsSelected}
          component={Link}
          href={`/${organizationSlug}/${projectSlug}/runs`}
        >
          <ListItemIcon>
            <PlayArrowIcon />
          </ListItemIcon>
          <ListItemText primary={"Runs"} />
        </ListItemButton>
      </ListItem>
      <ListItem key={"Settings"} disablePadding>
        <ListItemButton
          selected={isSettingsSelected}
          component={Link}
          href={`/${organizationSlug}/${projectSlug}/settings`}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary={"Settings"} />
        </ListItemButton>
      </ListItem>
    </List>
  );
} 