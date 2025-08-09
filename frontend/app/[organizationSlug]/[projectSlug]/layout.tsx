import * as React from "react";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Menu from "@mui/material/Menu";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { redirect } from "next/navigation";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Link from "next/link";
import ProjectMenu from "./ProjectMenu";
const drawerWidth = 200;

export default async function OrganizationLayout(props: {
  children: React.ReactNode;
  params: Promise<{ projectSlug: string; organizationSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  const { params, children } = props;
  const { projectSlug, organizationSlug } = await params;

  const dbModels = await getDBModels();
  const { Project } = dbModels;
  const project = await Project.findBySlugAndOrganizationSlug(
    projectSlug,
    organizationSlug
  );
  
  if (!project) redirect("/dashboard");

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <ProjectMenu project={project.toJSON()} />
          <Divider />
          <List>
            <ListItem key={"Tests"} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <AccountTreeIcon />
                </ListItemIcon>
                <ListItemText primary={"Tests"} />
              </ListItemButton>
            </ListItem>
            <ListItem key={"Runs"} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <PlayArrowIcon />
                </ListItemIcon>
                <ListItemText primary={"Runs"} />
              </ListItemButton>
            </ListItem>
            <ListItem key={"Settings"} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary={"Settings"} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
