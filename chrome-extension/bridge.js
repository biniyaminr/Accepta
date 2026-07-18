// Accepta Sync Bridge — runs ONLY on accepta.site (see manifest content_scripts).
// The web app posts the signed-in user's vault via window.postMessage; we relay
// it to the extension's service worker, which persists it and auto-pulls the
// user's Cloud Vault documents.
window.addEventListener('message', (event) => {
    // Only accept messages from our own window (the Accepta web app itself)
    if (event.source !== window) return;

    if (event.data && event.data.type === 'ACCEPTA_SYNC_VAULT') {
        console.log('🚀 Accepta Bridge: Intercepted vault sync');

        chrome.runtime.sendMessage(
            { type: 'SYNC_VAULT', payload: event.data.payload },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Accepta Bridge: sync failed —', chrome.runtime.lastError.message);
                } else {
                    console.log('✅ Accepta Bridge: vault sync complete', response);
                }
            }
        );
    }
});
