import { NextRequest, NextResponse } from "next/server";
import paypal from "@paypal/payouts-sdk";

const client = new paypal.core.PayPalHttpClient(
  new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID!,
    process.env.PAYPAL_CLIENT_SECRET!
  )
);

export async function POST(req: NextRequest) {
  const { email, amount } = await req.json();

  const requestBody = {
    sender_batch_header: {
      sender_batch_id: "batch_" + Date.now(),
      email_subject: "You have a payout!",
    },
    items: [
      {
        amount: {
          value: amount,
          currency: "USD",
        },
        receiver: email,
        note: "提现到账",
        sender_item_id: "item_" + Date.now(),
      },
    ],
  };

  const request = new paypal.payouts.PayoutsPostRequest();
  request.requestBody(requestBody);

  try {
    const response = await client.execute(request);
    return NextResponse.json({ success: true, data: response.result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}