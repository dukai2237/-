
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Manga Walker',
  description: 'Read our Terms of Service.',
};

export default function TermsOfServicePage() {
  return (
    <div className="prose dark:prose-invert max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center mb-8">
        <FileText className="w-10 h-10 text-primary mr-4" />
        <h1 className="text-4xl font-bold m-0">Terms of Service</h1>
      </div>

      <p className="text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <p>Welcome to Manga Walker! These terms and conditions outline the rules and regulations for the use of Manga Walker's Website.</p>

      <h2 className="mt-8">1. Introduction</h2>
      <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Manga Walker if you do not agree to take all of the terms and conditions stated on this page.</p>

      <h2 className="mt-6">2. Intellectual Property Rights</h2>
      <p>Other than the content you own, under these Terms, Manga Walker and/or its licensors own all the intellectual property rights and materials contained in this Website. You are granted limited license only for purposes of viewing the material contained on this Website.</p>
      <p>Creators retain all rights to their uploaded content, but grant Manga Walker a license to display and distribute it on the platform according to the terms agreed upon during content submission.</p>

      <h2 className="mt-6">3. User Responsibilities</h2>
      <p>Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account. Users agree not to engage in any activity that disrupts or interferes with the Platform's services.</p>
      
      <h2 className="mt-6">4. Content</h2>
      <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (“Content”). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.</p>
      <p>We reserve the right to remove any content deemed inappropriate, offensive, or in violation of these terms or copyright laws.</p>

      <h2 className="mt-6">5. Payments, Subscriptions, and Investments</h2>
      <p>Details regarding payments for subscriptions, donations, investments, and merchandise will be outlined in specific sections of the platform. All transactions are subject to platform fees as detailed. Investment in manga series carries financial risk, and users should invest responsibly.</p>

      <h2 className="mt-6">6. Limitation of Liability</h2>
      <p>In no event shall Manga Walker, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Manga Walker, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.</p>

      <h2 className="mt-6">7. Governing Law & Jurisdiction</h2>
      <p>These Terms will be governed by and interpreted in accordance with the laws of [Your Jurisdiction], and you submit to the non-exclusive jurisdiction of the state and federal courts located in [Your Jurisdiction] for the resolution of any disputes.</p>

      <h2 className="mt-6">8. Changes to Terms</h2>
      <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

      <h2 className="mt-6">Contact Us</h2>
      <p>If you have any questions about these Terms, please contact us at [Your Contact Email/Support Page Link].</p>
      
      <p className="mt-10 text-sm text-muted-foreground">This is a placeholder Terms of Service document. Please replace this with your own comprehensive terms drafted or reviewed by a legal professional.</p>
    </div>
  );
}
