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
function findFileInputForKeyword(keyword) {
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
    const allElements = Array.from(document.body.querySelectorAll('*'));

    // 1. Find all elements containing the keyword
    const matches = allElements.filter(el => 
        el.textContent && el.textContent.toLowerCase().includes(keyword)
    );

    if (matches.length === 0) return null;

    // 2. Sort by text length to isolate the exact label (avoids grabbing the whole <body> tag)
    matches.sort((a, b) => a.textContent.length - b.textContent.length);
    const bestLabel = matches[0];

    // 3. Find the file input that appears immediately after this label in the HTML
    const labelIndex = allElements.indexOf(bestLabel);
    const targetInput = fileInputs.find(input => allElements.indexOf(input) > labelIndex);

    return targetInput;
}

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

        // Note: File injection is now handled separately by the Sequential Scanner

    });

    return filledCount;
}

/**
 * Bulletproof Base64 to File Decoder
 */
function base64ToFile(base64String, filename, mimeType = 'application/pdf') {
    const arr = base64String.split(',');
    const bstr = atob(arr.length > 1 ? arr[1] : arr[0]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mimeType });
}

/**
 * Enhanced File Injector: Bypasses React/Angular/Vue event suppression
 */
function injectFileIntoInput(inputElement, fileDataObj) {
    try {
        if (!fileDataObj || !fileDataObj.data) {
            console.warn(`⚠️ Accepta: No local file data found for ${inputElement.id}`);
            return;
        }

        const file = base64ToFile(fileDataObj.data, fileDataObj.name);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // 1. Assign the file
        inputElement.files = dataTransfer.files;

        // 2. The React/Vue Bypass (Value Tracker)
        const tracker = inputElement._valueTracker;
        if (tracker) { 
            tracker.setValue(""); 
        }

        // 3. Force the events to bubble up so the website recognizes it
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));

        // Visual Feedback
        inputElement.style.border = '2px solid #8b5cf6'; // Violet success
        console.log(`✅ Accepta: Injected ${fileDataObj.name} into ${inputElement.id || 'file input'}`);
    } catch (error) {
        console.error("❌ Accepta: Injection failed:", error);
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fill_form") {
        console.log("Accepta: Fill command received. Fetching local files...");
        
        chrome.storage.local.get(['cvFile', 'passportFile', 'transcriptFile'], (vault) => {
            // Auto-fill standard text inputs
            autoFillForm(request.profileData);
            
            // Sequential DOM Scanner for File Injections
            if (vault.cvFile) {
                const cvInput = findFileInputForKeyword('curriculum') || findFileInputForKeyword('cv') || findFileInputForKeyword('resume');
                if (cvInput) injectFileIntoInput(cvInput, vault.cvFile);
            }
            
            if (vault.passportFile) {
                const passInput = findFileInputForKeyword('passport') || findFileInputForKeyword('identity');
                if (passInput) injectFileIntoInput(passInput, vault.passportFile);
            }
            
            if (vault.transcriptFile) {
                const transInput = findFileInputForKeyword('transcript') || findFileInputForKeyword('diploma') || findFileInputForKeyword('academic');
                if (transInput) injectFileIntoInput(transInput, vault.transcriptFile);
            }
            
            sendResponse({ success: true });
        });
        
        return true; 
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
