"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
}
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load the payment window. Check your connection."));
    document.body.appendChild(script);
  });
}

export function CheckoutButton({
  productId,
  label,
  user,
  variant = "default",
}: {
  productId: string;
  label: string;
  user: { name: string; email: string };
  variant?: "default" | "tonal";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [simOrder, setSimOrder] = useState<{ orderId: string; productName: string; amountPaise: number } | null>(null);

  async function purchased() {
    toast.success("Payment successful — your plan is updated.");
    router.refresh();
  }

  async function buy() {
    setPending(true);
    try {
      const res = await fetch("/api/billing/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const order = await res.json().catch(() => null);
      if (!res.ok) throw new Error(order?.error ?? "Couldn't start checkout.");
      if (order.mode === "simulated") {
        setSimOrder(order);
        setPending(false);
        return;
      }
      await loadCheckout();
      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amountPaise,
        currency: "INR",
        order_id: order.orderId,
        name: "Intervexa",
        description: order.productName,
        prefill: user,
        theme: { color: "#5b4bd6" },
        handler: async (response) => {
          const verify = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verify.ok) await purchased();
          else toast.error("We couldn't verify the payment. If you were charged, it will be applied automatically shortly.");
          setPending(false);
        },
        modal: { ondismiss: () => setPending(false) },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout.");
      setPending(false);
    }
  }

  return (
    <>
      <Button variant={variant} size="lg" className="w-full" onClick={() => void buy()} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {label}
      </Button>
      <Dialog
        open={simOrder !== null}
        onOpenChange={(o) => !o && setSimOrder(null)}
        title="Simulated payment"
        description={
          <>
            Payments are in <strong>simulate</strong> mode (development). Completing will apply{" "}
            <strong>{simOrder?.productName}</strong> (₹{(simOrder?.amountPaise ?? 0) / 100}) without charging anything.
          </>
        }
        actions={
          <>
            <Button variant="text" onClick={() => setSimOrder(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const id = simOrder?.orderId;
                setSimOrder(null);
                const res = await fetch("/api/billing/simulate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: id }),
                });
                if (res.ok) await purchased();
                else toast.error("Simulated payment failed.");
              }}
            >
              Complete payment
            </Button>
          </>
        }
      />
    </>
  );
}
