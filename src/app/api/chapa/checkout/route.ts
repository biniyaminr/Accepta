import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PASS_PLANS, isPassPlanId } from "@/lib/plans";

export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const planId = typeof body.plan === "string" ? body.plan.toUpperCase() : "";
        if (!isPassPlanId(planId)) {
            return NextResponse.json({ error: "Invalid plan. Expected SPRINT or SEASON." }, { status: 400 });
        }
        const plan = PASS_PLANS[planId];

        const email = user.emailAddresses[0]?.emailAddress || "test@example.com";
        const firstName = user.firstName || "Accepta";
        const lastName = user.lastName || "User";

        const dbUser = await prisma.user.findUnique({ where: { userId: user.id } });
        if (!dbUser) {
            return NextResponse.json({ error: "Complete your profile before purchasing a pass." }, { status: 400 });
        }

        const tx_ref = `TX-${Date.now()}-${user.id.slice(-5)}`;

        await prisma.payment.create({
            data: {
                txRef: tx_ref,
                planType: plan.id,
                amount: plan.amount,
                days: plan.days,
                status: "PENDING",
                userId: dbUser.id,
            },
        });

        const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

        console.log(`💳 Initializing Chapa transaction for ${email} (${tx_ref}, ${plan.id})...`);

        const chapaResponse = await fetch("https://api.chapa.co/v1/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: String(plan.amount),
                currency: "ETB",
                email: email,
                first_name: firstName,
                last_name: lastName,
                tx_ref: tx_ref,
                return_url: `${origin}/api/chapa/verify?tx_ref=${tx_ref}`,
                customization: {
                    // Chapa limits: title 16 chars, description 50 chars
                    title: "Accepta",
                    description: `${plan.name} - ${plan.days} days unlimited access`,
                },
            }),
        });

        const data = await chapaResponse.json();

        if (!chapaResponse.ok) {
            console.error("Chapa API Error:", data);
            return NextResponse.json({
                error: data.message || "Failed to initialize transaction",
                details: data
            }, { status: 500 });
        }

        if (data.status === "success" && data.data?.checkout_url) {
            return NextResponse.json({ url: data.data.checkout_url });
        } else {
            console.error("Chapa unexpected response format:", data);
            return NextResponse.json({ error: "Chapa returned an unexpected response format" }, { status: 500 });
        }

    } catch (error) {
        console.error("🔥 Chapa Checkout Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
