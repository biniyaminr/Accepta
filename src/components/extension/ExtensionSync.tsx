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
        vaultDocuments
    } = useAppStore();
    
    useEffect(() => {
        if (!isLoaded || !user) return;

        const syncData = async () => {
            // Prepare the payload merging Clerk info with drafts and vault documents
            const payload = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.primaryEmailAddress?.emailAddress,
                fullName: user.fullName,
                dob: step1Draft?.dob,
                nationality: step1Draft?.citizenship,
                gender: step1Draft?.gender,
                phone: step1Draft?.phone,
                
                // Use nested files structure as requested
                files: {
                    passportUrl: vaultDocuments.find(d => d.type === 'PASSPORT')?.url || null,
                    cvUrl: vaultDocuments.find(d => d.type === 'RESUME')?.url || null,
                    transcriptUrl: vaultDocuments.find(d => d.type === 'TRANSCRIPT')?.url || null
                },
                
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
    }, [isLoaded, user, step1Draft, step2Draft, step3Draft, vaultDocuments]);

    return null; // Invisible component
}
