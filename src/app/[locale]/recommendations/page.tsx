"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    UserPlus,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Copy,
    ExternalLink,
    Loader2,
    PencilIcon,
    TrashIcon,
    ChevronDown,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Application {
    id: string;
    universityName: string;
    programName: string | null;
    major: string | null;
}

interface Recommendation {
    id: string;
    recommenderName: string;
    recommenderEmail: string | null;
    recommenderTitle: string | null;
    relationship: string;
    status: string;
    applicationId: string | null;
    application: Application | null;
    dueDate: string | null;
    notes: string | null;
    askedDate: string | null;
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ReminderEmail {
    subject: string;
    body: string;
}

const STATUS_OPTIONS = ["NOT_ASKED", "ASKED", "CONFIRMED", "SUBMITTED", "DECLINED"] as const;
const RELATIONSHIP_OPTIONS = ["Professor", "Supervisor", "Mentor", "Colleague", "Other"] as const;

const STATUS_COLORS: Record<string, string> = {
    NOT_ASKED: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
    ASKED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    CONFIRMED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    SUBMITTED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    DECLINED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_DOT_COLORS: Record<string, string> = {
    NOT_ASKED: "bg-neutral-400",
    ASKED: "bg-blue-400",
    CONFIRMED: "bg-amber-400",
    SUBMITTED: "bg-emerald-400",
    DECLINED: "bg-red-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
    const t = useTranslations("Recommendations");

    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    // Add/Edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        recommenderName: "",
        recommenderEmail: "",
        recommenderTitle: "",
        relationship: "Professor",
        applicationId: "",
        dueDate: "",
        notes: "",
    });
    const [saving, setSaving] = useState(false);

