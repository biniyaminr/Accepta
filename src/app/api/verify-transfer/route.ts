import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PASS_PLANS, isPassPlanId } from "@/lib/plans";
import { creditPassForPayment } from "@/lib/pass";
import { verifyTransfer, receiverMatchesMerchant } from "@/lib/verify";

// How old a transfer receipt may be and still be accepted, in days.
// Guards against recycling an ancient (or someone else's historical) reference.
const MAX_RECEIPT_AGE_DAYS = Number(process.env.VERIFY_MAX_RECEIPT_AGE_DAYS || 30);

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const planId = typeof body.plan === "string" ? body.plan.toUpperCase() : "";
        const reference = typeof body.reference === "string" ? body.reference.trim() : "";
        const suffix = typeof body.suffix === "string" ? body.suffix.trim() : undefined;
        const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : undefined;

        if (!isPassPlanId(planId)) {
            return NextResponse.json({ error: "Invalid plan. Expected SPRINT or SEASON." }, { status: 400 });
        }
        if (!reference) {
            return NextResponse.json({ error: "Enter your transaction reference." }, { status: 400 });
        }
        const plan = PASS_PLANS[planId];

        const dbUser = await prisma.user.findUnique({ where: { userId: user.id } });
        if (!dbUser) {
            return NextResponse.json({ error: "Complete your profile before purchasing a pass." }, { status: 400 });
        }

        // Fast fail if this receipt was already redeemed (the DB unique on bankRef
        // is the real guard; this is just for a friendly message).
        const existing = await prisma.payment.findUnique({ where: { bankRef: reference } });
        if (existing) {
            return NextResponse.json(
                { error: "This transaction reference has already been used." },
                { status: 409 }
            );
        }

        // Verify the transfer against the Verifier API.
        const result = await verifyTransfer({ reference, suffix, phoneNumber });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status && result.status < 500 ? 400 : 502 });
        }
        const v = result.data;

        if (!v.success) {
            return NextResponse.json({ error: "We couldn't verify that transaction. Check the reference and try again." }, { status: 400 });
        }

        // The money must have actually reached our account.
        if (!receiverMatchesMerchant(v)) {
            console.warn(`⚠️ Transfer receiver mismatch for ref ${reference}:`, v.receiverValues);
            return NextResponse.json(
                { error: "This transfer wasn't sent to our payment account. Please pay to the listed account and try again." },
                { status: 400 }
            );
        }

        // The payer must have paid at least the plan price.
        if (v.amount === null || v.amount < plan.amount) {
            return NextResponse.json(
                { error: `Amount too low. This pass costs ${plan.amount} ETB but we found ${v.amount ?? "no amount"} ETB.` },
                { status: 400 }
            );
        }

        // Reject stale receipts.
        if (v.date) {
            const ageDays = (Date.now() - v.date.getTime()) / (24 * 60 * 60 * 1000);
            if (ageDays > MAX_RECEIPT_AGE_DAYS) {
                return NextResponse.json(
                    { error: "This transaction is too old to redeem. Please contact support." },
                    { status: 400 }
                );
            }
        }

        // Record the payment. The unique bankRef makes a concurrent duplicate
        // submission fail here rather than crediting twice.
        let payment;
        try {
            payment = await prisma.payment.create({
                data: {
                    txRef: `TR-${Date.now()}-${user.id.slice(-5)}`,
                    planType: plan.id,
                    amount: plan.amount,
                    days: plan.days,
                    status: "PENDING",
                    method: "TRANSFER",
                    provider: v.provider ?? null,
                    bankRef: reference,
                    userId: dbUser.id,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                return NextResponse.json(
                    { error: "This transaction reference has already been used." },
                    { status: 409 }
                );
            }
            throw error;
        }

        const credited = await creditPassForPayment(payment);
        if (!credited) {
            return NextResponse.json(
                { error: "This transaction reference has already been used." },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            plan: plan.id,
            days: plan.days,
        });
    } catch (error) {
        console.error("🔥 Transfer verification error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
