// Server-side PostHog capture via the HTTP API — no SDK needed.
// No-ops when the key is unset.

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export async function captureServerEvent(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>
) {
    if (!POSTHOG_KEY) return;
    try {
        await fetch(`${POSTHOG_HOST}/capture/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: POSTHOG_KEY,
                event,
                distinct_id: distinctId,
                properties,
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (error) {
        // Analytics must never break the product flow.
        console.error("PostHog server capture failed:", error);
    }
}
