"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ShieldAlert,
    FileText,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

interface ExpiryAlert {
    id: string;
    type: "document" | "testScore";
    name: string;
    expiryDate: string;
    daysRemaining: number;
    status: "valid" | "expiring_soon" | "expired";
}

export function ExpiryAlerts() {
    const t = useTranslations("ExpiryAlerts");
    const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        async function fetchAlerts() {
            try {
                const res = await fetch("/api/expiry-alerts");
                if (res.ok) {
                    const data = await res.json();
                    setAlerts(data.alerts || []);
                }
            } catch (error) {
                console.error("Failed to fetch expiry alerts:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAlerts();
    }, []);

    const visibleAlerts = expanded ? alerts : alerts.slice(0, 3);
    const hasMore = alerts.length > 3;

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function getStatusBadge(status: ExpiryAlert["status"]) {
        switch (status) {
            case "expired":
                return (
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20 text-[10px] px-1.5 py-0">
                        {t("expired")}
                    </Badge>
                );
            case "expiring_soon":
                return (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 text-[10px] px-1.5 py-0">
                        {t("expiringSoon")}
                    </Badge>
                );
            case "valid":
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 text-[10px] px-1.5 py-0">
                        {t("valid")}
                    </Badge>
                );
        }
    }

    function getStatusIcon(status: ExpiryAlert["status"]) {
        switch (status) {
            case "expired":
                return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
            case "expiring_soon":
                return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
            case "valid":
                return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        }
    }

    function getDaysText(alert: ExpiryAlert) {
        if (alert.status === "expired") {
            return (
                <span className="text-red-400 text-xs">
                    {t("daysOverdue", { days: Math.abs(alert.daysRemaining) })}
                </span>
            );
        }
        if (alert.status === "expiring_soon") {
            return (
                <span className="text-amber-400 text-xs">
                    {t("daysRemaining", { days: alert.daysRemaining })}
                </span>
            );
        }
        return (
            <span className="text-neutral-500 text-xs">
                {t("daysRemaining", { days: alert.daysRemaining })}
            </span>
        );
    }

    if (isLoading) {
        return (
            <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-neutral-200 text-base flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        {t("title")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5 pointer-events-none" />
            <CardHeader className="pb-3">
                <CardTitle className="text-neutral-200 text-base flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    {t("title")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="flex items-center gap-3 py-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm">{t("allUpToDate")}</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visibleAlerts.map((alert) => (
                            <div
                                key={`${alert.type}-${alert.id}`}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-800/30 border border-neutral-800/50"
                            >
                                {alert.type === "document" ? (
                                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                ) : (
                                    <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-neutral-200 truncate">
                                            {alert.name}
                                        </p>
                                        {getStatusBadge(alert.status)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-neutral-500 text-xs">
                                            {formatDate(alert.expiryDate)}
                                        </span>
                                        <span className="text-neutral-700 text-xs">|</span>
                                        {getDaysText(alert)}
                                    </div>
                                </div>
                                {getStatusIcon(alert.status)}
                            </div>
                        ))}
                        {hasMore && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors pt-1 w-full justify-center"
                            >
                                {expanded ? (
                                    <>
                                        {t("showLess")}
                                        <ChevronUp className="w-3 h-3" />
                                    </>
                                ) : (
                                    <>
                                        {t("showAll")}
                                        <ChevronDown className="w-3 h-3" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
