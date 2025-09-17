import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import NextLink from "next/link";
import { getSession } from "@/lib/next-auth";
import { redirect, RedirectType } from "next/navigation";
import { getDBModels } from "@/lib/sequelize";
import { OrganizationAnalysisStatus } from "@/lib/sequelize/models/organization-analysis";
import { getAnalysisSummary } from "@/lib/s3";
import AnalysisCTACard from "./AnalysisCTACard";

const redirectToSignIn = () =>
  redirect("/authentication/signin", RedirectType.push);
const redirectToOrganizations = () =>
  redirect("/organizations", RedirectType.push);

export default async function Home(props: {
  params: Promise<{ projectSlug: string; organizationSlug: string }>;
}) {
  const session = await getSession();
  const email = session?.user?.email;
  if (!email) return redirectToSignIn();

  const { params } = props;
  const { projectSlug, organizationSlug } = await params;
  const dbModels = await getDBModels();

  const { Organization, OrganizationAnalysis } = dbModels;

  try {
    const organization = await Organization.findBySlugAndUserEmail(
      organizationSlug,
      email
    );
    if (!organization) return redirectToOrganizations();

    const latestAnalysis = await OrganizationAnalysis.findLatestByOrganization(organization);
    let showAnalysisCTA = false;
    let analysisResult = null;

    if (latestAnalysis?.status === OrganizationAnalysisStatus.Succeeded) {
      const analysisSummary = await getAnalysisSummary(latestAnalysis.slug);
      analysisResult = (analysisSummary && analysisSummary.final_result) ? JSON.parse(analysisSummary.final_result) : null;
      showAnalysisCTA = true;
    }

    return (
      <Box>
        {showAnalysisCTA && latestAnalysis && analysisResult && (
          <AnalysisCTACard
            analysisDomain={organization.domain}
            organizationSlug={organizationSlug}
            projectSlug={projectSlug}
            analysisSlug={latestAnalysis.slug}
            numberOfTestCases={analysisResult.tests.length}
          />
        )}
      </Box>
    );
  } catch (err) {
    console.log(err);
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 1.2, pl: 2, pr: 2 }}>
          Error
        </Box>
      </Container>
    );
  }
}
