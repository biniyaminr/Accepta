document.addEventListener('DOMContentLoaded', async () => {
    const autofillBtn = document.getElementById('autofill-btn');
    const profileDataContainer = document.getElementById('profileData');
    const profileName = document.getElementById('active-profile');
    const avatar = document.getElementById('avatar');

    // 1. Load from Local Storage (Synced from Web App)
    chrome.storage.local.get('vaultData', (result) => {
        const profile = result.vaultData;

        if (!profile) {
            profileDataContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 12px;">No vault data found. Please log in to Accepta.ai to sync your profile.</div>';
            return;
        }

        // Populate Footer
        if (profile.firstName) {
            profileName.innerText = `${profile.firstName}'s Profile`;
            avatar.innerText = profile.firstName.charAt(0).toUpperCase();
        }

        profileDataContainer.innerHTML = ''; // Clear loading text

        // Fields to display in the UI
        const fieldsToDisplay = [
            { label: 'First Name', value: profile.firstName },
            { label: 'Last Name', value: profile.lastName },
            { label: 'Email', value: profile.email },
            { label: 'Phone', value: profile.phone },
            { label: 'DOB', value: profile.dob },
            { label: 'Nationality', value: profile.nationality },
            { label: 'Gender', value: profile.gender }
        ];

        fieldsToDisplay.forEach(field => {
            if (field.value) {
                const row = document.createElement('div');
                row.className = 'data-row';
                row.innerHTML = `
                  <div>
                    <div class="data-label">${field.label}</div>
                    <div class="data-value" title="${field.value}">${field.value}</div>
                  </div>
                  <button class="copy-btn" data-value="${field.value}">Copy</button>
                `;
                profileDataContainer.appendChild(row);
            }
        });

        // 2. Add Cloud Vault Section
        const vaultSection = document.createElement('div');
        vaultSection.style.marginTop = '20px';
        vaultSection.style.borderTop = '1px solid var(--border-color)';
        vaultSection.style.paddingTop = '12px';
        vaultSection.innerHTML = `
            <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Cloud Vault Documents</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${renderDocStatus('CV', profile.files?.cvUrl)}
                ${renderDocStatus('Passport', profile.files?.passportUrl)}
                ${renderDocStatus('Transcript', profile.files?.transcriptUrl)}
            </div>
        `;
        profileDataContainer.appendChild(vaultSection);

        // Attach copy listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.getAttribute('data-value');
                navigator.clipboard.writeText(val);
                const originalText = e.target.innerText;
                e.target.innerText = '✓';
                e.target.classList.add('copied');
                setTimeout(() => {
                    e.target.innerText = originalText;
                    e.target.classList.remove('copied');
                }, 1500);
            });
        });
    });

    // 2. Handle Auto-Fill Button Click
    autofillBtn.addEventListener('click', () => {
        chrome.storage.local.get('vaultData', (result) => {
            const profile = result.vaultData;
            if (!profile) {
                alert("Please sync your vault data first by logging into Accepta.ai");
                return;
            }

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: 'fill_form', 
                        profileData: profile 
                    });
                }
            });
        });
    });
});

/**
 * Helper to render document status rows in the popup
 */
function renderDocStatus(label, url) {
    const isReady = !!url;
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
            <span style="font-size: 12px; color: var(--text-primary);">${label}</span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 99px; 
                ${isReady ? 'background: #064e3b; color: #34d399;' : 'background: #450a0a; color: #f87171;'}">
                ${isReady ? '🟢 Ready' : '🔴 Missing'}
            </span>
        </div>
    `;
}
