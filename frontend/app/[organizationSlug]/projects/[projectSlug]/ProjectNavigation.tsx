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
import AutoModeIcon from '@mui/icons-material/AutoMode';
import SettingsIcon from "@mui/icons-material/Settings";
import BugReportIcon from '@mui/icons-material/BugReport';
import SchemaIcon from '@mui/icons-material/Schema';
import Link from "next/link";

interface ProjectNavigationProps {
  organizationSlug: string;
  projectSlug: string;
}

export default function ProjectNavigation({ organizationSlug, projectSlug }: ProjectNavigationProps) {
  const pathname = usePathname();
  
  const isHomeSelected = pathname === `/${organizationSlug}/projects/${projectSlug}`;
  const isTestsSelected = pathname === `/${organizationSlug}/projects/${projectSlug}/tests`;
  const isRunsSelected = pathname === `/${organizationSlug}/projects/${projectSlug}/runs`;
  const isAutomationSelected = pathname === `/${organizationSlug}/projects/${projectSlug}/automation`;
  const isSuitesSelected = pathname === `/${organizationSlug}/projects/${projectSlug}/suites`;
  const isSettingsSelected = pathname === `/${organizationSlug}/projects/${projectSlug}/settings`;

  return (
    <List>
      <ListItem key={"Home"} disablePadding>
        <ListItemButton 
          selected={isHomeSelected}
          component={Link}
          href={`/${organizationSlug}/projects/${projectSlug}`}
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
          href={`/${organizationSlug}/projects/${projectSlug}/tests`}
        >
          <ListItemIcon>
            <BugReportIcon />
          </ListItemIcon>
          <ListItemText primary={"Tests"} />
        </ListItemButton>
      </ListItem>
      <ListItem key={"Suites"} disablePadding>
        <ListItemButton
          selected={isSuitesSelected}
          component={Link}
          href={`/${organizationSlug}/projects/${projectSlug}/suites`}
        >
          <ListItemIcon>
            <SchemaIcon />
          </ListItemIcon>
          <ListItemText primary={"Suites"} />
        </ListItemButton>
      </ListItem>
      <ListItem key={"Runs"} disablePadding>
        <ListItemButton
          selected={isRunsSelected}
          component={Link}
          href={`/${organizationSlug}/projects/${projectSlug}/runs`}
        >
          <ListItemIcon>
            <PlayArrowIcon />
          </ListItemIcon>
          <ListItemText primary={"Runs"} />
        </ListItemButton>
      </ListItem>
      <ListItem key={"Automation"} disablePadding>
        <ListItemButton
          selected={isAutomationSelected}
          component={Link}
          href={`/${organizationSlug}/projects/${projectSlug}/automation`}
        >
          <ListItemIcon>
            <AutoModeIcon />
          </ListItemIcon>
          <ListItemText primary={"Automation"} />
        </ListItemButton>
      </ListItem>
      <ListItem key={"Settings"} disablePadding>
        <ListItemButton
          selected={isSettingsSelected}
          component={Link}
          href={`/${organizationSlug}/projects/${projectSlug}/settings`}
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