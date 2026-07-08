"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export interface PlanStatus {
    planType: "FREE" | "SPRINT" | "SEASON";
    expiresAt: string | null;
    daysLeft: number;
}

const FREE_PLAN: PlanStatus = { planType: "FREE", expiresAt: null, daysLeft: 0 };

export function usePlan() {
    const { isSignedIn, isLoaded } = useUser();
    const [plan, setPlan] = useState<PlanStatus | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            setPlan(FREE_PLAN);
            return;
        }

        let cancelled = false;
        fetch("/api/plan")
            .then((res) => (res.ok ? res.json() : FREE_PLAN))
            .then((data) => {
                if (!cancelled) setPlan(data);
            })
            .catch(() => {
                if (!cancelled) setPlan(FREE_PLAN);
            });

        return () => {
            cancelled = true;
        };
    }, [isSignedIn, isLoaded]);

    return { plan, isLoading: plan === null };
}
