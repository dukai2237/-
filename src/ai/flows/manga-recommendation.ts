'use server';

/**
 * @fileOverview Recommends manga based on user reading history and preferences.
 *
 * - recommendManga - A function that handles the manga recommendation process.
 * - RecommendMangaInput - The input type for the recommendManga function.
 * - RecommendMangaOutput - The return type for the recommendManga function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendMangaInputSchema = z.object({
  readingHistory: z
    .string()
    .describe('The user reading history, including titles and genres.'),
  preferences: z.string().describe('The user preferences for manga.'),
});
export type RecommendMangaInput = z.infer<typeof RecommendMangaInputSchema>;

const RecommendMangaOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of recommended manga titles.'),
  reasoning: z.string().describe('The reasoning behind the recommendations.'),
});
export type RecommendMangaOutput = z.infer<typeof RecommendMangaOutputSchema>;

export async function recommendManga(input: RecommendMangaInput): Promise<RecommendMangaOutput> {
  return recommendMangaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendMangaPrompt',
  input: {schema: RecommendMangaInputSchema},
  output: {schema: RecommendMangaOutputSchema},
  prompt: `You are a manga recommendation expert. Based on the user's reading history and preferences, recommend manga series they might enjoy.

Reading History: {{{readingHistory}}}
Preferences: {{{preferences}}}

Provide a list of manga titles and a brief explanation of why each manga was recommended.

Format your response as follows:

Recommendations:
- Title 1: Explanation
- Title 2: Explanation
Reasoning: Overall reasoning for the recommendations.`,
});

const recommendMangaFlow = ai.defineFlow(
  {
    name: 'recommendMangaFlow',
    inputSchema: RecommendMangaInputSchema,
    outputSchema: RecommendMangaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
