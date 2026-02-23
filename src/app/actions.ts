"use server";

import { modelPerformanceSummary, type ModelPerformanceSummaryInput } from '@/ai/flows/model-performance-summary-flow';
import { detailedTechnicalAnalysisReport, type DetailedTechnicalAnalysisReportInput } from '@/ai/flows/detailed-technical-analysis-report-flow';

export async function generatePerformanceSummary(input: ModelPerformanceSummaryInput): Promise<string> {
  try {
    const result = await modelPerformanceSummary(input);
    return result.summary;
  } catch (error) {
    console.error("Erro ao gerar o resumo de desempenho:", error);
    return "Não foi possível gerar o resumo de desempenho.";
  }
}

export async function generateTechnicalAnalysisReport(input: DetailedTechnicalAnalysisReportInput): Promise<string> {
  try {
    const result = await detailedTechnicalAnalysisReport(input);
    return result.report;
  } catch (error) {
    console.error("Erro ao gerar o relatório de análise técnica:", error);
    // This is a common error if the API is not running or misconfigured.
    if (error instanceof Error && (error.message.includes('API_KEY or API_HOST') || error.message.includes('ECONNREFUSED'))) {
        return `### Não foi possível gerar o Relatório de Análise Técnica
        
Verifique se o servidor da API Python está em execução e se as variáveis de ambiente \`API_KEY\` e \`API_HOST\` estão definidas corretamente no seu arquivo \`.env\`.

**Detalhes:**
${error.message}`;
    }
    return "Ocorreu um erro inesperado ao gerar o relatório de análise técnica.";
  }
}
