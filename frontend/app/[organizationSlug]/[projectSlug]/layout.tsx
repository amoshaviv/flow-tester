import * as React from "react";
import { getSession } from "@/lib/next-auth";
import { getDBModels } from "@/lib/sequelize";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import { redirect } from "next/navigation";
import ProjectMenu from "./ProjectMenu";
import ProjectNavigation from "./ProjectNavigation";

const drawerWidth = 200;

export default async function ProjectLayout(props: {
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
          <ProjectMenu project={project.toJSON()} organizationSlug={organizationSlug} />
          <Divider />
          <ProjectNavigation organizationSlug={organizationSlug} projectSlug={projectSlug} />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
}
