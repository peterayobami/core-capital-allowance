import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { BookOpenCheck, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "activating" | "success" | "failed" | "pending";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20;

function Logo() {
  return (
    <div className="flex items-center gap-2.5 mb-8">
      <div className="w-10 h-10 rounded-lg bg-[var(--cl-primary)] flex items-center justify-center text-white shrink-0">
        <BookOpenCheck size={20} strokeWidth={2.2} />
      </div>
      <div className="text-[20px] tracking-tight leading-none select-none">
        <span className="font-semibold" style={{ color: "#184F97" }}>Core</span>
        <span className="font-semibold" style={{ color: "#004A7E" }}>Ledger</span>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("verifying");
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const pollingStopped = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;

    const reference = (router.query.reference ?? router.query.trxref) as string | undefined;

    pollingStopped.current = false;

    if (!reference) {
      setStatus("pending");
      return;
    }

    verifyThenPoll(reference);

    return () => { pollingStopped.current = true; };
  // router.asPath changes on every navigation including HMR remounts with same path
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.asPath]);

  async function verifyThenPoll(reference: string) {
    // Stage 1: Ask the payment gateway if the payment went through
    let isPaid = false;
    try {
      const res = await fetch(`/api/onboard/verify-payment?reference=${reference}`);

      if (!res.ok) {
        // Our API or the payment server had a technical problem — not a gateway failure
        setStatus("pending");
        return;
      }

      const data = await res.json();

      if (!data?.isPaid) {
        // Gateway explicitly confirmed payment did not succeed
        setFailureMessage(data?.message ?? "Your payment was not completed. Please try again.");
        setStatus("failed");
        return;
      }

      isPaid = true;
    } catch {
      // Network error — cannot conclude payment failed
      setStatus("pending");
      return;
    }

    if (!isPaid) return;

    // Stage 2: Payment confirmed — poll until subscription is active
    setStatus("activating");

    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      if (pollingStopped.current) return;

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      if (pollingStopped.current) return;

      try {
        const res = await fetch("/api/subscription/validate");
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.status === "Active") {
            setStatus("success");
            setTimeout(() => router.replace("/dashboard"), 2000);
            return;
          }
          // Subscription exists but not yet Active — keep polling
        }
        // 404 = not yet created/found — keep polling
      } catch {
        // Network hiccup — keep polling
      }
    }

    // Timed out — payment was confirmed but activation is delayed
    setStatus("pending");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Logo />

      {(status === "verifying" || status === "activating") && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--cl-primary)]" />
          <p className="text-foreground font-medium">
            {status === "verifying" ? "Verifying your payment…" : "Setting up your workspace…"}
          </p>
          <p className="text-muted-foreground text-sm max-w-xs">
            {status === "verifying"
              ? "Checking payment status with the gateway. This takes just a moment."
              : "Your payment was confirmed. We're activating your subscription now."}
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500" />
          <h2 className="text-xl font-semibold text-foreground">You're all set!</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your subscription is active. Redirecting you to your dashboard…
          </p>
        </div>
      )}

      {status === "failed" && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <XCircle className="w-14 h-14 text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">Payment unsuccessful</h2>
          <p className="text-muted-foreground text-sm">{failureMessage}</p>
          <Button variant="outline" onClick={() => router.replace("/onboard/plans")}>
            Try again
          </Button>
        </div>
      )}

      {status === "pending" && (
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <Clock className="w-14 h-14 text-amber-500" />
          <h2 className="text-xl font-semibold text-foreground">Still processing…</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your payment was received and your account is being set up. This can take a minute or two.
            You'll receive a confirmation email shortly.
          </p>
          <p className="text-muted-foreground text-sm">
            You can try accessing your dashboard, or contact us if the issue persists.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.replace("/dashboard")}>
              Go to dashboard
            </Button>
            <Button variant="ghost" asChild>
              <a href="mailto:support@coreledger.io">Contact support</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
