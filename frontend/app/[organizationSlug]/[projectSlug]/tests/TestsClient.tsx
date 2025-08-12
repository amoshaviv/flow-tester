"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TestsTable from "./TestsTable";

export default function TestsClient({ initialTests }: { initialTests: any[] }) {
  const [tests, setTests] = useState(initialTests);
  const [isLoading, setIsLoading] = useState(false);
  const params: { projectSlug: string; organizationSlug: string } = useParams();
  const { projectSlug, organizationSlug } = params;

  const refreshTests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/tests`
      );
      if (response.ok) {
        const data = await response.json();
        // Transform the data similar to server-side processing
        const defaultVersionsTests = data
          .filter((test: any) => test.versions.length > 0)
          .map((test: any) => {
            const defaultTestVersion = test.versions.find(
              (version: any) => version.isDefault
            );
            return {
              slug: test.slug,
              title: defaultTestVersion?.title,
              description: defaultTestVersion?.description,
              defaultVersion: {
                slug: defaultTestVersion?.slug,
                title: defaultTestVersion?.title,
                description: defaultTestVersion?.description,
                number: defaultTestVersion?.number,
              },
              totalVersions: test.versions.length,
              totalRuns: 0,
            };
          });
        setTests(defaultVersionsTests);
      }
    } catch (error) {
      console.error("Failed to refresh tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TestsTable
      tests={tests}
      onTestsChange={refreshTests}
      organizationSlug={organizationSlug}
      projectSlug={projectSlug}
    />
  );
}
