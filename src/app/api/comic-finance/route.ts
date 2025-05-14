import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth"; // Assume user authentication method
import { getComicById, hasUserInvested, getComicFinance } from "@/lib/comic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const comicId = searchParams.get("comicId");
  if (!comicId) {
    return NextResponse.json({ error: "Missing comicId parameter" }, { status: 400 });
  }
  const user = await getSessionUser(req);

  // Query comic info and author
  const comic = await getComicById(comicId);
  if (!comic) return NextResponse.json({ error: "Comic not found" }, { status: 404 });

  // Permission check: author or investor
  const isAuthor = user?.id === comic.authorId;
  const isInvestor = await hasUserInvested(user?.id, comicId);

  if (!isAuthor && !isInvestor) {
    return NextResponse.json({ error: "No permission to view financial information" }, { status: 403 });
  }

  // Return financial information
  const finance = await getComicFinance(comicId);

  if (finance?.error?.status === 403) {
    return NextResponse.json({ error: "No permission to view financial information" }, { status: 403 });
  } else if (finance) {
    return NextResponse.json({ finance });
  }
}

declare module '@paypal/react-paypal-js';
declare module '@paypal/payouts-sdk';