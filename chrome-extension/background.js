// Accepta Background Service Worker (MV3)
// Receives vault syncs from the bridge, persists them, and automatically
// downloads the user's Cloud Vault documents so they're ready to inject
// into university portals — no manual re-upload needed.

const DOC_TYPE_TO_KEY = {
    RESUME: 'cvFile',
    PASSPORT: 'passportFile',
    TRANSCRIPT: 'transcriptFile',
};

async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function pullVaultDocuments(documents) {
    const results = {};
    for (const [type, storageKey] of Object.entries(DOC_TYPE_TO_KEY)) {
        const doc = (documents || []).find((d) => d && d.type === type && d.fileUrl);
        if (!doc) continue;
        try {
            const res = await fetch(doc.fileUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const dataUrl = await blobToDataUrl(blob);
            await chrome.storage.local.set({
                [storageKey]: { name: doc.name || `${type.toLowerCase()}.pdf`, data: dataUrl, source: 'cloud' },
            });
            results[type] = 'ok';
            console.log(`✅ Background: pulled ${type} (${doc.name}) from Cloud Vault`);
        } catch (err) {
            results[type] = String(err);
            console.warn(`⚠️ Background: could not pull ${type} —`, err);
        }
    }
    return results;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SYNC_VAULT') {
        const payload = request.payload || {};
        console.log('📬 Background: vault sync received');

        chrome.storage.local.set({ vaultData: payload, lastSyncAt: Date.now() }, async () => {
            try {
                const docResults = await pullVaultDocuments(payload.documents);
                sendResponse({ success: true, documents: docResults });
            } catch (err) {
                // Profile data is saved even if document pull fails
                sendResponse({ success: true, docError: String(err) });
            }
        });

        return true; // keep the message channel open for the async response
    }
});
