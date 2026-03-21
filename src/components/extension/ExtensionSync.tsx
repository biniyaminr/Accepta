'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAppStore } from '@/store/useAppStore';

export function ExtensionSync() {
    const { user, isLoaded } = useUser();
    
    // We want to sync the profile data and any relevant vault URLs
    // In this app, the vault URLs are often in the onboarding state or profile
    const {
        step1Draft,
        step2Draft,
        step3Draft,
    } = useAppStore();
    
    useEffect(() => {
        if (!isLoaded || !user) return;

        const syncData = async () => {
            // Fetch Vault URLs for the extension
            let vaultUrls = { passportUrl: null, cvUrl: null };
            try {
                const res = await fetch("/api/onboarding/step?step=4");
                if (res.ok) {
                    const data = await res.json();
                    const docs = data.documents || [];
                    vaultUrls.passportUrl = docs.find((d: any) => d.type === 'PASSPORT')?.url;
                    vaultUrls.cvUrl = docs.find((d: any) => d.type === 'RESUME')?.url;
                }
            } catch (err) {
                console.error("Sync: Failed to fetch vault URLs", err);
            }

            // Prepare the payload merging Clerk info with drafts and URLs
            const payload = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.primaryEmailAddress?.emailAddress,
                fullName: user.fullName,
                dob: step1Draft?.dob,
                nationality: step1Draft?.citizenship,
                gender: step1Draft?.gender,
                phone: step1Draft?.phone,
                ...vaultUrls,
                educations: step2Draft ? [step2Draft] : [],
                experiences: step3Draft?.experiences || []
            };

            window.postMessage({
                type: 'ACCEPTA_SYNC_VAULT',
                payload
            }, '*');
            
            console.log('🚀 Accepta: Syncing enhanced vault data...', payload);
        };

        syncData();
    }, [isLoaded, user, step1Draft, step2Draft, step3Draft]);

    return null; // Invisible component
}
