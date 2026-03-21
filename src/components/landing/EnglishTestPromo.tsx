import { ExternalLinkIcon, CheckCircle, Languages } from "lucide-react";

export function EnglishTestPromo() {
    return (
        <section className="w-full py-24 border-t border-neutral-800/50 relative overflow-hidden">
            {/* Subtle ambient glow - Optimized for performance */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-violet-600/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-green-500/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto px-4 z-10 relative">
                {/* Heading */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-widest mb-5">
                        <Languages className="w-3.5 h-3.5" />
                        English Proficiency
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
                        Prepare for Your English Proficiency Tests
                    </h2>
                    <p className="text-lg text-neutral-400 max-w-xl mx-auto">
                        Ace the IELTS or Duolingo test with AI-powered preparation tools trusted by hundreds of thousands of learners.
                    </p>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Card 1 — Duolingo */}
                    <div className="group relative flex flex-col p-8 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-green-500/40 hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.25)] transition-all duration-300 overflow-hidden">
                        {/* Hover glow layer */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Logo placeholder */}
                        <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-2xl font-black text-green-400">D</span>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">Duolingo English Test</h3>
                            <p className="text-neutral-400 leading-relaxed text-sm">
                                The fast, affordable, and convenient English test accepted by thousands of universities worldwide. Take a practice test for free from anywhere.
                            </p>
                        </div>

                        <a
                            href="https://englishtest.duolingo.com/en/applicants?utm_traffic=paid&utm_source=studyportals&utm_medium=link-ad&utm_campaign=dl_link_study_info&spcid=1904380581"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-8 flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-green-500/40 text-green-400 font-semibold text-sm hover:bg-green-500/10 hover:border-green-400 transition-all duration-200 group/btn"
                        >
                            Take A Free Practice Test!
                            <ExternalLinkIcon className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </a>
                    </div>

                    {/* Card 2 — Cathoven AI IELTS */}
                    <div className="group relative flex flex-col p-8 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-blue-500/40 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.25)] transition-all duration-300 overflow-hidden">
                        {/* Hover glow layer */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Logo placeholder */}
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-2xl font-black text-blue-400">C</span>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-4">Cathoven AI IELTS Preparation</h3>
                            <ul className="space-y-2.5">
                                {[
                                    "Trusted by 300k learners",
                                    "98% accuracy using real exam data",
                                    "4.9/5 student rating",
                                ].map((point) => (
                                    <li key={point} className="flex items-center gap-2.5 text-neutral-300 text-sm">
                                        <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <a
                            href="https://ielts.cathoven.com/ielts/register?utm_source=studyportals&utm_medium=ELR"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-8 flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-blue-500/40 text-blue-400 font-semibold text-sm hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-200 group/btn"
                        >
                            Learn your IELTS Score
                            <ExternalLinkIcon className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </a>
                    </div>

                </div>
            </div>
        </section>
    );
}
