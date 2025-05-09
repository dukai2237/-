
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout, viewingHistory } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="mb-4">You need to be logged in to view this page.</p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }
  
  const historyArray = Array.from(viewingHistory.entries())
    .sort(([, a], [, b]) => b.date.getTime() - a.date.getTime()) // Sort by most recent
    .slice(0, 5); // Show top 5 recent

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
            <AvatarFallback className="text-3xl">{user.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{user.name}</CardTitle>
          <CardDescription className="text-lg">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">This is your profile page. More features coming soon!</p>
          <Button onClick={logout} variant="outline" className="mt-6">
            Logout
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Recent Viewing History</CardTitle>
          <CardDescription>Your last viewed manga chapters.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyArray.length > 0 ? (
            <ul className="space-y-2">
              {historyArray.map(([mangaId, history]) => (
                <li key={mangaId} className="p-3 border rounded-md">
                  <Link href={`/manga/${mangaId}/${history.chapterId}#page=${history.pageIndex + 1}`} className="hover:text-primary">
                    <p className="font-semibold">Manga ID: {mangaId}</p> {/* Replace with Manga Title if available */}
                    <p className="text-sm text-muted-foreground">
                      Chapter ID: {history.chapterId}, Page: {history.pageIndex + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">Viewed on: {history.date.toLocaleDateString()}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No viewing history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
