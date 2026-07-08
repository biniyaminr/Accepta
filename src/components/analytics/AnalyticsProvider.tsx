"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
    initAnalytics,
    capturePageview,
    identifyUser,
    stashUtmParams,
    trackReturnedVisit,
} from "@/lib/analytics";

function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, isLoaded } = useUser();

    // Init once, stash UTM params from the landing URL.
    useEffect(() => {
        initAnalytics();
        stashUtmParams(new URLSearchParams(window.location.search));
    }, []);

    // Automatic pageview capture across SPA navigations.
    useEffect(() => {
        if (!pathname) return;
        const search = searchParams?.toString();
        capturePageview(window.location.origin + pathname + (search ? `?${search}` : ""));
    }, [pathname, searchParams]);

    // Identify logged-in users and detect returning sessions (24h+ gap).
    useEffect(() => {
        if (!isLoaded || !user) return;
        identifyUser(user.id, { email: user.emailAddresses[0]?.emailAddress });
        trackReturnedVisit(user.id);
    }, [isLoaded, user]);

    return null;
}

export function AnalyticsProvider() {
    // useSearchParams requires a Suspense boundary during static rendering.
    return (
        <Suspense fallback={null}>
            <AnalyticsTracker />
        </Suspense>
    );
}
