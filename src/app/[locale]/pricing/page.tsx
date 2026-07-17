"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PASS_PLANS, type PassPlanId } from "@/lib/plans";
import { PayByTransferDialog } from "@/components/pricing/PayByTransferDialog";

export default function PricingPage() {
    const t = useTranslations("Pricing");
    const [loadingPlan, setLoadingPlan] = useState<PassPlanId | null>(null);
    const [transferPlan, setTransferPlan] = useState<PassPlanId | null>(null);

    const handlePurchase = async (plan: PassPlanId) => {
        setLoadingPlan(plan);
        try {
            const response = await fetch("/api/chapa/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Failed to initialize payment");
            }
        } catch (error) {
            console.error("Payment Error:", error);
            toast.error(t("paymentErrorTitle"), {
                description: t("paymentErrorDesc"),
            });
            setLoadingPlan(null);
        }
    };

    const freeFeatures = [t("freeF1"), t("freeF2"), t("freeF3"), t("freeF4")];
    const sprintFeatures = [t("sprintF1"), t("sprintF2"), t("sprintF3"), t("sprintF4")];
    const seasonFeatures = [t("seasonF1"), t("seasonF2")];

    const comparisons = [
        { label: t("compareAgent"), value: t("compareAgentValue"), highlight: false },
        { label: t("compareIelts"), value: t("compareIeltsValue"), highlight: false },
        { label: t("compareSeason"), value: t("compareSeasonValue"), highlight: true },
    ];

    const faqs = [
        { q: t("faq1Q"), a: t("faq1A") },
        { q: t("faq2Q"), a: t("faq2A") },
        { q: t("faq3Q"), a: t("faq3A") },
        { q: t("faq4Q"), a: t("faq4A") },
    ];

    const payButton = (plan: PassPlanId, label: string, className: string) => (
        <div className="w-full flex flex-col gap-2">
            <SignedIn>
                <Button
                    className={className}
                    onClick={() => handlePurchase(plan)}
                    disabled={loadingPlan !== null}
                >
                    {loadingPlan === plan ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t("initializing")}
                        </>
                    ) : (
                        label
                    )}
                </Button>
                <button
                    type="button"
                    onClick={() => setTransferPlan(plan)}
                    className="text-xs text-neutral-400 hover:text-neutral-200 underline underline-offset-4 transition-colors"
                >
                    {t("payByTransfer")}
                </button>
            </SignedIn>
            <SignedOut>
                <SignUpButton mode="modal">
                    <Button className={className}>{label}</Button>
                </SignUpButton>
            </SignedOut>
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-16 py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col items-center text-center gap-4 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-500">
                    {t("headline")}
                </h1>
                <p className="text-xl text-neutral-400">
                    {t("subheadline")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl items-stretch">
                {/* Free — Starter */}
                <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-sm relative overflow-hidden flex flex-col group transition-all hover:border-neutral-700">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-neutral-200">{t("freeName")}</CardTitle>
                        <CardDescription className="text-neutral-400 text-lg">{t("freeTagline")}</CardDescription>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-neutral-100">0</span>
                            <span className="text-neutral-500 font-medium">{t("etb")}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-4">
                            {freeFeatures.map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <div className="mt-1 bg-neutral-800 rounded-full p-0.5">
                                        <Check className="h-3.5 w-3.5 text-neutral-400" />
                                    </div>
                                    <span className="text-neutral-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <SignedIn>
                            <Button variant="outline" className="w-full border-neutral-700 hover:bg-neutral-800 text-neutral-200" disabled>
                                {t("currentPlan")}
                            </Button>
                        </SignedIn>
                        <SignedOut>
                            <SignUpButton mode="modal">
                                <Button variant="outline" className="w-full border-neutral-700 hover:bg-neutral-800 text-neutral-200">
                                    {t("startFree")}
                                </Button>
                            </SignUpButton>
                        </SignedOut>
                    </CardFooter>
                </Card>

                {/* Sprint Pass — 30 days */}
                <Card className="bg-neutral-900/60 border-neutral-700 backdrop-blur-sm relative overflow-hidden flex flex-col group transition-all hover:border-blue-500/40">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
                            {t("sprintName")}
                            <Zap className="h-5 w-5 text-blue-400" />
                        </CardTitle>
                        <CardDescription className="text-neutral-300 text-lg font-medium">{t("sprintTagline")}</CardDescription>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">500</span>
                            <span className="text-neutral-300 font-medium">{t("sprintPriceUnit")}</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 font-medium">{t("oneTimePayment")}</p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="space-y-4">
                            {sprintFeatures.map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <div className="mt-1 bg-blue-500/20 rounded-full p-0.5">
                                        <Check className="h-3.5 w-3.5 text-blue-400" />
                                    </div>
                                    <span className="text-neutral-200">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {payButton(
                            "SPRINT",
                            t("sprintCta"),
                            "w-full bg-neutral-100 hover:bg-white text-neutral-900 font-bold h-12"
                        )}
                    </CardFooter>
                </Card>

                {/* Season Pass — 90 days */}
                <Card className="bg-neutral-900 border-violet-500/40 backdrop-blur-md relative overflow-hidden flex flex-col group transition-all hover:border-violet-500/60 shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)]">
                    <div className="absolute top-0 right-0 p-2">
                        <div className="bg-violet-600 text-[10px] font-bold uppercase tracking-widest text-white px-2 py-1 rounded-bl-lg rounded-tr-lg">
                            {t("mostPopular")}
                        </div>
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
                            {t("seasonName")}
                            <Sparkles className="h-5 w-5 text-violet-400" />
                        </CardTitle>
                        <CardDescription className="text-neutral-300 text-lg font-medium">{t("seasonTagline")}</CardDescription>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">1,500</span>
                            <span className="text-neutral-300 font-medium">{t("seasonPriceUnit")}</span>
                        </div>
                        <p className="text-xs text-violet-400/80 mt-2 font-medium">{t("seasonValueLine")}</p>
                        <p className="text-xs text-neutral-500 mt-1 font-medium">{t("oneTimePayment")}</p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm font-semibold text-neutral-400 mb-4">{t("seasonEverything")}</p>
                        <ul className="space-y-4">
                            {seasonFeatures.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 group/item">
                                    <div className="mt-1 bg-violet-500/20 rounded-full p-0.5">
                                        <Zap className="h-3.5 w-3.5 text-violet-400 fill-violet-400" />
                                    </div>
                                    <span className="text-neutral-200 group-hover/item:text-white transition-colors">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        {payButton(
                            "SEASON",
                            t("seasonCta"),
                            "w-full bg-violet-600 hover:bg-violet-500 text-white font-bold h-12 shadow-lg shadow-violet-900/20"
                        )}
                        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                            <ShieldCheck className="h-4 w-4" />
                            {t("securePayments")}
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Compare the real cost */}
            <div className="w-full max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">{t("compareTitle")}</h2>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 divide-y divide-neutral-800 overflow-hidden">
                    {comparisons.map((row) => (
                        <div
                            key={row.label}
                            className={`flex items-center justify-between px-6 py-4 ${row.highlight ? "bg-violet-500/10" : ""}`}
                        >
                            <span className={row.highlight ? "text-violet-300 font-semibold" : "text-neutral-300"}>
                                {row.label}
                            </span>
                            <span className={`font-bold ${row.highlight ? "text-violet-300" : "text-neutral-100"}`}>
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>
                <p className="text-center text-neutral-400 mt-6 text-lg">{t("compareLine")}</p>
            </div>

            {/* FAQ */}
            <div className="w-full max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">{t("faqTitle")}</h2>
                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <div key={faq.q} className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 transition-all">
                            <h3 className="text-white font-semibold text-lg mb-3 flex items-start gap-3">
                                <span className="text-violet-400 shrink-0 mt-0.5">Q.</span>
                                {faq.q}
                            </h3>
                            <p className="text-neutral-400 leading-relaxed pl-6">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            <PayByTransferDialog
                plan={transferPlan}
                planLabel={transferPlan ? PASS_PLANS[transferPlan].name : ""}
                amount={transferPlan ? PASS_PLANS[transferPlan].amount : 0}
                open={transferPlan !== null}
                onOpenChange={(open) => !open && setTransferPlan(null)}
            />
        </div>
    );
}
