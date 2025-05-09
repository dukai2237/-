"use client";

import { useFormState, useFormStatus } from "react-dom";
import { getMangaRecommendationsAction, RecommendationFormState } from "@/app/recommendations/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, AlertCircle } from "lucide-react";
import { RecommendationResults } from "./RecommendationResults";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Getting Recommendations...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" /> Get Recommendations
        </>
      )}
    </Button>
  );
}

const initialState: RecommendationFormState = {
  message: null,
  recommendations: null,
  reasoning: null,
  errors: null,
  success: false,
};

export function RecommendationForm() {
  const [state, formAction] = useFormState(getMangaRecommendationsAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message && !state.success && state.errors?._form) {
       toast({
        title: "Recommendation Error",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [state, toast]);


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sparkles className="text-primary h-7 w-7" />
          Manga Recommender
        </CardTitle>
        <CardDescription>
          Tell us about your reading history and preferences, and our AI will suggest new manga for you!
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="readingHistory" className="text-base">Your Reading History</Label>
            <Textarea
              id="readingHistory"
              name="readingHistory"
              placeholder="e.g., I've read Naruto, Bleach, One Piece. I enjoyed the long story arcs and character development in One Piece, and the fight scenes in Bleach."
              rows={5}
              className="text-base"
              aria-describedby="readingHistory-error"
            />
            {state?.errors?.readingHistory && (
              <p id="readingHistory-error" className="text-sm text-destructive mt-1">
                {state.errors.readingHistory.join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferences" className="text-base">Your Preferences</Label>
            <Textarea
              id="preferences"
              name="preferences"
              placeholder="e.g., I'm looking for something with a unique art style, maybe a seinen manga with psychological themes. I prefer completed series but I'm open to ongoing ones if they are highly acclaimed."
              rows={5}
              className="text-base"
              aria-describedby="preferences-error"
            />
             {state?.errors?.preferences && (
              <p id="preferences-error" className="text-sm text-destructive mt-1">
                {state.errors.preferences.join(", ")}
              </p>
            )}
          </div>
            {state?.errors?._form && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {state.errors._form.join(", ")}
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
      
      {state?.success && state.recommendations && (
        <RecommendationResults recommendations={state.recommendations} reasoning={state.reasoning} />
      )}
    </Card>
  );
}
