"use client";

import posthog from "posthog-js";

// All analytics no-op when NEXT_PUBLIC_POSTHOG_KEY is unset (e.g. local dev).
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics() {
    if (initialized || !POSTHOG_KEY || typeof window === "undefined") return;
    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Pageviews are captured manually on route change (SPA navigation).
        capture_pageview: false,
        // This app handles passports and transcripts — never record what users type.
        session_recording: {
            maskAllInputs: true,
            maskTextSelector: "[data-private]",
        },
        persistence: "localStorage+cookie",
    });
    initialized = true;
}

export function isAnalyticsReady() {
    return initialized;
}

export function capturePageview(url: string) {
    if (!initialized) return;
    posthog.capture("$pageview", { $current_url: url });
}

export function capture(event: string, properties?: Record<string, unknown>) {
    if (!initialized) return;
    posthog.capture(event, properties);
}

export function identifyUser(distinctId: string, properties?: Record<string, unknown>) {
    if (!initialized) return;
    posthog.identify(distinctId, properties);
}

// ── UTM first-touch capture ──────────────────────────────────────────────────
// The founder shares links like accepta.site?utm_source=telegram_grp1.
// We stash the first UTM set we see so it can be written to the user record
// when they finish signing up.

const UTM_STORAGE_KEY = "accepta_utm";

export interface UtmParams {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
}

export function stashUtmParams(searchParams: URLSearchParams) {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(UTM_STORAGE_KEY)) return; // first touch wins
    const utm: UtmParams = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign"] as const) {
        const value = searchParams.get(key);
        if (value) utm[key] = value;
    }
    if (Object.keys(utm).length > 0) {
        localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    }
}

export function getStashedUtmParams(): UtmParams {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(localStorage.getItem(UTM_STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
}

// ── Returned visit (24h+ since previous session, per device) ─────────────────

export function trackReturnedVisit(userId: string) {
    if (typeof window === "undefined") return;
    const key = `accepta_last_visit_${userId}`;
    const last = Number(localStorage.getItem(key));
    const now = Date.now();
    if (last && now - last >= 24 * 60 * 60 * 1000) {
        capture("returned_visit");
    }
    localStorage.setItem(key, String(now));
}

// ── One-time event guard (e.g. profile_completed) ────────────────────────────

export function captureOnce(guardKey: string, event: string, properties?: Record<string, unknown>) {
    if (typeof window === "undefined" || !initialized) return;
    const key = `accepta_once_${guardKey}`;
    if (localStorage.getItem(key)) return;
    capture(event, properties);
    localStorage.setItem(key, "1");
}
