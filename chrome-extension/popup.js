document.addEventListener('DOMContentLoaded', async () => {
    const autofillBtn = document.getElementById('autofill-btn');
    const profileDataContainer = document.getElementById('profileData');
    const profileName = document.getElementById('active-profile');
    const avatar = document.getElementById('avatar');

    // 1. Load from Local Storage
    chrome.storage.local.get(['vaultData', 'cvFile', 'passportFile', 'transcriptFile'], (result) => {
        const profile = result.vaultData || {};
        const localFiles = {
            cv: result.cvFile,
            passport: result.passportFile,
            transcript: result.transcriptFile
        };

        // Populate Footer
        if (profile.firstName) {
            profileName.innerText = `${profile.firstName}'s Profile`;
            avatar.innerText = profile.firstName.charAt(0).toUpperCase();
        }

        profileDataContainer.innerHTML = ''; // Clear loading text

        if (!result.vaultData) {
            profileDataContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 12px;">No vault data synced yet. Please log in to Accepta.ai.</div>';
        } else {
            // Fields to display in the UI
            const fieldsToDisplay = [
                { label: 'Name', value: profile.fullName },
                { label: 'Email', value: profile.email },
                { label: 'Nationality', value: profile.nationality }
            ];

            fieldsToDisplay.forEach(field => {
                if (field.value) {
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `
                        <div>
                            <div class="data-label">${field.label}</div>
                            <div class="data-value">${field.value}</div>
                        </div>
                        <button class="copy-btn" data-value="${field.value}">Copy</button>
                    `;
                    profileDataContainer.appendChild(row);
                }
            });
        }

        // 2. Add Local Cloud Vault Section
        const vaultSection = document.createElement('div');
        vaultSection.style.marginTop = '20px';
        vaultSection.style.borderTop = '1px solid var(--border-color)';
        vaultSection.style.paddingTop = '12px';
        vaultSection.innerHTML = `
            <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Personal Document Vault</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${renderDocUploadRow('CV', 'cv', localFiles.cv)}
                ${renderDocUploadRow('Passport', 'passport', localFiles.passport)}
                ${renderDocUploadRow('Transcript', 'transcript', localFiles.transcript)}
            </div>
        `;
        profileDataContainer.appendChild(vaultSection);

        // Attach listeners for file uploads
        attachFileUploadListeners();
        
        // Attach copy listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.getAttribute('data-value');
                navigator.clipboard.writeText(val);
                e.target.innerText = '✓';
                setTimeout(() => e.target.innerText = 'Copy', 1500);
            });
        });
    });

    autofillBtn.addEventListener('click', () => {
        chrome.storage.local.get(['vaultData'], (result) => {
            if (!result.vaultData) {
                alert("Please sync your profile data from the web app first.");
                return;
            }
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'fill_form', profileData: result.vaultData });
                }
            });
        });
    });
});

function renderDocUploadRow(label, id, fileData) {
    const isReady = !!fileData;
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
            <span style="font-size: 12px; color: var(--text-primary);">${label}</span>
            <div id="${id}-container">
                ${isReady ? `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 10px; background: #064e3b; color: #34d399; padding: 2px 8px; border-radius: 99px;">🟢 Ready</span>
                        <button class="replace-btn" data-type="${id}" style="background: none; border: none; color: var(--accent-color); font-size: 10px; cursor: pointer; padding: 0; text-decoration: underline;">Replace</button>
                    </div>
                ` : `
                    <label class="upload-label" style="background: var(--bg-secondary); color: var(--text-secondary); font-size: 10px; padding: 4px 10px; border-radius: 4px; border: 1px dashed var(--border-color); cursor: pointer;">
                        Upload PDF
                        <input type="file" id="${id}-upload" accept=".pdf" style="display: none;" />
                    </label>
                `}
            </div>
        </div>
    `;
}

function attachFileUploadListeners() {
    ['cv', 'passport', 'transcript'].forEach(type => {
        const input = document.getElementById(`${type}-upload`);
        if (input) {
            input.addEventListener('change', (e) => handleFileSelection(e, type));
        }
        
        // Handle "Replace" buttons (they are added dynamically, so we can use delegation or re-attach)
        // For simplicity here, we'll re-attach after every render if needed, but delegation is better
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('replace-btn')) {
            const type = e.target.getAttribute('data-type');
            const container = document.getElementById(`${type}-container`);
            container.innerHTML = `
                <label class="upload-label" style="background: var(--bg-secondary); color: var(--text-secondary); font-size: 10px; padding: 4px 10px; border-radius: 4px; border: 1px dashed var(--border-color); cursor: pointer;">
                    Upload PDF
                    <input type="file" id="${type}-upload" accept=".pdf" style="display: none;" />
                </label>
            `;
            document.getElementById(`${type}-upload`).addEventListener('change', (ev) => handleFileSelection(ev, type));
        }
    });
}

async function handleFileSelection(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("File too large. Max 10MB allowed.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64String = e.target.result;
        const saveData = {};
        saveData[`${type}File`] = { name: file.name, data: base64String };
        
        chrome.storage.local.set(saveData, () => {
            // Update UI to show ready
            const container = document.getElementById(`${type}-container`);
            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 10px; background: #064e3b; color: #34d399; padding: 2px 8px; border-radius: 99px;">🟢 Ready</span>
                    <button class="replace-btn" data-type="${type}" style="background: none; border: none; color: var(--accent-color); font-size: 10px; cursor: pointer; padding: 0; text-decoration: underline;">Replace</button>
                </div>
            `;
        });
    };
    reader.readAsDataURL(file);
}
