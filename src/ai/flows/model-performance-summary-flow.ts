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
    .describe("The confidence score of the model, a number between 0 and 1."),
  predictionReliability: z
    .enum(['high', 'medium', 'low'])
    .describe("The prediction reliability rating of the model."),
  recommendation: z
    .string()
    .describe("The investment recommendation provided by the model (e.g., 'STRONG_BUY', 'HOLD')."),
  riskLevel: z
    .enum(['low', 'medium', 'high'])
    .describe("The risk level associated with the model's predictions."),
});
export type ModelPerformanceSummaryInput = z.infer<
  typeof ModelPerformanceSummaryInputSchema
>;

const ModelPerformanceSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe("A plain-text summary of the forecast model's performance."),
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
  prompt: `Generate a concise, plain-text summary of a forecast model's performance based on the following metrics.

Follow this pattern: "Confidence of X%, prediction reliability rating of Y, giving the investment advice of Z, with a risk level of W."

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
