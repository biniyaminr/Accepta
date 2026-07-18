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
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-neutral-100">
                        <Landmark className="h-5 w-5 text-violet-400" />
                        {t("transferTitle")}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        {t("transferSubtitle", { plan: planLabel, amount })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {PAY_ACCOUNTS.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-neutral-300">{t("transferStep1")}</p>
                            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 divide-y divide-neutral-800">
                                {PAY_ACCOUNTS.map((account) => {
                                    const value = account.includes(":")
                                        ? account.split(":").slice(1).join(":").trim()
                                        : account;
                                    return (
                                        <div key={account} className="flex items-center justify-between gap-3 px-4 py-3">
                                            <span className="text-sm text-neutral-200">{account}</span>
                                            <button
                                                type="button"
                                                onClick={() => copy(value)}
                                                className="shrink-0 text-neutral-400 hover:text-neutral-100 transition-colors"
                                                aria-label="Copy account"
                                            >
                                                {copied === value ? (
                                                    <Check className="h-4 w-4 text-green-400" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="reference" className="text-neutral-300">
                            {t("transferStep2")}
                        </Label>
                        <Input
                            id="reference"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder={t("transferRefPlaceholder")}
                            className="bg-neutral-900 border-neutral-800 text-neutral-100"
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
