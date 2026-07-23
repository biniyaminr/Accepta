import * as React from "react";
import { cn } from "@/lib/utils";

// Signature Accepta "Mission Control" surface: glassmorphism panel with a
// hairline ring and soft depth. Used across the admin data-entry console.
export function GlassCard({
    className,
    children,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-white/[0.06] bg-zinc-900/50 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-24px_rgba(0,0,0,0.9)]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
