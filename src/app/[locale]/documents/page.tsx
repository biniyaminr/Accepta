"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileIcon, UploadCloudIcon, FolderIcon, MoreVerticalIcon, PencilIcon, TrashIcon, LanguagesIcon, AwardIcon, BriefcaseIcon } from "lucide-react";
import { toast } from "sonner";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const [name, setName] = useState("");
    const [type, setType] = useState("RESUME");
    const [applicationId, setApplicationId] = useState("none");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { startUpload, isUploading } = useUploadThing("documentUploader");

    // Edit Form State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editDocId, setEditDocId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editType, setEditType] = useState("RESUME");
    const [editAppId, setEditAppId] = useState("none");
    const [isEditing, setIsEditing] = useState(false);

    // Delete State
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [docsRes, appsRes] = await Promise.all([
                fetch('/api/documents'),
                fetch('/api/applications')
            ]);

            if (docsRes.ok) setDocuments(await docsRes.json());
            if (appsRes.ok) setApplications(await appsRes.json());
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) {
            toast.error("Please select a file to upload.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await startUpload([selectedFile]);
            if (!res || res.length === 0) {
                toast.error("Upload failed.");
                return;
            }

            const saveRes = await fetch('/api/documents', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, type, applicationId, fileUrl: res[0].url })
            });

            if (!saveRes.ok) throw new Error("Database save failed");

            toast.success("Document saved to vault!");
            setIsUploadOpen(false);
            setName("");
            setType("RESUME");
            setApplicationId("none");
            setSelectedFile(null);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload and save document.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!documentToDelete) return;
        try {
            const res = await fetch(`/api/documents/${documentToDelete}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Document deleted");
            setDocumentToDelete(null);
            fetchData();
        } catch (error) {
            toast.error("Network error or delete failed");
        }
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDocId) return;
        setIsEditing(true);
        try {
            const res = await fetch(`/api/documents/${editDocId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    type: editType,
                    applicationId: editAppId === "none" ? null : editAppId
                })
            });
            if (!res.ok) throw new Error("Failed to update");
            toast.success("Document updated successfully!");
            setIsEditOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Network error or update failed");
        } finally {
            setIsEditing(false);
        }
    };

    const openEditModal = (doc: any) => {
        setEditDocId(doc.id);
        setEditName(doc.name);
        setEditType(doc.type);
        setEditAppId(doc.applicationId || "none");
        setIsEditOpen(true);
    };

    // Group documents by Application (or 'General' if no application)
    const groupedDocs = documents.reduce((acc, doc) => {
        const key = doc.application ? doc.application.universityName : "General Profile";
        if (!acc[key]) acc[key] = [];
        acc[key].push(doc);
        return acc;
    }, {});

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-6xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">Document Vault</h2>
                    <p className="text-neutral-400 text-lg">Manage all your transcripts, essays, and IDs safely across applications.</p>
                </div>

                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-lg shadow-violet-950/40">
                            <UploadCloudIcon className="w-4 h-4 mr-2" />
                            Upload Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-neutral-100">
                        <DialogHeader>
                            <DialogTitle>Secure File Upload</DialogTitle>
                            <DialogDescription className="text-neutral-400">
                                Simulated upload. Attach a file to an application folder or your master profile.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-neutral-300">Document Name</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Biniyam_Dereje_CV.pdf" className="bg-neutral-950/50 border-neutral-800 text-neutral-200" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-neutral-300">Document Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="bg-neutral-950/50 border-neutral-800 text-neutral-200">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                                        <SelectItem value="RESUME">Resume / CV</SelectItem>
                                        <SelectItem value="TRANSCRIPT">Academic Transcript</SelectItem>
                                        <SelectItem value="PASSPORT">Passport / ID</SelectItem>
                                        <SelectItem value="ENGLISH_PROFICIENCY">English Proficiency (IELTS/TOEFL)</SelectItem>
                                        <SelectItem value="ESSAY">Personal Essay</SelectItem>
                                        <SelectItem value="RECOMMENDATION">Letter of Recommendation</SelectItem>
                                        <SelectItem value="CERTIFICATE">Certificate / Award</SelectItem>
                                        <SelectItem value="PORTFOLIO">Portfolio / Work</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="appLink" className="text-neutral-300">Link to Application Vault (Optional)</Label>
                                <Select value={applicationId} onValueChange={setApplicationId}>
                                    <SelectTrigger className="bg-neutral-950/50 border-neutral-800 text-neutral-200">
                                        <SelectValue placeholder="General Profile" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                                        <SelectItem value="none">-- General Profile (Applies everywhere) --</SelectItem>
                                        {applications.map(app => (
                                            <SelectItem key={app.id} value={app.id}>{app.universityName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-neutral-300 block mb-2">File Attachment</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 file:text-blue-500 file:font-semibold file:border-0 file:bg-transparent file:mr-4 hover:file:bg-transparent cursor-pointer"
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" onClick={handleSave} disabled={isSubmitting || isUploading} className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                                    {(isSubmitting || isUploading) ? "Uploading & Saving..." : "Save Document"}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-neutral-100">
                        <DialogHeader>
                            <DialogTitle>Edit Document Details</DialogTitle>
                            <DialogDescription className="text-neutral-400">
                                Update the name or category of your vault document.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editName" className="text-neutral-300">Document Name</Label>
                                <Input id="editName" value={editName} onChange={e => setEditName(e.target.value)} required className="bg-neutral-950/50 border-neutral-800 text-neutral-200" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editType" className="text-neutral-300">Document Type</Label>
                                <Select value={editType} onValueChange={setEditType}>
                                    <SelectTrigger className="bg-neutral-950/50 border-neutral-800 text-neutral-200">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                                        <SelectItem value="RESUME">Resume / CV</SelectItem>
                                        <SelectItem value="TRANSCRIPT">Academic Transcript</SelectItem>
                                        <SelectItem value="PASSPORT">Passport / ID</SelectItem>
                                        <SelectItem value="ENGLISH_PROFICIENCY">English Proficiency (IELTS/TOEFL)</SelectItem>
                                        <SelectItem value="ESSAY">Personal Essay</SelectItem>
                                        <SelectItem value="RECOMMENDATION">Letter of Recommendation</SelectItem>
                                        <SelectItem value="CERTIFICATE">Certificate / Award</SelectItem>
                                        <SelectItem value="PORTFOLIO">Portfolio / Work</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editAppLink" className="text-neutral-300">Link to Application Vault (Optional)</Label>
                                <Select value={editAppId} onValueChange={setEditAppId}>
                                    <SelectTrigger className="bg-neutral-950/50 border-neutral-800 text-neutral-200">
                                        <SelectValue placeholder="General Profile" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                                        <SelectItem value="none">-- General Profile (Applies everywhere) --</SelectItem>
                                        {applications.map(app => (
                                            <SelectItem key={app.id} value={app.id}>{app.universityName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isEditing} className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                                    {isEditing ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-t-blue-500 animate-spin"></div></div>
            ) : Object.keys(groupedDocs).length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-800">
                    <FolderIcon className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-300 mb-1">Your vault is empty</h3>
                    <p className="text-neutral-500 text-sm">Upload essential documents like your Passport or Transcripts here.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Render General Profile first, then Application Folders */}
                    {["General Profile", ...Object.keys(groupedDocs).filter(k => k !== "General Profile")].map(folderName => {
                        if (!groupedDocs[folderName]) return null;

                        return (
                            <div key={folderName} className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                                    <FolderIcon className={`w-5 h-5 ${folderName === "General Profile" ? "text-blue-400" : "text-amber-400"}`} />
                                    <h3 className="text-lg font-semibold text-neutral-200">{folderName} Vault</h3>
                                    <Badge variant="outline" className="ml-2 bg-neutral-900/50 text-neutral-400 border-neutral-800">{groupedDocs[folderName].length} items</Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {groupedDocs[folderName].map((doc: any) => (
                                        <Card key={doc.id} onClick={() => window.open(doc.fileUrl, '_blank')} className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-sm hover:border-blue-500/30 transition-colors group cursor-pointer">
                                            <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                                                <div className={`p-2 rounded-lg ${doc.type === 'RESUME' ? 'bg-indigo-500/10 text-indigo-400' :
                                                    doc.type === 'TRANSCRIPT' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        doc.type === 'PASSPORT' ? 'bg-amber-500/10 text-amber-400' :
                                                            doc.type === 'ENGLISH_PROFICIENCY' ? 'bg-purple-500/10 text-purple-400' :
                                                                doc.type === 'CERTIFICATE' ? 'bg-rose-500/10 text-rose-400' :
                                                                    doc.type === 'PORTFOLIO' ? 'bg-cyan-500/10 text-cyan-400' :
                                                                        'bg-blue-500/10 text-blue-400'
                                                    }`}>
                                                    {doc.type === 'ENGLISH_PROFICIENCY' ? <LanguagesIcon className="w-6 h-6" /> :
                                                        doc.type === 'CERTIFICATE' ? <AwardIcon className="w-6 h-6" /> :
                                                            doc.type === 'PORTFOLIO' ? <BriefcaseIcon className="w-6 h-6" /> :
                                                                <FileIcon className="w-6 h-6" />}
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVerticalIcon className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-neutral-200">
                                                            <DropdownMenuItem onClick={() => openEditModal(doc)} className="hover:bg-neutral-800 cursor-pointer">
                                                                <PencilIcon className="w-4 h-4 mr-2" /> Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDocumentToDelete(doc.id)} className="hover:bg-red-500/20 text-red-500 focus:bg-red-500/20 focus:text-red-500 cursor-pointer">
                                                                <TrashIcon className="w-4 h-4 mr-2" /> Delete Document
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="px-4 pb-2">
                                                <CardTitle className="text-sm font-medium text-neutral-200 truncate" title={doc.name}>{doc.name}</CardTitle>
                                                <CardDescription className="text-xs text-neutral-500 mt-1">{doc.type}</CardDescription>
                                            </CardContent>
                                            <CardFooter className="px-4 pb-4 pt-2">
                                                <p className="text-[10px] text-neutral-600 uppercase tracking-wider">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
                <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-400">
                            Are you absolutely sure? This action cannot be undone. This will permanently delete the file from your vault.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-neutral-700 hover:bg-neutral-800 text-neutral-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Document
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
