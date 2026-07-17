import type { Payment } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extendExpiry } from "@/lib/plans";
import { captureServerEvent } from "@/lib/analytics-server";

/**
 * Credit a verified payment to its owner exactly once.
 *
 * Atomically claims the payment (status -> COMPLETED) so concurrent callers
 * — e.g. a Chapa return_url refresh, or two transfer submissions — extend the
 * pass only a single time. Returns whether this call was the one that credited.
 */
export async function creditPassForPayment(payment: Payment): Promise<boolean> {
    // Atomically claim the payment so concurrent verifies credit only once.
    const claimed = await prisma.payment.updateMany({
        where: { id: payment.id, status: { not: "COMPLETED" } },
        data: { status: "COMPLETED" },
    });
    if (claimed.count === 0) {
        return false;
    }

    const user = await prisma.user.findUnique({ where: { id: payment.userId } });
    if (!user) {
        // Should never happen (FK), but leave the payment claimed rather than
        // re-opening it for another crediting attempt.
        return false;
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

    console.log(
        `✅ Pass credited: ${payment.planType} (+${payment.days} days) via ${payment.method} for user ${user.id}`
    );

    await captureServerEvent(user.userId ?? user.id, "pass_purchased", {
        pass_type: payment.planType.toLowerCase(),
        amount_etb: payment.amount,
        method: payment.method.toLowerCase(),
    });

    return true;
}
