"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TestSuitesTable from "./TestSuitesTable";

export default function TestSuitesClient({ initialTestSuites }: { initialTestSuites: any[] }) {
  const [testSuites, setTestSuites] = useState(initialTestSuites);
  const [isLoading, setIsLoading] = useState(false);
  const params: { projectSlug: string; organizationSlug: string } = useParams();
  const { projectSlug, organizationSlug } = params;

  const refreshTestSuites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationSlug}/projects/${projectSlug}/suites`
      );
      if (response.ok) {
        const data = await response.json();
        setTestSuites(data);
      }
    } catch (error) {
      console.error("Failed to refresh test suites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TestSuitesTable
      testSuites={testSuites}
      onTestSuitesChange={refreshTestSuites}
      organizationSlug={organizationSlug}
      projectSlug={projectSlug}
    />
  );
}