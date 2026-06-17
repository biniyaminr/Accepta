'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function ExtensionSync() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (!isLoaded || !user) return;

        const syncData = async () => {
            try {
                // Fetch profile data directly from the DB — source of truth
                const res = await fetch('/api/profile');
                if (!res.ok) return;
                const profile = await res.json();

                const payload = {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.primaryEmailAddress?.emailAddress,
                    fullName: profile.fullName || user.fullName,
                    dob: profile.dob,
                    nationality: profile.citizenship,
                    phone: profile.phone,

                    educations: profile.educations || [],
                    experiences: profile.extracurriculars || [],
                };

                window.postMessage({
                    type: 'ACCEPTA_SYNC_VAULT',
                    payload
                }, '*');

                console.log('🚀 Accepta: Syncing profile data...', payload);
            } catch (err) {
                console.error('ExtensionSync: failed to fetch profile', err);
            }
        };

        syncData();
    }, [isLoaded, user]);

    return null; // Invisible component
}
