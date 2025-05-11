
import { HelpCircle, Mail, LifeBuoy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Support | Manga Walker',
  description: 'Get help and support for Manga Walker.',
};

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex flex-col items-center text-center mb-12">
        <LifeBuoy className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-4xl font-bold">Support Center</h1>
        <p className="text-xl text-muted-foreground mt-2">We're here to help! Find answers to your questions below.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-6 h-6 mr-3 text-primary" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Find quick answers to common questions about our platform, subscriptions, and features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>How do I subscribe to a manga?</li>
              <li>How does manga investment work?</li>
              <li>How can I become a creator?</li>
              <li>What are the platform fees?</li>
              <li>How do I reset my password?</li>
            </ul>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/faq">View All FAQs (Coming Soon)</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-6 h-6 mr-3 text-primary" />
              Contact Us
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? Get in touch with our support team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              For general inquiries, technical support, or feedback, please email us at:
            </p>
            <p className="font-semibold text-primary text-lg">
              support@manga-walker.example.com
            </p>
            <p className="text-xs text-muted-foreground">
              We aim to respond to all queries within 24-48 business hours.
            </p>
             <Button className="mt-4 w-full" asChild>
                <a href="mailto:support@manga-walker.example.com">Send an Email</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-2">Community Forums (Coming Soon)</h3>
          <p className="text-muted-foreground">
            Connect with other users and creators, ask questions, and share your experiences on our community forums.
          </p>
      </div>

      <p className="mt-16 text-sm text-center text-muted-foreground">
        This is a placeholder support page. Please update the contact information and FAQ content.
      </p>
    </div>
  );
}
