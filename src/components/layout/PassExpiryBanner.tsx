"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlan } from "@/hooks/usePlan";
import { Link } from "@/i18n/routing";

// In-app reminder shown 7 days and 1 day before a pass expires.
export function PassExpiryBanner() {
    const t = useTranslations("Plan");
    const { plan } = usePlan();

    if (!plan || plan.planType === "FREE" || plan.daysLeft <= 0 || plan.daysLeft > 7) {
        return null;
    }

    return (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-amber-200">
                    {plan.daysLeft === 1
                        ? t("expiresBanner", { days: 1 })
                        : t("expiresBannerPlural", { days: plan.daysLeft })}
                </span>
                <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-100 transition-colors no-underline"
                >
                    {t("extendCta")}
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    );
}
