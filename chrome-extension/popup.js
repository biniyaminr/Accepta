document.addEventListener('DOMContentLoaded', async () => {
    const autofillBtn = document.getElementById('autofill-btn');
    const profileDataContainer = document.getElementById('profileData');
    // 1. Instantly fetch and render the vault
    try {
        const response = await fetch('https://university-automation-app.vercel.app/api/extension/profile');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const profile = await response.json();

        // Populate Footer
        const profileName = document.getElementById('active-profile');
        const avatar = document.getElementById('avatar');
        if (profile.firstName) {
            profileName.innerText = `${profile.firstName}'s Profile`;
            avatar.innerText = profile.firstName.charAt(0).toUpperCase();
        }

        profileDataContainer.innerHTML = ''; // Clear loading text
        // Filter out empty values and map to UI
        const fieldsToDisplay = [
            { label: 'First Name', value: profile.firstName },
            { label: 'Last Name', value: profile.lastName },
            { label: 'Email', value: profile.email },
            { label: 'Phone', value: profile.phone },
            { label: 'DOB', value: profile.dob },
            { label: 'Nationality', value: profile.nationality },
            { label: 'Gender', value: profile.gender },
            { label: 'Passport', value: profile.passport }
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
        // Attach copy listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.getAttribute('data-value');
                navigator.clipboard.writeText(val);
                const originalText = e.target.innerText;
                e.target.innerText = 'Copied! ✓';
                e.target.classList.add('copied');
                setTimeout(() => {
                    e.target.innerText = originalText;
                    e.target.classList.remove('copied');
                }, 1500);
            });
        });
    } catch (error) {
        profileDataContainer.innerHTML = 'Error connecting to your database. Ensure the Vercel app is running!';
        console.error('Fetch error:', error);
    }

    // 2. Handle Auto-Fill Button Click
    autofillBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'AUTO_FILL' });
            }
        });
    });
});
