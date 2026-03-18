"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SaveIcon, UserCircleIcon, GraduationCapIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";


const profileSchema = z.object({
    fullName: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    phone: z.string().optional(),
    address: z.string().optional(),
    dob: z.string().optional(),
    citizenship: z.string().optional(),
    zipCode: z.string().optional(),
    institutionName: z.string().optional(),
    major: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    gpa: z.string().optional(),
    startDate: z.string().optional(),
    gradDate: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const { user, isLoaded } = useUser();
    const fullName = user?.fullName || user?.firstName || '';

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            address: "",
            dob: "",
            citizenship: "",
            zipCode: "",
            institutionName: "",
            major: "",
            city: "",
            country: "",
            gpa: "",
            startDate: "",
            gradDate: "",
        },
    });

    useEffect(() => {
        if (isLoaded && user) {
            const clerkFullName = user.fullName || user.firstName || "";
            const clerkEmail = user.primaryEmailAddress?.emailAddress || "";

            form.setValue("fullName", clerkFullName);
            form.setValue("email", clerkEmail); 
        }
    }, [isLoaded, user, form]);

    useEffect(() => {
        if (!isLoaded) return;

        async function loadProfile() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    // Format dates for input type="date"
                    const formatDate = (ds: string | null) => ds ? new Date(ds).toISOString().split('T')[0] : "";

                    const education = data.educations?.[0] || {};

                    form.reset({
                        fullName: data.fullName || fullName,
                        email: data.email || user?.primaryEmailAddress?.emailAddress || "",
                        phone: data.phone || "",
                        address: data.address || "",
                        dob: formatDate(data.dob),
                        citizenship: data.citizenship || "",
                        zipCode: data.zipCode || "",
                        institutionName: education.institutionName || "",
                        major: education.major || "",
                        city: education.city || "",
                        country: education.country || "",
                        gpa: education.gpa ? education.gpa.toString() : "",
                        startDate: formatDate(education.startDate),
                        gradDate: formatDate(education.gradDate),
                    });
                }
            } catch (_error) {
                console.error("Failed to load profile:");
            }
        }
        loadProfile();
    }, [form, isLoaded, fullName, user]);

    async function onSubmit(data: ProfileFormValues) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to save profile");
            }

            toast.success("Profile updated", {
                description: "Your master profile has been saved successfully.",
            });
        } catch (error) {
            toast.error("Error", {
                description: "There was a problem saving your profile.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-400">Master Profile</h2>
                <p className="text-neutral-400 text-lg">Manage your core information used across all university applications.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    <Card className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <UserCircleIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-neutral-200">Personal Information</CardTitle>
                                <CardDescription className="text-neutral-400">Your foundational details.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Full Name</FormLabel>
                                        <FormControl>
                                            <Input disabled={!isLoaded} placeholder="John Doe" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-blue-500/20 disabled:opacity-50" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Email Address</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="john@example.com" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-blue-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Phone Number</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="+1 (555) 000-0000" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-blue-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dob"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Date of Birth</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-blue-500/20 [color-scheme:dark]" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-neutral-300">Home Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main St, Springfield, IL 62701" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-blue-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="zipCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Zip / Postal Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 10001, SW1A 1AA" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-blue-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="citizenship"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-neutral-300">Citizenship / Nationality</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. United States, Canada, Dual (UK/US)" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-blue-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <GraduationCapIcon className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-neutral-200">Education History</CardTitle>
                                <CardDescription className="text-neutral-400">Your most recent academic institution.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="institutionName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Institution Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Springfield High School" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-emerald-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="major"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Course / Major</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Telecommunications Engineering" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-emerald-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Springfield" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-emerald-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Country</FormLabel>
                                        <FormControl>
                                            <Input placeholder="United States" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-emerald-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gpa"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Cumulative GPA</FormLabel>
                                        <FormControl>
                                            <Input placeholder="4.0" type="number" step="0.01" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-emerald-500/20" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-300">Start Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-emerald-500/20 [color-scheme:dark]" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gradDate"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-neutral-300">Anticipated Graduation Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-emerald-500/20 [color-scheme:dark]" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-neutral-500">When you expect to complete your studies.</FormDescription>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 pb-10">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-neutral-200 text-neutral-900 hover:bg-white hover:scale-[1.02] transition-all shadow-lg shadow-neutral-200/10 px-8"
                        >
                            {isLoading ? (
                                "Saving..."
                            ) : (
                                <>
                                    <SaveIcon className="mr-2 h-4 w-4" />
                                    Save Profile
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
