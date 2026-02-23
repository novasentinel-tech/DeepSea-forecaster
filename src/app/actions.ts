"use server";

import { modelPerformanceSummary, type ModelPerformanceSummaryInput } from '@/ai/flows/model-performance-summary-flow';
import { detailedTechnicalAnalysisReport, type DetailedTechnicalAnalysisReportInput } from '@/ai/flows/detailed-technical-analysis-report-flow';

export async function generatePerformanceSummary(input: ModelPerformanceSummaryInput): Promise<string> {
  try {
    const result = await modelPerformanceSummary(input);
    return result.summary;
  } catch (error) {
    console.error("Error generating performance summary:", error);
    return "Could not generate performance summary.";
  }
}

export async function generateTechnicalAnalysisReport(input: DetailedTechnicalAnalysisReportInput): Promise<string> {
  try {
    const result = await detailedTechnicalAnalysisReport(input);
    return result.report;
  } catch (error) {
    console.error("Error generating technical analysis report:", error);
    // This is a common error if the API is not running or misconfigured.
    if (error instanceof Error && (error.message.includes('API_KEY or API_HOST') || error.message.includes('ECONNREFUSED'))) {
        return `### Could not generate Technical Analysis Report
        
Please ensure the Python API server is running and the \`API_KEY\` and \`API_HOST\` environment variables are correctly set in your \`.env\` file.

**Details:**
${error.message}`;
    }
    return "An unexpected error occurred while generating the technical analysis report.";
  }
}
