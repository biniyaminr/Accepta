const PROFILE_MAP = {
    firstName: ['first name', 'given name', 'nome'],
    lastName: ['last name', 'surname', 'family name', 'cognome'],
    email: ['email', 'e-mail', 'indirizzo email'],
    phone: ['phone', 'mobile', 'cell', 'telefono'],
    gender: ['gender', 'sex', 'sesso'],
    nationality: ['nationality', 'citizenship', 'nazionalità'],
    dob: ['dob', 'birth date', 'date of birth', 'birth', 'bday'],
    address: ['address', 'street', 'line 1', 'location'],
    city: ['city', 'town'],
    country: ['country', 'residence']
};

function findInputForKeywords(keywords) {
    const inputs = Array.from(document.querySelectorAll('input:not([type="file"]):not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'));
    const allElements = Array.from(document.body.querySelectorAll('*'));

    // 1. Find all elements containing ANY of the keywords
    let allMatches = [];
    for (const keyword of keywords) {
        const matches = allElements.filter(el => 
            el.textContent && 
            el.textContent.toLowerCase().includes(keyword.toLowerCase()) && 
            !['SCRIPT', 'STYLE', 'OPTION'].includes(el.tagName)
        );
        allMatches = [...allMatches, ...matches];
    }

    if (allMatches.length === 0) return null;

    // 2. Sort by text length to isolate the exact label (avoids grabbing <body>)
    allMatches.sort((a, b) => a.textContent.trim().length - b.textContent.trim().length);
    const bestLabel = allMatches[0];

    // 3. Find the input that appears immediately after this label
    const labelIndex = allElements.indexOf(bestLabel);
    const targetInput = inputs.find(input => 
        allElements.indexOf(input) > labelIndex && 
        !input.hasAttribute('data-accepta-filled')
    );

    return targetInput;
}

/**
 * Finds a file <input> whose context (own attributes or associated label /
 * nearby text) matches the given keyword. Mirrors findInputForKeywords, but
 * targets input[type=file] specifically (which the text finder excludes).
 */
function findFileInputForKeyword(keyword) {
    const kw = keyword.toLowerCase();
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));

    for (const input of fileInputs) {
        if (input.hasAttribute('data-accepta-filled')) continue;

        // 1. The input's own identifying attributes
        const attrParts = [
            input.id,
            input.name,
            input.getAttribute('aria-label'),
            input.getAttribute('placeholder'),
            input.getAttribute('title'),
            input.className
        ].filter(Boolean).join(' ');

        // 2. Associated <label> elements (for=id) and any wrapping <label>
        let labelText = '';
        if (input.labels && input.labels.length) {
            labelText = Array.from(input.labels).map(l => l.textContent).join(' ');
        }
        const wrappingLabel = input.closest('label');
        if (wrappingLabel) labelText += ' ' + wrappingLabel.textContent;

        // 3. Immediate container text (capped so we don't grab half the page)
        const parent = input.parentElement;
        const parentText = parent && parent.textContent.length < 200 ? parent.textContent : '';

        const context = `${attrParts} ${labelText} ${parentText}`.toLowerCase();
        if (context.includes(kw)) return input;
    }

    return null;
}

function injectTextIntoInput(element, value) {
    if (!element || !value) return false;

    // Smart Dropdown Handling
    if (element.tagName === 'SELECT') {
        const targetValue = String(value).toLowerCase().trim();
        const options = Array.from(element.options);
        const opt = options.find(o => 
            o.text.toLowerCase() === targetValue || 
            o.value.toLowerCase() === targetValue ||
            (targetValue.length > 3 && o.text.toLowerCase().includes(targetValue)) ||
            (targetValue.length > 3 && targetValue.includes(o.text.toLowerCase())) ||
            (o.text.toLowerCase().startsWith(targetValue.charAt(0)) && ['male', 'female', 'm', 'f'].includes(targetValue))
        );
        
        if (opt) {
            element.value = opt.value;
        } else {
            console.log(`⏭️ Accepta: No matching <option> found for dropdown value "${value}"`);
            return false;
        }
    } else {
        // Handle Date formatting for date inputs
        if (element.type === 'date') {
            try { value = new Date(value).toISOString().split('T')[0]; } catch(e) {}
        }
        element.value = String(value);
    }

    // 2. The React/Vue Bypass (Value Tracker)
    const tracker = element._valueTracker;
    if (tracker) { 
        tracker.setValue(""); 
    }

    // 3. Force events to bubble up
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Visual Feedback
    element.style.border = '2px solid #10b981'; // Green success border
    element.style.backgroundColor = '#ecfdf5';
    element.setAttribute('data-accepta-filled', 'true');
    element.setAttribute('title', `Accepta Vault: ${value}`);
    console.log(`✅ Accepta: Auto-filled generic input with "${value}"`);
    
    return true;
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

    // Attempt to fill each mapped field sequentially
    for (const [key, keywords] of Object.entries(PROFILE_MAP)) {
        let value = profileData[key];
        
        if (value) {
            const targetInput = findInputForKeywords(keywords);
            if (targetInput) {
                const success = injectTextIntoInput(targetInput, value);
                if (success) filledCount++;
            }
        }
    }
    
    // GPA Edge Case Array
    if (profileData.educations?.length > 0 && profileData.educations[0].gpa) {
        const gpaInput = findInputForKeywords(['gpa', 'grade point', 'cgpa', 'marks', 'percentage']);
        if (gpaInput) {
            if (injectTextIntoInput(gpaInput, profileData.educations[0].gpa)) {
                filledCount++;
            }
        }
    }

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
        inputElement.setAttribute('data-accepta-filled', 'true');
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
