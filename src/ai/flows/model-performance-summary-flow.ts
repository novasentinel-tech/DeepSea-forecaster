'use server';
/**
 * @fileOverview A Genkit flow that generates a plain-text summary of a forecast model's performance.
 *
 * - modelPerformanceSummary - A function that generates a plain-text summary of a forecast model's performance.
 * - ModelPerformanceSummaryInput - The input type for the modelPerformanceSummary function.
 * - ModelPerformanceSummaryOutput - The return type for the modelPerformanceSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModelPerformanceSummaryInputSchema = z.object({
  modelConfidence: z
    .number()
    .describe("A pontuação de confiança do modelo, um número entre 0 e 1."),
  predictionReliability: z
    .enum(['high', 'medium', 'low'])
    .describe("A classificação de confiabilidade da previsão do modelo."),
  recommendation: z
    .string()
    .describe("A recomendação de investimento fornecida pelo modelo (ex: 'STRONG_BUY', 'HOLD')."),
  riskLevel: z
    .enum(['low', 'medium', 'high'])
    .describe("O nível de risco associado às previsões do modelo."),
});
export type ModelPerformanceSummaryInput = z.infer<
  typeof ModelPerformanceSummaryInputSchema
>;

const ModelPerformanceSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe("Um resumo em texto simples do desempenho do modelo de previsão."),
});
export type ModelPerformanceSummaryOutput = z.infer<
  typeof ModelPerformanceSummaryOutputSchema
>;

export async function modelPerformanceSummary(
  input: ModelPerformanceSummaryInput
): Promise<ModelPerformanceSummaryOutput> {
  return modelPerformanceSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'modelPerformanceSummaryPrompt',
  input: {schema: ModelPerformanceSummaryInputSchema},
  output: {schema: ModelPerformanceSummaryOutputSchema},
  prompt: `Gere um resumo conciso em texto simples do desempenho de um modelo de previsão com base nas seguintes métricas.

Siga este padrão: "Confiança de X%, classificação de confiabilidade de previsão de Y, dando o conselho de investimento de Z, com um nível de risco de W."

Model Confidence: {{{modelConfidence}}}
Prediction Reliability: {{{predictionReliability}}}
Recommendation: {{{recommendation}}}
Risk Level: {{{riskLevel}}}`,
});

const modelPerformanceSummaryFlow = ai.defineFlow(
  {
    name: 'modelPerformanceSummaryFlow',
    inputSchema: ModelPerformanceSummaryInputSchema,
    outputSchema: ModelPerformanceSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
