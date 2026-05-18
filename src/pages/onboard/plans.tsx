import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { BookOpenCheck, Check, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlanPricing {
  id: string;
  billingCycle: string;
  amount: number;
  currency: string;
  isDefault: boolean;
}

interface PlanFeature {
  name: string;
  isAvailable: boolean;
  availabilityLevel: string;
  quantitativeValue: number | null;
  displayText: string;
}

interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  userLimit: number;
  pricings: PlanPricing[];
  features: PlanFeature[];
}

type BillingCycle = "Monthly" | "Quarterly" | "Annually";

const CYCLE_LABELS: Record<BillingCycle, string> = {
  Monthly: "Monthly",
  Quarterly: "Quarterly",
  Annually: "Annually",
};

const CYCLE_SAVINGS: Record<BillingCycle, string | null> = {
  Monthly: null,
  Quarterly: "Save 10%",
  Annually: "Save 20%",
};

interface BillingForm {
  name: string;
  email: string;
  phoneNumber: string;
  reference: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  billingEmail: string;
  billingAddressStreet: string;
  billingAddressCity: string;
  billingAddressState: string;
  billingAddressPostalCode: string;
  billingAddressCountry: string;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function Logo() {
  return (
    <div className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[var(--cl-primary)] flex items-center justify-center text-white shrink-0">
          <BookOpenCheck size={16} strokeWidth={2.2} />
        </div>
        <div className="text-[17px] tracking-tight leading-none select-none">
          <span className="font-semibold" style={{ color: "#184F97" }}>Core</span>
          <span className="font-semibold" style={{ color: "#004A7E" }}>Ledger</span>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
  readOnly,
}: {
  label: string;
  name: keyof BillingForm;
  value: string;
  onChange: (name: keyof BillingForm, value: string) => void;
  required?: boolean;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        readOnly={readOnly}
        className={readOnly ? "bg-gray-50 text-gray-500 cursor-default" : ""}
      />
    </div>
  );
}

export default function PlansPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<"plans" | "billing">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<BillingCycle>("Monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sameAddress, setSameAddress] = useState(true);

  const [form, setForm] = useState<BillingForm>({
    name: "",
    email: "",
    phoneNumber: "",
    reference: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    billingEmail: "",
    billingAddressStreet: "",
    billingAddressCity: "",
    billingAddressState: "",
    billingAddressPostalCode: "",
    billingAddressCountry: "",
  });

  const productCode = process.env.NEXT_PUBLIC_PRODUCT_CODE!;

  useEffect(() => {
    fetch(`/api/onboard/plans?productCode=${productCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlans(data);
          const hasMonthly = data.some((p: Plan) =>
            p.pricings.some((pr) => pr.billingCycle === "Monthly")
          );
          if (!hasMonthly) setCycle("Annually");
        } else {
          setError(data?.message ?? "Failed to load plans.");
        }
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }, [productCode]);

  const getPricing = (plan: Plan): PlanPricing | null =>
    plan.pricings.find((p) => p.billingCycle === cycle) ??
    plan.pricings.find((p) => p.isDefault) ??
    plan.pricings[0] ??
    null;

  const availableCycles = Array.from(
    new Set(plans.flatMap((p) => p.pricings.map((pr) => pr.billingCycle)))
  ) as BillingCycle[];

  function handleFieldChange(name: keyof BillingForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (sameAddress) {
        if (name === "street") next.billingAddressStreet = value;
        if (name === "city") next.billingAddressCity = value;
        if (name === "state") next.billingAddressState = value;
        if (name === "postalCode") next.billingAddressPostalCode = value;
        if (name === "country") next.billingAddressCountry = value;
        if (name === "email") next.billingEmail = value;
      }
      return next;
    });
  }

  function handleSameAddressToggle(checked: boolean) {
    setSameAddress(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        billingEmail: prev.email,
        billingAddressStreet: prev.street,
        billingAddressCity: prev.city,
        billingAddressState: prev.state,
        billingAddressPostalCode: prev.postalCode,
        billingAddressCountry: prev.country,
      }));
    }
  }

  async function handleContinueToBilling() {
    setError(null);
    // Fetch org profile to pre-fill
    const res = await fetch("/api/onboard/tenant-profile");
    const profile = res.ok ? await res.json() : {};

    setForm((prev) => ({
      ...prev,
      name: profile.name ?? prev.name,
      email: profile.email ?? prev.email,
      phoneNumber: profile.phone ?? prev.phoneNumber,
      reference: profile.reference ?? prev.reference,
      street: profile.street ?? prev.street,
      city: profile.city ?? prev.city,
      state: profile.state ?? prev.state,
      postalCode: profile.postalCode ?? prev.postalCode,
      country: profile.country ?? prev.country,
      billingEmail: profile.email ?? prev.billingEmail,
      billingAddressStreet: profile.street ?? prev.billingAddressStreet,
      billingAddressCity: profile.city ?? prev.billingAddressCity,
      billingAddressState: profile.state ?? prev.billingAddressState,
      billingAddressPostalCode: profile.postalCode ?? prev.billingAddressPostalCode,
      billingAddressCountry: profile.country ?? prev.billingAddressCountry,
    }));

    setStep("billing");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const pricing = getPricing(selectedPlan!);

    try {
      const subRes = await fetch("/api/onboard/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan!.id,
          billingCycle: pricing!.billingCycle,
          productCode,
          organization: {
            name: form.name,
            reference: form.reference,
            email: form.email,
            phoneNumber: form.phoneNumber,
            street: form.street,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
            billingEmail: form.billingEmail,
            billingAddressStreet: form.billingAddressStreet,
            billingAddressCity: form.billingAddressCity,
            billingAddressState: form.billingAddressState,
            billingAddressPostalCode: form.billingAddressPostalCode,
            billingAddressCountry: form.billingAddressCountry,
          },
        }),
      });

      const subData = await subRes.json();

      if (!subRes.ok) {
        setError(subData?.message ?? "Subscription creation failed.");
        return;
      }

      const invoiceId: string = subData.invoice?.id;
      if (!invoiceId) {
        setError("Invoice reference missing from response.");
        return;
      }

      await new Promise((r) => setTimeout(r, 1500));

      const callbackUrl = `${window.location.origin}/onboard/payment-callback`;

      const payRes = await fetch("/api/onboard/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          gateway: "PAYSTACK",
          email: form.email,
          callbackUrl,
        }),
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        if (payRes.status === 404) {
          await new Promise((r) => setTimeout(r, 2000));
          const retryRes = await fetch("/api/onboard/initialize-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              invoiceId,
              gateway: "PAYSTACK",
              email: form.email,
              callbackUrl,
            }),
          });
          const retryData = await retryRes.json();
          if (!retryRes.ok) {
            setError(retryData?.message ?? "Could not initialize payment.");
            return;
          }
          window.location.href = retryData.authorizationUrl;
          return;
        }
        setError(payData?.message ?? "Could not initialize payment.");
        return;
      }

      window.location.href = payData.authorizationUrl;
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--cl-primary)]" />
      </div>
    );
  }

  if (step === "billing") {
    return (
      <div className="min-h-screen bg-background">
        <Logo />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <button
            onClick={() => { setStep("plans"); setError(null); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to plans
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing details</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review and complete your organisation and billing information.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Organisation */}
            <section>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Organisation</h2>
              <div className="rounded-lg border bg-gray-50 px-4 py-3.5 space-y-0.5">
                <p className="font-semibold text-gray-900">{form.name}</p>
                <p className="text-sm text-gray-500">{form.email} &middot; {form.phoneNumber}</p>
                <p className="text-xs text-gray-400 pt-0.5">{form.reference}</p>
              </div>
            </section>

            {/* Office address */}
            <section>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Office address</h2>
              <div className="rounded-lg border bg-gray-50 px-4 py-3.5 space-y-0.5">
                <p className="text-sm text-gray-900">{form.street}</p>
                <p className="text-sm text-gray-500">{form.city}{form.state ? `, ${form.state}` : ""}{form.postalCode ? ` ${form.postalCode}` : ""}</p>
                <p className="text-sm text-gray-500">{form.country}</p>
              </div>
            </section>

            {/* Billing address */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Billing address</h2>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => handleSameAddressToggle(e.target.checked)}
                    className="rounded"
                  />
                  Same as office address
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormField label="Billing email" name="billingEmail" value={form.billingEmail} onChange={handleFieldChange} required type="email" readOnly={sameAddress} />
                </div>
                <div className="col-span-2">
                  <FormField label="Street" name="billingAddressStreet" value={form.billingAddressStreet} onChange={handleFieldChange} required readOnly={sameAddress} />
                </div>
                <FormField label="City" name="billingAddressCity" value={form.billingAddressCity} onChange={handleFieldChange} required readOnly={sameAddress} />
                <FormField label="State" name="billingAddressState" value={form.billingAddressState} onChange={handleFieldChange} required readOnly={sameAddress} />
                <FormField label="Postal code" name="billingAddressPostalCode" value={form.billingAddressPostalCode} onChange={handleFieldChange} required readOnly={sameAddress} />
                <FormField label="Country" name="billingAddressCountry" value={form.billingAddressCountry} onChange={handleFieldChange} required readOnly={sameAddress} />
              </div>
            </section>
          </div>

          <div className="mt-10 flex justify-end">
            <Button
              size="lg"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-10 h-12 text-base bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)]/90"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Setting up payment…
                </>
              ) : (
                "Proceed to payment"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Logo />
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
            Choose your plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Get started with CoreLedger. Change or cancel anytime.
          </p>

          {availableCycles.length > 1 && (
            <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full border border-gray-200 bg-gray-100">
              {availableCycles.map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    cycle === c
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {CYCLE_LABELS[c]}
                  {CYCLE_SAVINGS[c] && (
                    <span className="ml-1.5 text-xs text-emerald-600 font-semibold">
                      {CYCLE_SAVINGS[c]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-8 max-w-md mx-auto text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className={`grid gap-6 ${plans.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"}`}>
          {plans.map((plan, i) => {
            const pricing = getPricing(plan);
            const isSelected = selectedPlan?.id === plan.id;
            const isPopular = i === 1 && plans.length >= 3;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative rounded-2xl border-2 p-7 cursor-pointer transition-all ${
                  isSelected
                    ? "border-[var(--cl-primary)] shadow-lg bg-background"
                    : "border-border hover:border-[var(--cl-primary)]/40 bg-card"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[var(--cl-primary)] text-white text-xs px-3 py-0.5">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {pricing ? (
                    <>
                      <span className="text-4xl font-bold text-foreground">
                        {formatAmount(pricing.amount, pricing.currency)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">
                        /{CYCLE_LABELS[pricing.billingCycle as BillingCycle]?.toLowerCase() ?? "period"}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">No pricing for selected cycle</span>
                  )}
                </div>

                <ul className="space-y-2.5">
                  {plan.features
                    .filter((f) => f.isAvailable)
                    .map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm">
                        <Check size={15} className="shrink-0 mt-0.5 text-emerald-600" strokeWidth={2.5} />
                        <span className="text-foreground">
                          {f.displayText || (f.quantitativeValue != null ? `${f.quantitativeValue} ${f.name}` : f.name)}
                        </span>
                      </li>
                    ))}
                  {plan.userLimit > 0 && (
                    <li className="flex items-start gap-2.5 text-sm">
                      <Check size={15} className="shrink-0 mt-0.5 text-emerald-600" strokeWidth={2.5} />
                      <span className="text-foreground">Up to {plan.userLimit} users</span>
                    </li>
                  )}
                </ul>

                {isSelected && (
                  <div className="absolute top-5 right-5 w-5 h-5 rounded-full bg-[var(--cl-primary)] flex items-center justify-center">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button
            size="lg"
            disabled={!selectedPlan}
            onClick={handleContinueToBilling}
            className="px-10 h-12 text-base bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)]/90"
          >
            {selectedPlan ? `Continue with ${selectedPlan.name}` : "Select a plan to continue"}
          </Button>
          <p className="text-muted-foreground text-xs mt-3">
            You won't be charged until payment is confirmed. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
