// Background Service Worker for Accepta
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SYNC_VAULT') {
        console.log('📬 Background: Received vault sync request', request.payload);
        
        // Persist to chrome.storage.local
        chrome.storage.local.set({ vaultData: request.payload }, () => {
            console.log('✅ Background: Vault data persisted to storage');
            sendResponse({ success: true });
        });
        
        return true; // Keep channel open for async response
    }

    if (request.type === 'FETCH_FILE') {
        console.log('📂 Background: Fetching file proxy for', request.url);
        
        fetch(request.url)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    sendResponse({ success: true, dataUrl: reader.result });
                };
                reader.readAsDataURL(blob);
            })
            .catch(err => {
                console.error('❌ Background: Fetch failed', err);
                sendResponse({ success: false, error: err.message });
            });
            
        return true;
    }
});
