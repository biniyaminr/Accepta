function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
    const autofillBtn = document.getElementById('autofill-btn');
    const profileDataContainer = document.getElementById('profileData');
    const profileName = document.getElementById('active-profile');
    const avatar = document.getElementById('avatar');

    // Status line under the button (created dynamically)
    const statusEl = document.createElement('div');
    statusEl.id = 'fill-status';
    statusEl.style.cssText = 'font-size:11px;text-align:center;margin-top:8px;min-height:14px;color:var(--text-secondary);';
    autofillBtn.insertAdjacentElement('afterend', statusEl);

    const setStatus = (msg, color) => {
        statusEl.textContent = msg;
        statusEl.style.color = color || 'var(--text-secondary)';
    };

    // 1. Load from Local Storage
    chrome.storage.local.get(['vaultData', 'lastSyncAt', 'cvFile', 'passportFile', 'transcriptFile'], (result) => {
        const profile = result.vaultData || {};
        const localFiles = {
            cv: result.cvFile,
            passport: result.passportFile,
            transcript: result.transcriptFile
        };

        // Populate Footer
        const displayFirst = profile.firstName || (profile.fullName || '').split(' ')[0];
        if (displayFirst) {
            profileName.innerText = `${displayFirst}'s Profile`;
            avatar.innerText = displayFirst.charAt(0).toUpperCase();
        }

        profileDataContainer.innerHTML = ''; // Clear loading text

        if (!result.vaultData) {
            profileDataContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 12px;">No vault data synced yet.<br/>Log in at <b>accepta.site</b> and your profile syncs automatically.</div>';
        } else {
            if (result.lastSyncAt) {
                const mins = Math.round((Date.now() - result.lastSyncAt) / 60000);
                setStatus(mins < 1 ? 'Synced just now' : `Synced ${mins < 60 ? mins + 'm' : Math.round(mins / 60) + 'h'} ago`);
            }

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
                            <div class="data-label">${escapeHtml(field.label)}</div>
                            <div class="data-value">${escapeHtml(field.value)}</div>
                        </div>
                        <button class="copy-btn" data-value="${escapeHtml(field.value)}">Copy</button>
                    `;
                    profileDataContainer.appendChild(row);
                }
            });
        }

        // 2. Document Vault section (auto-synced from Cloud Vault, manual upload as fallback)
        const vaultSection = document.createElement('div');
        vaultSection.style.marginTop = '20px';
        vaultSection.style.borderTop = '1px solid var(--border-color)';
        vaultSection.style.paddingTop = '12px';
        vaultSection.innerHTML = `
            <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Document Vault</div>
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

    // 3. Auto-Fill: modern MV3 flow — inject the fill engine on demand into the
    // active tab (all frames), then invoke it with the vault payload.
    autofillBtn.addEventListener('click', async () => {
        const stored = await chrome.storage.local.get(['vaultData', 'cvFile', 'passportFile', 'transcriptFile']);
        if (!stored.vaultData) {
            setStatus('Sync your profile at accepta.site first.', '#f59e0b');
            return;
        }

        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tab || !tab.id) {
            setStatus('No active tab found.', '#ef4444');
            return;
        }

        setStatus('Filling…');
        try {
            // Step 1: define window.__acceptaFill in every frame of the page
            await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                files: ['filler.js'],
            });

            // Step 2: run it with the payload; collect per-frame results
            const payload = {
                profile: stored.vaultData,
                files: {
                    cv: stored.cvFile || null,
                    passport: stored.passportFile || null,
                    transcript: stored.transcriptFile || null,
                },
            };
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                func: (p) => (window.__acceptaFill ? window.__acceptaFill(p) : { filled: 0, files: 0 }),
                args: [payload],
            });

            let filled = 0, files = 0;
            for (const r of results) {
                if (r && r.result) { filled += r.result.filled || 0; files += r.result.files || 0; }
            }

            if (filled === 0 && files === 0) {
                setStatus('No matching fields found on this page.', '#f59e0b');
            } else {
                setStatus(`✓ Filled ${filled} field${filled === 1 ? '' : 's'}${files ? ` · ${files} document${files === 1 ? '' : 's'} attached` : ''}`, '#34d399');
            }
        } catch (err) {
            console.error('Accepta fill failed:', err);
            setStatus('Cannot fill this page (restricted or protected).', '#ef4444');
        }
    });
});

function renderDocUploadRow(label, id, fileData) {
    const isReady = !!fileData;
    const badge = fileData && fileData.source === 'cloud' ? '☁️ Synced' : '🟢 Ready';
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
            <span style="font-size: 12px; color: var(--text-primary);">${label}</span>
            <div id="${id}-container">
                ${isReady ? `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 10px; background: #064e3b; color: #34d399; padding: 2px 8px; border-radius: 99px;">${badge}</span>
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
        saveData[`${type}File`] = { name: file.name, data: base64String, source: 'manual' };

        chrome.storage.local.set(saveData, () => {
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
