"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    suggestions: string[];
    className?: string;
    isMulti?: boolean;
}

export function SuggestionInput({
    label,
    value,
    onChange,
    placeholder,
    suggestions,
    className,
    isMulti = false,
}: SuggestionInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    // Filter chips: hide ones that are already typed, show rest
    const visibleSuggestions = suggestions.filter(
        (s) => !value || !s.toLowerCase().startsWith(value.toLowerCase().trim())
    );

    return (
        <div className={cn("space-y-3", className)}>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                    "bg-neutral-950/50 border-neutral-800 text-neutral-100 transition-all duration-200",
                    isFocused && "border-violet-500/70 ring-2 ring-violet-500/20 shadow-[0_0_12px_rgba(138,43,226,0.15)]"
                )}
            />

            {/* AI chip strip */}
            <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                    <SparklesIcon className="w-3 h-3 text-violet-400/70" />
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-violet-400/60">
                        AI Suggested
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {visibleSuggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                                if (isMulti) {
                                    const currentValues = value.split(",").map(v => v.trim()).filter(Boolean);
                                    if (!currentValues.includes(suggestion)) {
                                        const newValue = currentValues.length > 0 
                                            ? `${currentValues.join(", ")}, ${suggestion}` 
                                            : suggestion;
                                        onChange(newValue);
                                    }
                                } else {
                                    onChange(suggestion);
                                }
                            }}
                            className={cn(
                                "group relative px-3 py-1 rounded-full text-xs font-medium",
                                "bg-neutral-900/70 text-neutral-400 border border-neutral-800",
                                "transition-all duration-200 cursor-pointer select-none",
                                "hover:text-white hover:border-violet-500/70 hover:bg-violet-500/10",
                                "hover:shadow-[0_0_10px_rgba(138,43,226,0.25)] hover:scale-[1.04]",
                                "active:scale-[0.97]"
                            )}
                        >
                            {/* Subtle inner glow on hover */}
                            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-violet-600/10 to-violet-400/5 pointer-events-none" />
                            <span className="relative">{suggestion}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
