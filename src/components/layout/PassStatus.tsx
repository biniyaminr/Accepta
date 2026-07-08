"use client";

import { Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlan } from "@/hooks/usePlan";
import { Link } from "@/i18n/routing";

export function PassStatus() {
    const t = useTranslations("Plan");
    const { plan } = usePlan();

    if (!plan || plan.planType === "FREE" || plan.daysLeft <= 0) return null;

    const passName = plan.planType === "SEASON" ? t("seasonPass") : t("sprintPass");

    return (
        <Link
            href="/pricing"
            className="flex items-center gap-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 mb-3 transition-all hover:bg-violet-500/20 no-underline"
        >
            <Ticket className="h-4 w-4 text-violet-400 shrink-0" />
            <span className="text-xs font-medium text-violet-300">
                {passName} · {t("daysLeft", { days: plan.daysLeft })}
            </span>
        </Link>
    );
}
