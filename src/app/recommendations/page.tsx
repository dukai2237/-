import { RecommendationForm } from '@/components/recommendations/RecommendationForm';

export const metadata = {
  title: 'Manga Recommendations | Manga Reader',
  description: 'Get personalized manga recommendations based on your reading history and preferences.',
};

export default function RecommendationsPage() {
  return (
    <div className="py-8">
      <RecommendationForm />
    </div>
  );
}