    // Status dropdown
    const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Reminder modal
    const [reminderOpen, setReminderOpen] = useState(false);
    const [reminderRecId, setReminderRecId] = useState<string | null>(null);
    const [reminderTone, setReminderTone] = useState<"polite" | "urgent">("polite");
    const [reminderEmail, setReminderEmail] = useState<ReminderEmail | null>(null);
    const [reminderLoading, setReminderLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // ── Fetch data ────────────────────────────────────────────────────────────

    const fetchRecommendations = useCallback(async () => {
        try {
            const res = await fetch("/api/recommendations");
            if (res.ok) {
                const data = await res.json();
                setRecommendations(data);
            }
        } catch (error) {
            console.error("Failed to fetch recommendations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchApplications = useCallback(async () => {
        try {
            const res = await fetch("/api/applications");
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            }
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        }
    }, []);

    useEffect(() => {
        fetchRecommendations();
        fetchApplications();
    }, [fetchRecommendations, fetchApplications]);

    // ── Stats ─────────────────────────────────────────────────────────────────

    const stats = {
        asked: recommendations.filter((r) => r.status === "ASKED").length,
        confirmed: recommendations.filter((r) => r.status === "CONFIRMED").length,
        submitted: recommendations.filter((r) => r.status === "SUBMITTED").length,
        declined: recommendations.filter((r) => r.status === "DECLINED").length,
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const openAddDialog = () => {
        setEditingId(null);
        setFormData({
            recommenderName: "",
            recommenderEmail: "",
            recommenderTitle: "",
            relationship: "Professor",
            applicationId: "",
            dueDate: "",
            notes: "",
        });
        setDialogOpen(true);
    };

    const openEditDialog = (rec: Recommendation) => {
        setEditingId(rec.id);
        setFormData({
            recommenderName: rec.recommenderName,
            recommenderEmail: rec.recommenderEmail || "",
            recommenderTitle: rec.recommenderTitle || "",
            relationship: rec.relationship,
            applicationId: rec.applicationId || "",
            dueDate: rec.dueDate ? rec.dueDate.split("T")[0] : "",
            notes: rec.notes || "",
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.recommenderName.trim()) {
            toast.error("Recommender name is required");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                recommenderName: formData.recommenderName,
                recommenderEmail: formData.recommenderEmail || null,
                recommenderTitle: formData.recommenderTitle || null,
                relationship: formData.relationship,
                applicationId: formData.applicationId || null,
                dueDate: formData.dueDate || null,
                notes: formData.notes || null,
            };

            let res;
            if (editingId) {
                res = await fetch(`/api/recommendations/${editingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/recommendations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                toast.success(editingId ? "Recommender updated" : "Recommender added");
                setDialogOpen(false);
                fetchRecommendations();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save");
            }
        } catch {
            toast.error("Failed to save recommender");
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (recId: string, newStatus: string) => {
        setOpenStatusDropdown(null);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: any = { status: newStatus };
            if (newStatus === "ASKED") {
                payload.askedDate = new Date().toISOString();
            }
            const res = await fetch(`/api/recommendations/${recId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                fetchRecommendations();
            }
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/recommendations/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Recommender deleted");
                setDeleteId(null);
                fetchRecommendations();
            }
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleGenerateReminder = async (recId: string, tone: "polite" | "urgent") => {
        setReminderLoading(true);
        setReminderEmail(null);
        setCopied(false);
        try {
            const res = await fetch(`/api/recommendations/${recId}/reminder`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tone }),
            });
            if (res.ok) {
                const data = await res.json();
                setReminderEmail(data);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to generate reminder");
            }
        } catch {
            toast.error("Failed to generate reminder");
        } finally {
            setReminderLoading(false);
        }
    };

    const openReminderModal = (recId: string) => {
        setReminderRecId(recId);
        setReminderTone("polite");
        setReminderEmail(null);
        setCopied(false);
        setReminderOpen(true);
        handleGenerateReminder(recId, "polite");
    };

    const handleToneChange = (tone: "polite" | "urgent") => {
        setReminderTone(tone);
        if (reminderRecId) {
            handleGenerateReminder(reminderRecId, tone);
        }
    };

    const handleCopyEmail = async () => {
        if (reminderEmail) {
            await navigator.clipboard.writeText(reminderEmail.body);
            setCopied(true);
            toast.success(t("copied"));
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getMailtoLink = () => {
        if (!reminderEmail || !reminderRecId) return "#";
        const rec = recommendations.find((r) => r.id === reminderRecId);
        const email = rec?.recommenderEmail || "";
        const subject = encodeURIComponent(reminderEmail.subject);
        const body = encodeURIComponent(reminderEmail.body);
        return `mailto:${email}?subject=${subject}&body=${body}`;
    };

    // ── Due date helpers ──────────────────────────────────────────────────────

    const getDueDateInfo = (dueDate: string | null) => {
        if (!dueDate) return { text: t("noDueDate"), color: "text-neutral-500" };
        const days = differenceInDays(new Date(dueDate), new Date());
        if (days < 0) return { text: t("overdue"), color: "text-red-400" };
        if (days === 0) return { text: "Today!", color: "text-amber-400" };
        return { text: t("daysLeft", { days }), color: "text-neutral-300" };
    };

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
            NOT_ASKED: t("statusNotAsked"),
            ASKED: t("statusAsked"),
            CONFIRMED: t("statusConfirmed"),
            SUBMITTED: t("statusSubmitted"),
            DECLINED: t("statusDeclined"),
        };
        return map[status] || status;
    };

    const getRelationshipLabel = (rel: string) => {
        const map: Record<string, string> = {
            Professor: t("professor"),
            Supervisor: t("supervisor"),
            Mentor: t("mentor"),
            Colleague: t("colleague"),
            Other: t("other"),
        };
        return map[rel] || rel;
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {t("pageTitle")}
                    </h1>
                    <p className="text-neutral-400 mt-1 text-sm sm:text-base">
                        {t("pageSubtitle")}
                    </p>
                </div>
                <Button
                    onClick={openAddDialog}
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20 shrink-0"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("addRecommender")}
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: t("asked"), count: stats.asked, status: "ASKED" },
                    { label: t("confirmed"), count: stats.confirmed, status: "CONFIRMED" },
                    { label: t("submitted"), count: stats.submitted, status: "SUBMITTED" },
                    { label: t("declined"), count: stats.declined, status: "DECLINED" },
                ].map((s) => (
                    <Card key={s.status} className="bg-neutral-900/50 border-neutral-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${STATUS_DOT_COLORS[s.status]}`} />
                            <div>
                                <p className="text-2xl font-bold text-white">{s.count}</p>
                                <p className="text-xs text-neutral-400">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recommendations Grid */}
            {recommendations.length === 0 ? (
                <Card className="bg-neutral-900/50 border-neutral-800">
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-neutral-600 mb-4" />
                        <p className="text-neutral-400">{t("noRecommenders")}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((rec) => {
                        const dueDateInfo = getDueDateInfo(rec.dueDate);
                        return (
                            <Card
                                key={rec.id}
                                className="bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 transition-colors"
                            >
                                <CardContent className="p-5 space-y-4">
                                    {/* Name + Title */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-semibold text-white truncate">
                                                {rec.recommenderName}
                                            </h3>
                                            {rec.recommenderTitle && (
                                                <p className="text-sm text-neutral-400 truncate">
                                                    {rec.recommenderTitle}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 text-xs ${STATUS_COLORS[rec.status]}`}
                                        >
                                            {getStatusLabel(rec.status)}
                                        </Badge>
                                    </div>

                                    {/* Relationship badge */}
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="bg-neutral-800/50 text-neutral-300 border-neutral-700 text-xs">
                                            {getRelationshipLabel(rec.relationship)}
                                        </Badge>
                                        {rec.application && (
                                            <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/30 text-xs truncate max-w-[180px]">
                                                {rec.application.universityName}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Due date */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-neutral-500" />
                                        {rec.dueDate ? (
                                            <span className={dueDateInfo.color}>
                                                {format(new Date(rec.dueDate), "MMM d, yyyy")} ({dueDateInfo.text})
                                            </span>
                                        ) : (
                                            <span className="text-neutral-500">{t("noDueDate")}</span>
                                        )}
                                    </div>

                                    {/* Notes preview */}
                                    {rec.notes && (
                                        <p className="text-sm text-neutral-500 line-clamp-2">
                                            {rec.notes}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                                        {/* Status Dropdown */}
                                        <div className="relative">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setOpenStatusDropdown(
                                                        openStatusDropdown === rec.id ? null : rec.id
                                                    )
                                                }
                                                className="text-neutral-400 hover:text-white text-xs h-8 px-2"
                                            >
                                                <ChevronDown className="h-3 w-3 mr-1" />
                                                Status
                                            </Button>
                                            {openStatusDropdown === rec.id && (
                                                <div className="absolute z-50 bottom-full mb-1 left-0 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 min-w-[140px]">
                                                    {STATUS_OPTIONS.map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleStatusChange(rec.id, s)}
                                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-700 transition-colors flex items-center gap-2 ${
                                                                rec.status === s ? "text-white font-medium" : "text-neutral-400"
                                                            }`}
                                                        >
                                                            <div className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[s]}`} />
                                                            {getStatusLabel(s)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Generate Reminder */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openReminderModal(rec.id)}
                                            className="text-neutral-400 hover:text-white text-xs h-8 px-2"
                                        >
                                            <Mail className="h-3 w-3 mr-1" />
                                            {t("generateReminder")}
                                        </Button>

                                        <div className="flex-1" />

                                        {/* Edit */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(rec)}
                                            className="text-neutral-400 hover:text-white h-8 w-8 p-0"
                                        >
                                            <PencilIcon className="h-3.5 w-3.5" />
                                        </Button>

                                        {/* Delete */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteId(rec.id)}
                                            className="text-neutral-400 hover:text-red-400 h-8 w-8 p-0"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Add/Edit Dialog ─────────────────────────────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? t("editRecommender") : t("addRecommender")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {/* Name */}
                        <div>
                            <label className="text-sm text-neutral-400 mb-1 block">
                                {t("recommenderName")} *
                            </label>
                            <Input
                                value={formData.recommenderName}
                                onChange={(e) =>
                                    setFormData({ ...formData, recommenderName: e.target.value })
                                }
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-sm text-neutral-400 mb-1 block">
                                {t("recommenderEmail")}
                            </label>
                            <Input
                                type="email"
                                value={formData.recommenderEmail}
                                onChange={(e) =>
                                    setFormData({ ...formData, recommenderEmail: e.target.value })
                                }
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-sm text-neutral-400 mb-1 block">
                                {t("recommenderTitle")}
                            </label>
                            <Input
                                value={formData.recommenderTitle}
                                onChange={(e) =>
                                    setFormData({ ...formData, recommenderTitle: e.target.value })
                                }
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>

                        {/* Relationship */}
                        <div>
                            <label className="text-sm text-neutral-400 mb-1 block">
                                {t("relationship")}
                            </label>
                            <select
                                value={formData.relationship}
                                onChange={(e) =>
                                    setFormData({ ...formData, relationship: e.target.value })
                                }
                                className="w-full rounded-md bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                {RELATIONSHIP_OPTIONS.map((rel) => (
                                    <option key={rel} value={rel}>
                                        {getRelationshipLabel(rel)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="text-sm text-neutral-400 mb-1 block">
                                {t("dueDate")}
                            </label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, dueDate: e.target.value })
                                }
                                className="bg-neutral-800 border-neutral-700 text-white"
                            />
                        </div>

                        {/* Linked Application */}
                        <div>
                            <label className="text-sm text-neutral-400 mb-1 block">
                                {t("linkedApplication")}
                            </label>
                            <select
                                value={formData.applicationId}
                                onChange={(e) =>
                                    setFormData({ ...formData, applicationId: e.target.value })
                                }
                                className="w-full rounded-md bg-neutral-800 border border-neutral-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="">{t("noApplication")}</option>
                                {applications.map((app) => (
                                    <option key={app.id} value={app.id}>
                                        {app.universityName}
                                        {app.programName ? ` - ${app.programName}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-sm text-neutral-400 mb-1 block">
                                {t("notes")}
                            </label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                rows={3}
                                className="bg-neutral-800 border-neutral-700 text-white resize-none"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setDialogOpen(false)}
                                className="text-neutral-400 hover:text-white"
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t("save")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ───────────────────────────────────── */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t("delete")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-neutral-400 text-sm mt-2">{t("confirmDelete")}</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteId(null)}
                            className="text-neutral-400 hover:text-white"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={() => deleteId && handleDelete(deleteId)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            {t("delete")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Reminder Modal ───────────────────────────────────────────────── */}
            <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t("reminderGenerated")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {/* Tone Toggle */}
                        <div className="flex gap-2">
                            <Button
                                variant={reminderTone === "polite" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleToneChange("polite")}
                                className={
                                    reminderTone === "polite"
                                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                                        : "text-neutral-400 hover:text-white"
                                }
                            >
                                {t("polite")}
                            </Button>
                            <Button
                                variant={reminderTone === "urgent" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleToneChange("urgent")}
                                className={
                                    reminderTone === "urgent"
                                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                                        : "text-neutral-400 hover:text-white"
                                }
                            >
                                {t("urgent")}
                            </Button>
                        </div>

                        {/* Email Content */}
                        {reminderLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                            </div>
                        ) : reminderEmail ? (
                            <div className="space-y-3">
                                <div className="bg-neutral-800 rounded-lg p-4">
                                    <p className="text-xs text-neutral-500 mb-1">Subject</p>
                                    <p className="text-sm text-white font-medium">
                                        {reminderEmail.subject}
                                    </p>
                                </div>
                                <div className="bg-neutral-800 rounded-lg p-4">
                                    <p className="text-xs text-neutral-500 mb-2">Body</p>
                                    <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                        {reminderEmail.body}
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {/* Action Buttons */}
                        {reminderEmail && (
                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={handleCopyEmail}
                                    className="bg-neutral-800 hover:bg-neutral-700 text-white flex-1"
                                >
                                    {copied ? (
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
                                    ) : (
                                        <Copy className="h-4 w-4 mr-2" />
                                    )}
                                    {copied ? t("copied") : t("copyEmail")}
                                </Button>
                                <a
                                    href={getMailtoLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <Button className="bg-violet-600 hover:bg-violet-700 text-white w-full">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        {t("openInEmail")}
                                    </Button>
                                </a>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
