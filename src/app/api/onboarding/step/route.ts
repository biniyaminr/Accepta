import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const step = searchParams.get("step");

        if (!step) {
            return NextResponse.json({ error: "Step parameter is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId },
            include: {
                educations: { take: 1, orderBy: { updatedAt: 'desc' } },
                extracurriculars: true,
                documents: true,
            },
        });

        if (!user) {
            return NextResponse.json({ message: "No profile found" }, { status: 404 });
        }

        let data = {};
        switch (parseInt(step)) {
            case 1:
                data = {
                    fullName: user.fullName || "",
                    dob: user.dob ? user.dob.toISOString().split('T')[0] : "",
                    citizenship: user.citizenship || "",
                };
                break;
            case 2:
                const education = user.educations[0] || {};
                data = {
                    institutionName: education.institutionName || "",
                    major: education.major || "",
                    city: education.city || "",
                    country: education.country || "",
                    gpa: education.gpa ? education.gpa.toString() : "",
                    startDate: education.startDate ? education.startDate.toISOString().split('T')[0] : "",
                    gradDate: education.gradDate ? education.gradDate.toISOString().split('T')[0] : "",
                };
                break;
            case 3:
                data = {
                    experiences: user.extracurriculars.map(e => ({
                        id: e.id,
                        role: e.role,
                        organization: e.organization,
                        description: e.description,
                        startDate: e.startDate ? e.startDate.toISOString().split('T')[0] : "",
                        endDate: e.endDate ? e.endDate.toISOString().split('T')[0] : "",
                    })),
                };
                break;
            case 4:
                data = {
                    documents: user.documents.map(d => ({
                        id: d.id,
                        name: d.name,
                        type: d.type,
                        fileUrl: d.fileUrl,
                    })),
                };
                break;
            default:
                return NextResponse.json({ error: "Invalid step" }, { status: 400 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error fetching onboarding step:", error);
        return NextResponse.json({ error: "Failed to fetch step data" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        const clerkUser = await currentUser();
        if (!clerkId || !clerkUser) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress;

        const body = await request.json();
        const { step, data } = body;

        if (!step || !data) {
            return NextResponse.json({ error: "Step and data are required" }, { status: 400 });
        }

        const user = await prisma.user.upsert({
            where: { userId: clerkId },
            update: {}, 
            create: {
                userId: clerkId,
                fullName: data.fullName || clerkUser.username || clerkUser.firstName || "TBD",
                email: email || "TBD",
            },
        });

        switch (parseInt(step)) {
            case 1:
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        fullName: data.fullName,
                        dob: data.dob ? new Date(data.dob) : null,
                        citizenship: data.citizenship,
                    },
                });
                break;
            case 2:
                // For simplicity, we manage one primary education record in the wizard
                const existingEdu = await prisma.education.findFirst({
                    where: { userId: user.id },
                });

                if (existingEdu) {
                    await prisma.education.update({
                        where: { id: existingEdu.id },
                        data: {
                            institutionName: data.institutionName,
                            major: data.major,
                            city: data.city,
                            country: data.country,
                            gpa: data.gpa ? parseFloat(data.gpa) : null,
                            startDate: data.startDate ? new Date(data.startDate) : null,
                            gradDate: data.gradDate ? new Date(data.gradDate) : null,
                        },
                    });
                } else {
                    await prisma.education.create({
                        data: {
                            institutionName: data.institutionName,
                            major: data.major,
                            city: data.city,
                            country: data.country,
                            gpa: data.gpa ? parseFloat(data.gpa) : null,
                            startDate: data.startDate ? new Date(data.startDate) : null,
                            gradDate: data.gradDate ? new Date(data.gradDate) : null,
                            userId: user.id,
                        },
                    });
                }
                break;
            case 3:
                // Handle experiences (multiple)
                // In a real app we might diff them, here we'll just handle them simply
                // If the user sends a list, we can clear and recreate or upsert
                if (data.experiences && Array.isArray(data.experiences)) {
                    await prisma.extracurricular.deleteMany({ where: { userId: user.id } });
                    for (const exp of data.experiences) {
                        await prisma.extracurricular.create({
                            data: {
                                role: exp.role,
                                organization: exp.organization,
                                description: exp.description,
                                startDate: exp.startDate ? new Date(exp.startDate) : null,
                                endDate: exp.endDate ? new Date(exp.endDate) : null,
                                userId: user.id,
                            },
                        });
                    }
                }
                break;
            case 4:
                // Documents are handled via uploadthing mostly, but we can save links here if needed
                if (data.documents && Array.isArray(data.documents)) {
                    for (const doc of data.documents) {
                        const existingDoc = await prisma.document.findFirst({
                            where: { userId: user.id, type: doc.type }
                        });
                        
                        if (existingDoc) {
                            await prisma.document.update({
                                where: { id: existingDoc.id },
                                data: {
                                    name: doc.name,
                                    fileUrl: doc.url || doc.fileUrl,
                                }
                            });
                        } else {
                            await prisma.document.create({
                                data: {
                                    name: doc.name,
                                    type: doc.type,
                                    fileUrl: doc.url || doc.fileUrl,
                                    userId: user.id,
                                },
                            });
                        }
                    }
                }
                break;
            default:
                return NextResponse.json({ error: "Invalid step" }, { status: 400 });
        }

        return NextResponse.json({ message: `Step ${step} saved successfully` }, { status: 200 });
    } catch (error) {
        console.error("Error saving onboarding step:", error);
        return NextResponse.json({ error: "Failed to save step data" }, { status: 500 });
    }
}
