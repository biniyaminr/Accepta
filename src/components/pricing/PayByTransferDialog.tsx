"use client";

import { useState } from "react";
import { Loader2, Landmark, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { PassPlanId } from "@/lib/plans";

// Merchant accounts a user pays to, surfaced from public env so they can change
// without a code edit. Format each as "Label: value" — one per line.
const PAY_ACCOUNTS = [
    process.env.NEXT_PUBLIC_VERIFY_PAY_CBE,
    process.env.NEXT_PUBLIC_VERIFY_PAY_TELEBIRR,
].filter((v): v is string => Boolean(v && v.trim()));

type Props = {
    plan: PassPlanId | null;
    planLabel: string;
    amount: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function PayByTransferDialog({ plan, planLabel, amount, open, onOpenChange }: Props) {
    const t = useTranslations("Pricing");
    const [reference, setReference] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const copy = (value: string) => {
        navigator.clipboard?.writeText(value).then(() => {
            setCopied(value);
            setTimeout(() => setCopied(null), 1500);
        });
    };

    const handleSubmit = async () => {
        if (!plan || !reference.trim()) return;
        setSubmitting(true);
        try {
            const response = await fetch("/api/verify-transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan,
                    reference: reference.trim(),
                }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(t("transferSuccessTitle"), { description: t("transferSuccessDesc") });
                onOpenChange(false);
                window.location.href = "/dashboard?payment=success";
            } else {
                toast.error(t("transferFailedTitle"), {
                    description: data.error || t("transferFailedDesc"),
                });
            }
        } catch (error) {
            console.error("Transfer verification error:", error);
            toast.error(t("transferFailedTitle"), { description: t("transferFailedDesc") });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100 sm:max-w-md">
                <DialogHeader className="items-center text-center">
                    <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15">
                        <Landmark className="h-6 w-6 text-violet-400" />
                    </div>
                    <DialogTitle className="text-center text-neutral-100">
                        {t("transferTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-center text-neutral-400">
                        {t("transferSubtitle", { plan: planLabel, amount })}
                    </DialogDescription>
                </DialogHeader>

                {/* Prominent amount to pay — anchors the intent to pay. */}
                <div className="flex flex-col items-center gap-0.5 py-1">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                        {amount.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
                        {t("etb")}
                    </span>
                </div>

                <div className="space-y-5 py-1">
                    {PAY_ACCOUNTS.length > 0 && (
                        <div className="space-y-2 text-center">
                            <p className="text-sm font-medium text-neutral-300">{t("transferStep1")}</p>
                            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 divide-y divide-neutral-800">
                                {PAY_ACCOUNTS.map((account) => {
                                    const value = account.includes(":")
                                        ? account.split(":").slice(1).join(":").trim()
                                        : account;
                                    return (
                                        <button
                                            key={account}
                                            type="button"
                                            onClick={() => copy(value)}
                                            className="group flex w-full items-center justify-center gap-2 px-4 py-3 text-neutral-100 transition-colors hover:bg-neutral-800/40"
                                            aria-label="Copy account"
                                        >
                                            <span className="text-sm font-semibold tracking-wide">{account}</span>
                                            {copied === value ? (
                                                <Check className="h-4 w-4 shrink-0 text-green-400" />
                                            ) : (
                                                <Copy className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-neutral-100" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-neutral-500">{t("transferTelebirrHint")}</p>
                        </div>
                    )}

                    <div className="space-y-2 text-center">
                        <Label htmlFor="reference" className="block text-neutral-300">
                            {t("transferStep2")}
                        </Label>
                        <Input
                            id="reference"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder={t("transferRefPlaceholder")}
                            className="bg-neutral-900 border-neutral-800 text-center text-neutral-100"
                            autoComplete="off"
                        />
                        <p className="text-xs text-neutral-500">{t("transferRefHint")}</p>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={submitting || !reference.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold h-11"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("transferVerifying")}
                        </>
                    ) : (
                        t("transferVerifyCta")
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
