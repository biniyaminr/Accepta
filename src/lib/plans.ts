// One-time prepaid passes. No subscriptions, no auto-renewal.
export const PASS_PLANS = {
    SPRINT: {
        id: "SPRINT",
        // ⚠️ TEMPORARY TEST PRICE — revert to 500 before going live.
        amount: 1, // ETB (was 500) — lowered for live transfer-verification testing
        name: "Sprint Pass",
        days: 30,
    },
    SEASON: {
        id: "SEASON",
        name: "Season Pass",
        amount: 1500, // ETB
        days: 90,
    },
} as const;

export type PassPlanId = keyof typeof PASS_PLANS;

export function isPassPlanId(value: string): value is PassPlanId {
    return value in PASS_PLANS;
}

/**
 * Buying while a pass is active EXTENDS the expiry date (adds days on top
 * of the remaining time), never overwrites it.
 */
export function extendExpiry(currentExpiresAt: Date | null, days: number, now = new Date()): Date {
    const base = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
    return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export function daysLeft(expiresAt: Date | null, now = new Date()): number {
    if (!expiresAt) return 0;
    const ms = expiresAt.getTime() - now.getTime();
    return ms > 0 ? Math.ceil(ms / (24 * 60 * 60 * 1000)) : 0;
}
