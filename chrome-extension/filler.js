// Accepta Fill Engine — injected on demand via chrome.scripting.executeScript.
// Defines window.__acceptaFill(payload) and returns; the popup then calls it
// with { profile, files } in a second executeScript call.
(() => {
    if (window.__acceptaFill) return; // already injected in this frame

    // ── Helpers ────────────────────────────────────────────────────────────

    const norm = (s) =>
        (s || '')
            .toString()
            .toLowerCase()
            .replace(/[_\-:*()[\]"'.,/\\]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    // Ordered: more specific keys first so e.g. "first name" wins before "name".
    const FIELD_KEYWORDS = {
        firstName: ['first name', 'given name', 'forename', 'nome'],
        lastName: ['last name', 'surname', 'family name', 'cognome'],
        email: ['email address', 'e mail', 'email', 'indirizzo email'],
        phone: ['phone number', 'mobile number', 'telephone', 'phone', 'mobile', 'cell', 'telefono'],
        dob: ['date of birth', 'birth date', 'birthday', 'dob', 'born on'],
        nationality: ['country of citizenship', 'nationality', 'citizenship', 'nazionalita'],
        gender: ['gender', 'sex', 'sesso'],
        address: ['street address', 'address line 1', 'address', 'street', 'residence address'],
        city: ['city', 'town'],
        country: ['country of residence', 'country'],
        gpa: ['grade point average', 'gpa', 'cgpa', 'percentage of marks', 'marks obtained', 'final grade'],
        institution: ['university attended', 'name of institution', 'institution name', 'school name', 'college name', 'previous university'],
        major: ['field of study', 'major', 'degree program', 'course of study', 'study program'],
        fullName: ['full legal name', 'full name', 'complete name', 'name of applicant', 'applicant name'],
    };

    const FILE_KEYWORDS = {
        cv: ['curriculum vitae', 'curriculum', 'resume', 'cv'],
        passport: ['passport', 'identity document', 'id document', 'identification'],
        transcript: ['transcript', 'academic record', 'diploma', 'grade report', 'marksheet'],
    };

    // Everything that identifies an input: its own attributes + every kind of label.
    function getContext(el) {
        const parts = [
            el.name,
            el.id,
            el.placeholder,
            el.getAttribute('aria-label'),
            el.getAttribute('autocomplete'),
            el.getAttribute('data-testid'),
            el.title,
        ];
        if (el.labels && el.labels.length) {
            parts.push(...Array.from(el.labels).map((l) => l.textContent));
        }
        const wrapping = el.closest('label');
        if (wrapping) parts.push(wrapping.textContent);
        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
            labelledBy.split(/\s+/).forEach((id) => {
                const node = document.getElementById(id);
                if (node) parts.push(node.textContent);
            });
        }
        // Small enclosing container often holds the visible label text
        const parent = el.parentElement;
        if (parent && parent.textContent && parent.textContent.length < 160) {
            parts.push(parent.textContent);
        }
        const grand = parent && parent.parentElement;
        if (grand && grand.textContent && grand.textContent.length < 160) {
            parts.push(grand.textContent);
        }
        return norm(parts.filter(Boolean).join(' '));
    }

    function isFillable(el) {
        if (el.disabled || el.readOnly) return false;
        if (el.hasAttribute('data-accepta-filled')) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return true;
    }

    // React 16+ / Vue / Angular safe value injection: use the NATIVE prototype
    // setter so framework value-tracking sees a genuine change, then fire the
    // events frameworks listen for.
    function setNativeValue(el, value) {
        const proto =
            el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
            : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
            : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) desc.set.call(el, value);
        else el.value = value;
    }

    function fireEvents(el) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    function markFilled(el, value) {
        el.setAttribute('data-accepta-filled', 'true');
        el.style.outline = '2px solid #8b5cf6';
        el.style.outlineOffset = '1px';
        if (value != null) el.title = `Accepta Vault: ${value}`;
    }

    function formatDate(value, el) {
        const d = new Date(value);
        if (isNaN(d)) return String(value);
        const iso = d.toISOString().split('T')[0]; // yyyy-mm-dd
        if (el.type === 'date') return iso;
        const [y, m, day] = iso.split('-');
        const hint = norm(el.placeholder || '');
        if (hint.includes('mm dd')) return `${m}/${day}/${y}`;
        if (hint.includes('dd mm')) return `${day}/${m}/${y}`;
        return iso;
    }

    function fillSelect(el, value) {
        const target = norm(value);
        if (!target) return false;
        const options = Array.from(el.options);
        const opt = options.find((o) => {
            const text = norm(o.text);
            const val = norm(o.value);
            return (
                text === target ||
                val === target ||
                (target.length > 3 && text.includes(target)) ||
                (target.length > 3 && target.includes(text) && text.length > 2) ||
                (['male', 'female', 'm', 'f'].includes(target) && text.startsWith(target.charAt(0)))
            );
        });
        if (!opt) return false;
        setNativeValue(el, opt.value);
        fireEvents(el);
        markFilled(el, opt.text);
        return true;
    }

    function fillRadio(candidates, value) {
        const target = norm(value);
        if (!target) return false;
        for (const radio of candidates) {
            const ctx = `${getContext(radio)} ${norm(radio.value)}`;
            if (ctx.includes(target) || (['male', 'female'].includes(target) && ctx.includes(target.charAt(0) + ' '))) {
                radio.click();
                markFilled(radio, value);
                return true;
            }
        }
        return false;
    }

    function fillText(el, value) {
        setNativeValue(el, el.type === 'date' || /date|birth/.test(norm(el.name + ' ' + el.id)) ? formatDate(value, el) : String(value));
        fireEvents(el);
        markFilled(el, value);
        return true;
    }

    // ── File injection (DataTransfer) ─────────────────────────────────────

    function base64ToFile(base64String, filename, mimeType = 'application/pdf') {
        const arr = base64String.split(',');
        const bstr = atob(arr.length > 1 ? arr[1] : arr[0]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new File([u8arr], filename, { type: mimeType });
    }

    function injectFile(input, fileData) {
        try {
            if (!fileData || !fileData.data) return false;
            const file = base64ToFile(fileData.data, fileData.name || 'document.pdf');
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            fireEvents(input);
            markFilled(input, fileData.name);
            return true;
        } catch (e) {
            console.error('❌ Accepta: file injection failed', e);
            return false;
        }
    }

    function findFileInput(keywords, fileInputs) {
        for (const input of fileInputs) {
            if (input.hasAttribute('data-accepta-filled')) continue;
            const ctx = getContext(input);
            if (keywords.some((kw) => ctx.includes(kw))) return input;
        }
        return null;
    }

    // ── Main fill ──────────────────────────────────────────────────────────

    window.__acceptaFill = function (payload) {
        const profile = Object.assign({}, (payload && payload.profile) || {});
        const files = (payload && payload.files) || {};

        // Derive first/last name from fullName when missing
        if (profile.fullName && !profile.firstName) {
            const parts = profile.fullName.trim().split(/\s+/);
            profile.firstName = parts[0];
            if (parts.length > 1) profile.lastName = parts.slice(1).join(' ');
        }
        // Surface first education for GPA / institution / major
        const edu = Array.isArray(profile.educations) && profile.educations[0] ? profile.educations[0] : {};
        if (edu.gpa != null && profile.gpa == null) profile.gpa = edu.gpa;
        if (edu.institutionName && !profile.institution) profile.institution = edu.institutionName;
        if (edu.major && !profile.major) profile.major = edu.major;

        // Candidate inputs, with contexts computed once
        const textInputs = Array.from(
            document.querySelectorAll(
                'input:not([type="file"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), select, textarea'
            )
        ).filter(isFillable);
        const radios = Array.from(document.querySelectorAll('input[type="radio"]')).filter(isFillable);
        const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));

        const candidates = textInputs.map((el) => ({ el, ctx: getContext(el) }));

        let filled = 0;

        for (const [key, keywords] of Object.entries(FIELD_KEYWORDS)) {
            const value = profile[key];
            if (value == null || value === '') continue;

            let done = false;
            for (const kw of keywords) {
                const match = candidates.find((c) => !c.el.hasAttribute('data-accepta-filled') && c.ctx.includes(kw));
                if (match) {
                    done =
                        match.el.tagName === 'SELECT'
                            ? fillSelect(match.el, value)
                            : fillText(match.el, value);
                    if (done) filled++;
                    break;
                }
            }
            // Gender is frequently a radio group
            if (!done && key === 'gender' && radios.length) {
                if (fillRadio(radios, value)) filled++;
            }
        }

        // Documents from the Vault
        let filesInjected = 0;
        for (const [type, keywords] of Object.entries(FILE_KEYWORDS)) {
            const fileData = files[type];
            if (!fileData) continue;
            const input = findFileInput(keywords, fileInputs);
            if (input && injectFile(input, fileData)) filesInjected++;
        }

        console.log(`✅ Accepta: filled ${filled} fields, injected ${filesInjected} documents`);
        return { filled, files: filesInjected };
    };
})();
