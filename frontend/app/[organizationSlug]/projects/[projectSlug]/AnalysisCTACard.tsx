"use client";

import * as React from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
} from "@mui/material";
import Link from "next/link";


interface AnalysisCTACardProps {
    analysisDomain: string;
    analysisSlug: string;
    numberOfTestCases: number;
    organizationSlug: string;
    projectSlug: string;
}

export default function AnalysisCTACard({
    analysisSlug, numberOfTestCases, analysisDomain, organizationSlug, projectSlug
}: AnalysisCTACardProps) {

    return (
        <Box>
            <Card sx={{borderRadius: 0}}>
                <CardContent >
                    <Typography variant="h4" textAlign="center">
                        An analysis of {analysisDomain} found {numberOfTestCases} possible test cases! <br />
                        <Link href={`/${organizationSlug}/projects/${projectSlug}/analyses/${analysisSlug}`}>Visit the analysis page to check it out</Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}