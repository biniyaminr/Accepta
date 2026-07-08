import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extendExpiry } from "@/lib/plans";
import { captureServerEvent } from "@/lib/analytics-server";

// Chapa sends the user back here via return_url after checkout.
// We verify the transaction against Chapa's API before crediting the pass.
export async function GET(request: NextRequest) {
    const txRef = request.nextUrl.searchParams.get("tx_ref");
    const redirectTo = (result: "success" | "failed") =>
        NextResponse.redirect(new URL(`/dashboard?payment=${result}`, request.nextUrl.origin));

    if (!txRef) {
        return redirectTo("failed");
    }

    try {
        const payment = await prisma.payment.findUnique({ where: { txRef } });
        if (!payment) {
            return redirectTo("failed");
        }

        // Already credited — don't extend twice on refresh/revisit.
        if (payment.status === "COMPLETED") {
            return redirectTo("success");
        }

        const chapaResponse = await fetch(
            `https://api.chapa.co/v1/transaction/verify/${txRef}`,
            {
                headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` },
                cache: "no-store",
            }
        );
        const data = await chapaResponse.json();

        const paid =
            chapaResponse.ok &&
            data.status === "success" &&
            data.data?.status === "success" &&
            Number(data.data?.amount) >= payment.amount &&
            data.data?.currency === "ETB";

        if (!paid) {
            console.error(`❌ Chapa verification failed for ${txRef}:`, data?.data?.status ?? data?.message);
            await prisma.payment.update({
                where: { txRef },
                data: { status: "FAILED" },
            });
            return redirectTo("failed");
        }

        // Atomically claim the payment so concurrent verifies credit only once.
        const claimed = await prisma.payment.updateMany({
            where: { txRef, status: { not: "COMPLETED" } },
            data: { status: "COMPLETED" },
        });
        if (claimed.count === 0) {
            return redirectTo("success");
        }

        const user = await prisma.user.findUnique({ where: { id: payment.userId } });
        if (!user) {
            return redirectTo("failed");
        }

        const hasActivePass =
            user.planType !== "FREE" && user.expiresAt !== null && user.expiresAt > new Date();
        // An active Season Pass keeps its tier when a Sprint top-up is added;
        // the purchased days are always added on top of remaining time.
        const newPlanType =
            hasActivePass && user.planType === "SEASON" ? "SEASON" : payment.planType;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                planType: newPlanType,
                expiresAt: extendExpiry(user.expiresAt, payment.days),
            },
        });

        console.log(`✅ Pass credited: ${payment.planType} (+${payment.days} days) for user ${user.id}`);

        await captureServerEvent(user.userId ?? user.id, "pass_purchased", {
            pass_type: payment.planType.toLowerCase(),
            amount_etb: payment.amount,
        });

        return redirectTo("success");
    } catch (error) {
        console.error("🔥 Chapa Verify Error:", error);
        return redirectTo("failed");
    }
}
