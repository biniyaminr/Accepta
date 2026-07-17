import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creditPassForPayment } from "@/lib/pass";

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

        await creditPassForPayment(payment);
        return redirectTo("success");
    } catch (error) {
        console.error("🔥 Chapa Verify Error:", error);
        return redirectTo("failed");
    }
}
