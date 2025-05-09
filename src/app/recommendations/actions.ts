"use server";

import { recommendManga, RecommendMangaInput, RecommendMangaOutput } from "@/ai/flows/manga-recommendation";
import { z } from "zod";

const RecommendationFormSchema = z.object({
  readingHistory: z.string().min(10, "Please describe your reading history in more detail (min 10 characters)."),
  preferences: z.string().min(10, "Please describe your preferences in more detail (min 10 characters)."),
});

export type RecommendationFormState = {
  message?: string | null;
  recommendations?: RecommendMangaOutput['recommendations'] | null;
  reasoning?: string | null;
  errors?: {
    readingHistory?: string[];
    preferences?: string[];
    _form?: string[];
  } | null;
  success: boolean;
};

export async function getMangaRecommendationsAction(
  prevState: RecommendationFormState | undefined,
  formData: FormData
): Promise<RecommendationFormState> {
  const validatedFields = RecommendationFormSchema.safeParse({
    readingHistory: formData.get("readingHistory"),
    preferences: formData.get("preferences"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check your inputs.",
      success: false,
    };
  }

  const input: RecommendMangaInput = {
    readingHistory: validatedFields.data.readingHistory,
    preferences: validatedFields.data.preferences,
  };

  try {
    const result = await recommendManga(input);
    if (result && result.recommendations) {
      return {
        recommendations: result.recommendations,
        reasoning: result.reasoning,
        message: "Here are your manga recommendations!",
        success: true,
      };
    } else {
      return {
        message: "Could not generate recommendations at this time. The AI might not have found suitable matches.",
        success: false,
        errors: { _form: ["No recommendations returned from AI."] }
      };
    }
  } catch (error) {
    console.error("Error getting manga recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      message: `An error occurred while fetching recommendations: ${errorMessage}`,
      success: false,
       errors: { _form: [`AI service error: ${errorMessage}`] }
    };
  }
}
