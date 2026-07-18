'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function ExtensionSync() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (!isLoaded || !user) return;

        const syncData = async () => {
            try {
                // Fetch profile + documents directly from the DB — source of truth
                const [profileRes, docsRes] = await Promise.all([
                    fetch('/api/profile'),
                    fetch('/api/documents'),
                ]);
                if (!profileRes.ok) return;
                const profile = await profileRes.json();
                const docs = docsRes.ok ? await docsRes.json() : [];

                const payload = {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.primaryEmailAddress?.emailAddress,
                    fullName: profile.fullName || user.fullName,
                    dob: profile.dob,
                    nationality: profile.citizenship,
                    phone: profile.phone,
                    address: profile.address,

                    educations: profile.educations || [],
                    experiences: profile.extracurriculars || [],

                    // Cloud Vault documents — the extension's background worker
                    // downloads these so they're ready to inject into portals.
                    documents: (Array.isArray(docs) ? docs : [])
                        .filter((d: any) => d?.fileUrl && d?.type)
                        .map((d: any) => ({ type: d.type, name: d.name, fileUrl: d.fileUrl })),
                };

                window.postMessage({
                    type: 'ACCEPTA_SYNC_VAULT',
                    payload
                }, window.location.origin);

                console.log('🚀 Accepta: Syncing profile + vault documents to extension...');
            } catch (err) {
                console.error('ExtensionSync: failed to fetch profile', err);
            }
        };

        syncData();
    }, [isLoaded, user]);

    return null; // Invisible component
}
