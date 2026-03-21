"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const pathname = usePathname();
    const router = useRouter();
    const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);

    useEffect(() => {
        if (!isLoaded || !user) return;

        async function checkOnboarding() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    
                    const isProfilePage = pathname.includes("/profile");
                    const isInternalPage = pathname.includes("/dashboard") || 
                                         pathname.includes("/resume") || 
                                         pathname.includes("/essays") ||
                                         pathname.includes("/discover") ||
                                         pathname.includes("/applications") ||
                                         pathname.includes("/feed");

                    if (!data.isOnboardingComplete && isInternalPage && !isProfilePage) {
                        router.push("/profile");
                    }
                }
            } catch (error) {
                console.error("Onboarding check failed:", error);
            } finally {
                setIsOnboardingChecked(true);
            }
        }

        checkOnboarding();
    }, [isLoaded, user, pathname, router]);

    // During check, we could show a loader, but children is fine for now as it's a soft redirect
    return <>{children}</>;
}
