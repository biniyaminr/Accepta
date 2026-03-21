// Highly aggressive patterns to match against input names, ids, placeholders, or labels
const FIELD_PATTERNS = {
    lastName: /last.*name|lname|family.*name|surname/i,
    firstName: /first.*name|fname|given.*name|\bname\b/i,
    fullName: /full.*name/i,
    email: /email|e-mail|emailaddress|mail|email\s*address/i,
    phone: /phone|mobile|tel|contact/i,
    dob: /dob|birth.*date|date.*of.*birth|birth|bday|date\s*of\s*birth/i,
    address: /address|street|line.*1|location/i,
    city: /city|town/i,
    country: /country|nation|citizenship|nationality/i,
    gpa: /gpa|grade.*point|cgpa|marks|percentage/i,
    gender: /gender|sex/i,
};

function autoFillForm(profileData) {
    let filledCount = 0;

    // Intelligently split the full name into first and last name if needed
    if (profileData.fullName && !profileData.firstName) {
        const parts = profileData.fullName.trim().split(/\s+/);
        profileData.firstName = parts[0];
        if (parts.length > 1) {
            profileData.lastName = parts.slice(1).join(" ");
        }
    }

    // Find all potential form elements
    const formElements = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), select, textarea');

    formElements.forEach(element => {
        // Skip disabled or readonly
        if (element.disabled || element.readOnly) return;

        // 1. Build Deep Visual Context
        let context = `${element.name || ''} ${element.id || ''} ${element.placeholder || ''}`;

        // Associated label text
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) context += ` ${label.innerText || label.textContent}`;
        }

        const wrapper = element.closest('.form-group, [class*="col-"], td, tr, div');
        if (wrapper) context += ` ${wrapper.innerText}`;

        context = context.toLowerCase().replace(/\s+/g, ' ');

        console.log(`👀 Inspecting [${element.tagName}] ID="${element.id}" -> Context:`, context.substring(0, 50) + '...');

        // 2. The Force Fill Helper (Bypasses React/jQuery blockers)
        const forceFill = (val) => {
            if (!val) return;
            element.value = val;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.style.border = '2px solid #10b981'; // Green success border
            element.style.backgroundColor = '#ecfdf5';
            filledCount++;
        };

        // Date formatter helper
        const formatDate = (dateString, isDateField) => {
            if (!isDateField) return dateString;
            try {
                return new Date(dateString).toISOString().split('T')[0];
            } catch (e) {
                return dateString;
            }
        };

        // 3. Aggressive Dictionary Matchers
        if (profileData.firstName && context.match(/first name|given name|\bfname\b/)) forceFill(profileData.firstName);
        else if (profileData.lastName && context.match(/last name|surname|family name|\blname\b/)) forceFill(profileData.lastName);
        else if (profileData.email && context.match(/email|e-mail|mail/)) forceFill(profileData.email);
        else if (profileData.phone && context.match(/phone|mobile|tel|contact/)) forceFill(profileData.phone);
        else if (profileData.dob && context.match(/dob|birth/)) forceFill(formatDate(profileData.dob, element.type === 'date'));
        else if (profileData.gender && context.match(/gender|sex|title/)) {
            if (element.tagName === 'SELECT') {
                const targetGender = String(profileData.gender).toLowerCase().trim();
                const opt = Array.from(element.options).find(o =>
                    o.text.toLowerCase().startsWith(targetGender.charAt(0)) ||
                    o.value.toLowerCase().startsWith(targetGender.charAt(0))
                );
                if (opt) forceFill(opt.value);
            } else forceFill(profileData.gender);
        }
        else if ((profileData.country || profileData.citizenship) && context.match(/nationality|country|nation|citizenship/)) {
            const targetCountry = String(profileData.country || profileData.citizenship).toLowerCase().trim();
            if (element.tagName === 'SELECT') {
                const opt = Array.from(element.options).find(o =>
                    o.text.toLowerCase().includes(targetCountry) ||
                    targetCountry.includes(o.text.toLowerCase())
                );
                if (opt) forceFill(opt.value);
            } else forceFill(profileData.country || profileData.citizenship);
        }
        else if (profileData.city && context.match(/city|town/)) forceFill(profileData.city);
        else if (profileData.address && context.match(/address|street|line/)) forceFill(profileData.address);
        else if (context.match(/gpa|cgpa|grade|percentage/) && profileData.educations?.length > 0) {
            forceFill(profileData.educations[0].gpa);
        }

        // 4. File Input Injection (Direct Base64)
        if (element.type === 'file') {
            const isPassport = context.match(/passport|id\s*card|identity/i);
            const isResume = context.match(/resume|cv|curriculum|vitae/i);
            const isTranscript = context.match(/transcript|grades|mark\s*sheet|academic\s*record|education\s*doc/i);

            const local = profileData.localFiles || {};

            if (isPassport && local.passportFile) {
                injectFile(element, local.passportFile.data, local.passportFile.name);
            } else if (isResume && local.cvFile) {
                injectFile(element, local.cvFile.data, local.cvFile.name);
            } else if (isTranscript && local.transcriptFile) {
                injectFile(element, local.transcriptFile.data, local.transcriptFile.name);
            }
        }
    });

    return filledCount;
}

