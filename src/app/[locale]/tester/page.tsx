"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TestSandbox() {
    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex justify-center items-start">
            <div className="w-full max-w-2xl mt-12">
                <Card className="bg-neutral-900/50 backdrop-blur-xl border-neutral-800 shadow-2xl">
                    <CardHeader className="border-b border-neutral-800/50 pb-6">
                        <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                            Extension Sandbox
                        </CardTitle>
                        <CardDescription className="text-neutral-400 text-base mt-2">
                            This is a dummy university application form. It is completely disconnected from the database. Click your Accepta extension and hit "Auto-Fill" to safely test the DOM injection engine.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-medium text-neutral-300 ml-1">First Name</label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Enter first name"
                                    className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-medium text-neutral-300 ml-1">Last Name</label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Enter last name"
                                    className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium text-neutral-300 ml-1">Phone Number</label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="+1 234 567 8900"
                                className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="address" className="text-sm font-medium text-neutral-300 ml-1">Street Address</label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="123 University Ave"
                                className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="city" className="text-sm font-medium text-neutral-300 ml-1">City</label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="San Francisco"
                                    className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="zip" className="text-sm font-medium text-neutral-300 ml-1">ZIP / Postal</label>
                                <Input
                                    id="zip"
                                    name="zip"
                                    placeholder="94107"
                                    className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="country" className="text-sm font-medium text-neutral-300 ml-1">Country</label>
                                <Input
                                    id="country"
                                    name="country"
                                    placeholder="USA"
                                    className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Document Uploads Section */}
                        <div className="pt-6 border-t border-neutral-800/50 space-y-6">
                            <h3 className="text-lg font-bold text-neutral-200">Document Uploads</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 ml-1">Upload your current valid passport or identity card</label>
                                <Input type="file" className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 file:text-emerald-400 file:bg-emerald-950/50 file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-md hover:file:bg-emerald-900/50 transition-all outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 ml-1">Submit your motivation letter here</label>
                                <Input type="file" className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 file:text-emerald-400 file:bg-emerald-950/50 file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-md hover:file:bg-emerald-900/50 transition-all outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 ml-1">Attach your official university transcript</label>
                                <Input type="file" className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 file:text-emerald-400 file:bg-emerald-950/50 file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-md hover:file:bg-emerald-900/50 transition-all outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 ml-1">Provide your English Proficiency Certificate (IELTS/TOEFL)</label>
                                <Input type="file" className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:ring-emerald-500/50 focus:border-emerald-500/50 file:text-emerald-400 file:bg-emerald-950/50 file:border-0 file:mr-4 file:py-1 file:px-3 file:rounded-md hover:file:bg-emerald-900/50 transition-all outline-none" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-neutral-800/50">
                            <Button
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all font-semibold"
                                onClick={(e) => { e.preventDefault(); alert("Form submitted safely!"); }}
                            >
                                Submit Application
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
