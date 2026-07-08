import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) {
            return NextResponse.json({
                totalApplications: 0,
                byStatus: { NOT_STARTED: 0, IN_PROGRESS: 0, READY: 0, SUBMITTED: 0 },
                submittedCount: 0,
                avgMatchScore: 0,
                deadlinesByMonth: [],
                countriesApplied: [],
                recentActivity: [],
                documentsUploaded: 0,
                completionRate: 0,
            }, { status: 200 });
        }

        const applications = await prisma.application.findMany({
            where: { userId: user.id },
            include: { documents: true },
            orderBy: { updatedAt: "desc" },
        });

        const totalApplications = applications.length;

        // By status
        const byStatus: Record<string, number> = { NOT_STARTED: 0, IN_PROGRESS: 0, READY: 0, SUBMITTED: 0 };
        for (const app of applications) {
            if (byStatus[app.status] !== undefined) {
                byStatus[app.status]++;
            }
        }
        const submittedCount = byStatus.SUBMITTED;

        // Completion rate
        const completionRate = totalApplications > 0
            ? Math.round((submittedCount / totalApplications) * 100)
            : 0;

        // Average match score
        const scores = applications
            .map((a) => a.matchScore)
            .filter((s): s is number => s !== null && s !== undefined);
        const avgMatchScore = scores.length > 0
            ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
            : 0;

        // Deadlines by month
        const monthMap: Record<string, number> = {};
        for (const app of applications) {
            if (app.deadline) {
                // deadline is stored as a string, try to parse it
                const date = new Date(app.deadline);
                if (!isNaN(date.getTime())) {
                    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    monthMap[key] = (monthMap[key] || 0) + 1;
                }
            }
        }
        const deadlinesByMonth = Object.entries(monthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));

        // Countries applied - extract from universityName heuristic or use a known pattern
        const countryMap: Record<string, number> = {};
        for (const app of applications) {
            // Try to extract country from university name
            const country = extractCountry(app.universityName);
            if (country) {
                countryMap[country] = (countryMap[country] || 0) + 1;
            }
        }
        const countriesApplied = Object.entries(countryMap)
            .sort(([, a], [, b]) => b - a)
            .map(([country, count]) => ({ country, count }));

        // Recent activity
        const recentActivity = applications.slice(0, 5).map((app) => ({
            id: app.id,
            universityName: app.universityName,
            status: app.status,
            updatedAt: app.updatedAt.toISOString(),
        }));

        // Documents uploaded (across all applications)
        const documentsUploaded = applications.reduce((sum, app) => sum + app.documents.length, 0);

        return NextResponse.json({
            totalApplications,
            byStatus,
            submittedCount,
            avgMatchScore,
            deadlinesByMonth,
            countriesApplied,
            recentActivity,
            documentsUploaded,
            completionRate,
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}

// Simple country extraction from university name
function extractCountry(universityName: string): string | null {
    const name = universityName.toLowerCase();
    const countryKeywords: [string[], string][] = [
        [["germany", "german", "berlin", "munich", "hamburg", "frankfurt", "heidelberg", "tum", "lmu"], "Germany"],
        [["usa", "united states", "america", "mit", "harvard", "stanford", "berkeley", "yale", "princeton", "columbia", "cornell", "nyu"], "USA"],
        [["uk", "united kingdom", "london", "oxford", "cambridge", "manchester", "edinburgh", "imperial", "ucl"], "UK"],
        [["canada", "toronto", "mcgill", "ubc", "waterloo", "ottawa", "montreal"], "Canada"],
        [["france", "french", "paris", "sorbonne", "lyon"], "France"],
        [["netherlands", "dutch", "amsterdam", "delft", "leiden", "rotterdam", "eindhoven"], "Netherlands"],
        [["sweden", "swedish", "stockholm", "gothenburg", "lund", "uppsala"], "Sweden"],
        [["australia", "australian", "sydney", "melbourne", "queensland", "monash"], "Australia"],
        [["japan", "japanese", "tokyo", "kyoto", "osaka"], "Japan"],
        [["switzerland", "swiss", "zurich", "eth", "epfl", "geneva", "bern"], "Switzerland"],
        [["italy", "italian", "rome", "milan", "bologna", "florence"], "Italy"],
        [["spain", "spanish", "madrid", "barcelona"], "Spain"],
        [["south korea", "korean", "seoul", "kaist"], "South Korea"],
        [["china", "chinese", "beijing", "shanghai", "tsinghua", "peking"], "China"],
        [["india", "indian", "delhi", "mumbai", "bangalore", "iit"], "India"],
        [["norway", "norwegian", "oslo", "bergen", "trondheim"], "Norway"],
        [["denmark", "danish", "copenhagen", "aarhus"], "Denmark"],
        [["finland", "finnish", "helsinki", "aalto"], "Finland"],
        [["austria", "austrian", "vienna", "graz", "innsbruck"], "Austria"],
        [["belgium", "belgian", "brussels", "leuven", "ghent"], "Belgium"],
        [["turkey", "turkish", "istanbul", "ankara"], "Turkey"],
        [["ethiopia", "ethiopian", "addis ababa", "aau"], "Ethiopia"],
        [["nigeria", "nigerian", "lagos"], "Nigeria"],
        [["kenya", "kenyan", "nairobi"], "Kenya"],
        [["south africa", "cape town", "johannesburg", "pretoria"], "South Africa"],
        [["brazil", "brazilian", "sao paulo"], "Brazil"],
        [["mexico", "mexican", "unam"], "Mexico"],
        [["ireland", "irish", "dublin", "trinity"], "Ireland"],
        [["portugal", "portuguese", "lisbon", "porto"], "Portugal"],
        [["singapore", "nus", "ntu singapore"], "Singapore"],
        [["new zealand", "auckland", "wellington"], "New Zealand"],
    ];

    for (const [keywords, country] of countryKeywords) {
        for (const keyword of keywords) {
            if (name.includes(keyword)) {
                return country;
            }
        }
    }
    return null;
}
