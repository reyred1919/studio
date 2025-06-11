// use server'

/**
 * @fileOverview An AI agent that provides suggestions for OKR improvements based on progress, confidence levels, and initiative status.
 *
 * - suggestOkrsImprovements - A function that analyzes OKR data and provides suggestions for improvement.
 * - SuggestOkrsImprovementsInput - The input type for the suggestOkrsImprovements function.
 * - SuggestOkrsImprovementsOutput - The return type for the suggestOkrsImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOkrsImprovementsInputSchema = z.object({
  objectiveDescription: z.string().describe('A description of the objective.'),
  keyResults: z.array(
    z.object({
      keyResultDescription: z.string().describe('A description of the key result.'),
      progress: z.number().describe('The current progress of the key result (0-100).'),
      confidenceLevel: z.string().describe('The user assessed confidence level for achieving the key result (e.g., High, Medium, Low).'),
      initiatives: z.array(
        z.object({
          initiativeDescription: z.string().describe('A description of the initiative.'),
          status: z.string().describe('The current status of the initiative (e.g., Not Started, In Progress, Completed, Blocked).'),
        })
      ),
    })
  ).describe('An array of key results with their progress, confidence levels and initiatives.'),
});
export type SuggestOkrsImprovementsInput = z.infer<typeof SuggestOkrsImprovementsInputSchema>;

const SuggestOkrsImprovementsOutputSchema = z.object({
  suggestions: z.array(
    z.string().describe('Specific, actionable suggestions for improving the OKRs.')
  ).describe('A list of suggestions for OKR improvements.')
});
export type SuggestOkrsImprovementsOutput = z.infer<typeof SuggestOkrsImprovementsOutputSchema>;

export async function suggestOkrsImprovements(input: SuggestOkrsImprovementsInput): Promise<SuggestOkrsImprovementsOutput> {
  return suggestOkrsImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOkrsImprovementsPrompt',
  input: {schema: SuggestOkrsImprovementsInputSchema},
  output: {schema: SuggestOkrsImprovementsOutputSchema},
  prompt: `You are an expert OKR coach. Analyze the following OKR data and provide specific, actionable suggestions for improvements. Consider the progress, confidence levels, and initiative status for each key result. Focus on areas where the OKRs may be lagging or where confidence is low.

Objective: {{{objectiveDescription}}}

Key Results:
{{#each keyResults}}
  - Key Result: {{{keyResultDescription}}}
    - Progress: {{{progress}}}%
    - Confidence Level: {{{confidenceLevel}}}
    - Initiatives:
    {{#each initiatives}}
      - Initiative: {{{initiativeDescription}}} - Status: {{{status}}}
    {{/each}}
{{/each}}

Suggestions:
`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const suggestOkrsImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestOkrsImprovementsFlow',
    inputSchema: SuggestOkrsImprovementsInputSchema,
    outputSchema: SuggestOkrsImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
