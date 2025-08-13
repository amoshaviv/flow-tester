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
        setTests(data);
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