/**
 * Enhanced File Injection: Supports direct Base64 OR Proxy URL Fetch
 */
async function injectFile(inputElement, dataOrUrl, filename) {
    try {
        let file;
        
        // Check if dataOrUrl is a Base64 string (Direct Local Upload)
        if (dataOrUrl.startsWith('data:')) {
            console.log(`📂 Accepta: Injecting local Base64 file: ${filename}`);
            const res = await fetch(dataOrUrl);
            const blob = await res.blob();
            file = new File([blob], filename, { type: blob.type });
        } else {
            console.log(`📂 Accepta: Requesting background proxy fetch for ${filename}`);
            // Fallback to background fetch for sync'd URLs
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({ type: 'FETCH_FILE', url: dataOrUrl }, resolve);
            });

            if (!response || !response.success) {
                console.error(`❌ Accepta: Proxy fetch failed for ${filename}`, response?.error);
                return;
            }
            const res = await fetch(response.dataUrl);
            const blob = await res.blob();
            file = new File([blob], filename, { type: blob.type });
        }

        if (!file) return;

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // FRAMEWORK OVERRIDE: React/Angular often block standard .files assignment
        try {
            const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeValueSetter) {
                nativeValueSetter.call(inputElement, ''); // Clear it first
            }
        } catch (e) { console.warn("Native setter override failed", e); }

        // Inject file
        inputElement.files = dataTransfer.files;

        // Trigger events for React/Frameworks
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        inputElement.style.border = '2px solid #8b5cf6'; // Violet success
        console.log(`✅ Accepta: Successfully injected ${filename}`);
    } catch (err) {
        console.error(`❌ Accepta: File sync failed for ${filename}`, err);
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fill_form") {
        console.log("Accepta: Fill command received. Fetching local files...");
        
        chrome.storage.local.get(['cvFile', 'passportFile', 'transcriptFile'], (localFiles) => {
            const enhancedProfile = { ...request.profileData, localFiles };
            const count = autoFillForm(enhancedProfile);
            sendResponse({ success: true, fieldsFilled: count });
        });
        
        return true; // Keep channel open for async response
    }
});

// BRIDGE: Listen for SYNC messages from the web app
window.addEventListener('message', (event) => {
    // Only accept messages from our own window
    if (event.source !== window) return;

    if (event.data && event.data.type === 'ACCEPTA_SYNC_VAULT') {
        console.log('🚀 Accepta Content Script: Intercepted vault sync', event.data.payload);
        
        // Forward to background script to save in chrome.storage.local
        chrome.runtime.sendMessage({ 
            type: 'SYNC_VAULT', 
            payload: event.data.payload 
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Sync failed:', chrome.runtime.lastError);
            } else {
                console.log('✅ Vault sync complete');
            }
        });
    }
});
