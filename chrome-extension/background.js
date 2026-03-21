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
});
