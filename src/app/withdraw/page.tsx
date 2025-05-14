"use client";
import { useState } from "react";

export default function WithdrawPage() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Processing...");
    const res = await fetch("/api/paypal-payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount: Number(amount) }),
    });
    const data = await res.json();
    if (data.success) setMsg("Withdrawal request submitted!");
    else setMsg("Withdrawal failed: " + (data.error || "Unknown error"));
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>PayPal Withdrawal</h2>
      <input
        type="email"
        placeholder="PayPal Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 8, padding: 8 }}
      />
      <input
        type="number"
        placeholder="Withdrawal Amount (USD)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
        min={1}
        style={{ width: "100%", marginBottom: 8, padding: 8 }}
      />
      <button type="submit" style={{ width: "100%", padding: 8 }}>Request Withdrawal</button>
      <div style={{ marginTop: 12 }}>{msg}</div>
    </form>
  );
}