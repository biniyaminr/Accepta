// Client for the Verifier API (https://verify.leul.et/docs) — a service that
// confirms Ethiopian bank / mobile-money transfers (CBE, Telebirr, Dashen,
// Abyssinia, CBEBirr, M-Pesa) from a transaction reference.
//
// We use the universal `POST /verify` router, which auto-detects the provider.
// Response shapes differ per provider, so the helpers below pull the fields we
// care about out of a loosely-typed payload.

const VERIFY_API_URL =
    process.env.VERIFY_API_URL?.replace(/\/$/, "") || "https://verifyapi.leulzenebe.pro";

export type VerifyInput = {
    reference: string;
    suffix?: string; // CBE / Abyssinia account suffix
    phoneNumber?: string; // CBEBirr
};

export type NormalizedVerification = {
    success: boolean;
    /** The amount the payer was actually charged (total incl. fees when present). */
    amount: number | null;
    /** Every string in the response that could identify the receiver, normalized. */
    receiverIdentifiers: string[];
    provider: string | null;
    reference: string | null;
    date: Date | null;
    raw: Record<string, unknown>;
};

export type VerifyResult =
    | { ok: true; data: NormalizedVerification }
    | { ok: false; error: string; status?: number };

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        // Strip currency symbols, "ETB", thousands separators, whitespace.
        const cleaned = value.replace(/[^0-9.]/g, "");
        if (cleaned === "") return null;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

// Field names the various providers use for the total the payer paid. Ordered
// by preference: we want the all-in total (incl. fees/VAT) so a payer can never
// underpay by having fees deducted from the plan price.
const AMOUNT_FIELDS = [
    "total",
    "totalPaid",
    "totalAmount",
    "settledAmount",
    "transactionAmount",
    "amount",
    "paidAmount",
    "creditedAmount",
];

// Field names that identify who received the money — used to confirm the
// transfer landed in *our* merchant account, not some third party.
const RECEIVER_FIELDS = [
    "receiverName",
    "receiverAccountNumber",
    "receiverAccount",
    "creditedPartyName",
    "creditedPartyAccountNo",
    "creditedPartyAccount",
    "receiver",
    "payeeName",
    "payee",
    "phoneNo",
    "phoneNumber",
    "accountNumber",
    "bankName",
];

const REFERENCE_FIELDS = ["transactionReference", "reference", "receiptNumber", "referenceNumber"];
const DATE_FIELDS = ["transactionDate", "paymentDate", "date"];

export function normalizeReceiver(value: string): string {
    return value.toLowerCase().replace(/[\s\-*]/g, "");
}

function firstNumber(raw: Record<string, unknown>, fields: string[]): number | null {
    for (const field of fields) {
        const n = toNumber(raw[field]);
        if (n !== null) return n;
    }
    return null;
}

function normalize(raw: Record<string, unknown>): NormalizedVerification {
    const receiverIdentifiers: string[] = [];
    for (const field of RECEIVER_FIELDS) {
        const value = raw[field];
        if (typeof value === "string" && value.trim() !== "") {
            receiverIdentifiers.push(normalizeReceiver(value));
        }
    }

    let reference: string | null = null;
    for (const field of REFERENCE_FIELDS) {
        if (typeof raw[field] === "string" && (raw[field] as string).trim() !== "") {
            reference = raw[field] as string;
            break;
        }
    }

    let date: Date | null = null;
    for (const field of DATE_FIELDS) {
        const value = raw[field];
        if (typeof value === "string" || typeof value === "number") {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) {
                date = parsed;
                break;
            }
        }
    }

    const provider =
        typeof raw.provider === "string"
            ? raw.provider
            : typeof raw.paymentProvider === "string"
              ? raw.paymentProvider
              : null;

    return {
        success: raw.success === true,
        amount: firstNumber(raw, AMOUNT_FIELDS),
        receiverIdentifiers,
        provider,
        reference,
        date,
        raw,
    };
}

/** Call the Verifier API's universal `/verify` endpoint and normalize the result. */
export async function verifyTransfer(input: VerifyInput): Promise<VerifyResult> {
    const apiKey = process.env.VERIFY_API_KEY;
    if (!apiKey) {
        return { ok: false, error: "Verification service is not configured." };
    }

    const body: Record<string, string> = { reference: input.reference };
    if (input.suffix) body.suffix = input.suffix;
    if (input.phoneNumber) body.phoneNumber = input.phoneNumber;

    let response: Response;
    try {
        response = await fetch(`${VERIFY_API_URL}/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify(body),
            cache: "no-store",
        });
    } catch (error) {
        console.error("🔥 Verifier API request failed:", error);
        return { ok: false, error: "Could not reach the verification service. Try again." };
    }

    let data: unknown = null;
    try {
        data = await response.json();
    } catch {
        // fall through to the !ok / shape checks below
    }

    if (!response.ok) {
        const message =
            (data && typeof data === "object" && "error" in data && typeof (data as Record<string, unknown>).error === "string"
                ? (data as Record<string, string>).error
                : null) ??
            (data && typeof data === "object" && "message" in data && typeof (data as Record<string, unknown>).message === "string"
                ? (data as Record<string, string>).message
                : null) ??
            "We couldn't verify that reference.";
        return { ok: false, error: message, status: response.status };
    }

    if (!data || typeof data !== "object") {
        return { ok: false, error: "Unexpected response from the verification service." };
    }

    return { ok: true, data: normalize(data as Record<string, unknown>) };
}

/**
 * Merchant account identifiers the transfer must have been sent to. Configure
 * via VERIFY_MERCHANT_ACCOUNTS as a comma-separated list of account numbers,
 * phone numbers, and/or the exact account name (e.g. "1000123456789,ACCEPTA PLC,0912345678").
 * If unset, receiver matching is skipped (NOT recommended in production).
 */
export function merchantIdentifiers(): string[] {
    return (process.env.VERIFY_MERCHANT_ACCOUNTS || "")
        .split(",")
        .map((s) => normalizeReceiver(s.trim()))
        .filter((s) => s.length > 0);
}

/** True when the verified receiver matches one of our configured merchant accounts. */
export function receiverMatchesMerchant(v: NormalizedVerification): boolean {
    const merchants = merchantIdentifiers();
    if (merchants.length === 0) return true; // not configured — skip the check
    return v.receiverIdentifiers.some((rid) =>
        merchants.some((m) => rid.includes(m) || m.includes(rid))
    );
}
