"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function PaypalPayPage() {
  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>PayPal 支付</h2>
      <PayPalScriptProvider options={{ "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID! }}>
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={async (_data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: "10.00", // 这里可以改成你想要的金额
                  },
                },
              ],
            });
          }}
          onApprove={async (_data, actions) => {
            const details = await actions.order!.capture();
            alert("支付成功，感谢您，" + (details.payer?.name?.given_name || "用户") + "!");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}