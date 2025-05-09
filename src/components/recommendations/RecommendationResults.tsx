import type { RecommendMangaOutput } from "@/ai/flows/manga-recommendation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Info } from "lucide-react";

interface RecommendationResultsProps {
  recommendations: RecommendMangaOutput['recommendations'];
  reasoning?: string | null;
}

export function RecommendationResults({ recommendations, reasoning }: RecommendationResultsProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="mt-8 bg-secondary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-muted-foreground" />
            No Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The AI couldn't find any specific recommendations based on your input. Try rephrasing your history or preferences.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 p-6 border-t">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <CheckCircle className="h-7 w-7 text-green-500" />
        Here are your recommendations!
      </h2>
      
      <div className="space-y-6">
        {recommendations.map((rec, index) => {
          // Attempt to parse "Title: Explanation" format
          const parts = rec.split(/:\s*(.*)/s);
          const title = parts[0] || `Recommendation ${index + 1}`;
          const explanation = parts[1] || "No specific explanation provided.";

          return (
            <Card key={index} className="bg-background shadow-md overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl">{title.replace(/^- /, '')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{explanation}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {reasoning && (
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              Overall Reasoning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary/90 leading-relaxed">{reasoning}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
