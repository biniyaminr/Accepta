"use client";

import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import AcceptaLogo from "@/images/acceptalogo.png";
import {
  Globe,
  FileText,
  Zap,
  CheckCircle,
  Sparkles,
  Mail,
  LayoutDashboard,
  TrendingUp,
  ArrowRight,
  Users,
  Globe2,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { EnglishTestPromo } from "@/components/landing/EnglishTestPromo";

const TICKER_SCHOLARSHIPS = [
  { flag: "🇬🇧", name: "Chevening", tag: "Fully Funded" },
  { flag: "🇺🇸", name: "Fulbright", tag: "Fully Funded" },
  { flag: "🇩🇪", name: "DAAD", tag: "Stipend + Tuition" },
  { flag: "🇪🇺", name: "Erasmus Mundus", tag: "€1,400 / month" },
  { flag: "🇯🇵", name: "MEXT", tag: "Fully Funded" },
  { flag: "🇰🇷", name: "GKS", tag: "Fully Funded" },
  { flag: "🇨🇦", name: "Vanier CGS", tag: "$50,000 / year" },
  { flag: "🇭🇺", name: "Stipendium Hungaricum", tag: "Fully Funded" },
  { flag: "🇨🇳", name: "CSC", tag: "Fully Funded" },
  { flag: "🇹🇷", name: "Türkiye Bursları", tag: "Fully Funded" },
  { flag: "🇮🇹", name: "DSU Italy", tag: "Tuition Waiver" },
  { flag: "🇳🇱", name: "Orange Knowledge", tag: "Fully Funded" },
];

const MOCK_FEED_CARDS = [
  {
    name: "DAAD EPOS Scholarship",
    where: "🇩🇪 Germany · Masters",
    fund: "Fully Funded + Stipend",
    deadline: "Deadline · Oct 15",
    fit: "92%",
    fitColor: "border-violet-500/60 text-violet-400",
    badge: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    badgeText: "🏆 Scholarship",
  },
  {
    name: "Erasmus Mundus Joint Masters",
    where: "🇪🇺 Europe · Masters",
    fund: "€1,400 / month",
    deadline: "Deadline · Jan 10",
    fit: "88%",
    fitColor: "border-blue-500/60 text-blue-400",
    badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    badgeText: "💸 Free App",
  },
  {
    name: "Vanier Canada Graduate",
    where: "🇨🇦 Canada · PhD",
    fund: "$50,000 / year",
    deadline: "Deadline · Nov 1",
    fit: "84%",
    fitColor: "border-emerald-500/60 text-emerald-400",
    badge: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    badgeText: "🏆 Scholarship",
  },
];

export default function LandingPage() {
  const tHero = useTranslations("Hero");
  const tNav = useTranslations("Nav");
  const tFeatures = useTranslations("Features");
  const tAbout = useTranslations("About");
  const tJourney = useTranslations("Journey");
  const tDeepDive = useTranslations("DeepDive");
  const tBottomCTA = useTranslations("BottomCTA");
  const tLanding = useTranslations("Landing");

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-violet-500/30 overflow-x-hidden">

      {/* Announcement Bar */}
      <div className="relative h-10 bg-gradient-to-r from-violet-600/15 via-indigo-600/20 to-violet-600/15 flex items-center justify-center gap-3 px-4 text-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot shrink-0" />
        <span className="text-neutral-300 truncate">{tLanding("banner")}</span>
        <a href="#" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors flex items-center gap-1 shrink-0">
          {tLanding("bannerCta")} <ArrowRight className="w-3 h-3" />
        </a>
        <div className="absolute bottom-0 left-0 right-0 h-px beam-line" />
      </div>

      {/* Nav */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-neutral-950/60 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity">
          <Image
            src={AcceptaLogo}
            alt="Accepta logo"
            width={44}
            height={44}
            priority
            className="object-contain shrink-0 rounded-xl"
          />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-neutral-100 tracking-tight">
            Accepta
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <nav>
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="text-neutral-200 hover:text-white border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-violet-500/40 px-5 py-2 rounded-full transition-all font-medium text-sm backdrop-blur-sm">
                  {tNav("getStarted")}
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-full transition-all font-medium text-sm shadow-[0_0_24px_-6px_rgba(139,92,246,0.7)]">
                  {tNav("startFree")}
                </button>
              </Link>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center relative overflow-hidden">

        {/* ── HERO ── */}
        <section className="w-full flex flex-col items-center px-4 pt-24 sm:pt-32 pb-20 relative">
          {/* Atmosphere: aurora + blueprint grid */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-grid-fade" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-violet-600/20 rounded-full blur-[150px] animate-aurora" />
            <div className="absolute top-40 left-[12%] w-[420px] h-[420px] bg-indigo-600/15 rounded-full blur-[110px] animate-aurora-slow" />
            <div className="absolute top-40 right-[12%] w-[420px] h-[420px] bg-fuchsia-500/10 rounded-full blur-[110px] animate-aurora" />
          </div>

          <div className="max-w-4xl mx-auto text-center z-10 space-y-8 relative">
            {/* Pill badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm shadow-[0_0_30px_-8px_rgba(139,92,246,0.5)]">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered · Free to Start
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-shimmer">
              {tHero("title")}
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed font-light">
              {tHero("subtitle")}
            </p>

            {/* CTA buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="relative h-14 px-8 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-full transition-all hover:scale-[1.03] shadow-[0_0_50px_-8px_rgba(139,92,246,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]">
                    Start Applying for Free
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="relative h-14 px-8 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-full transition-all hover:scale-[1.03] shadow-[0_0_50px_-8px_rgba(139,92,246,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]">
                    {tNav("findScholarships")}
                  </button>
                </Link>
              </SignedIn>
              <a
                href="#how-it-works"
                className="h-14 px-8 text-base font-semibold border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-neutral-300 hover:text-white rounded-full transition-all hover:scale-[1.03] flex items-center gap-2 backdrop-blur-sm"
              >
                See how it works ↓
              </a>
            </div>

            {/* Trust stats pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {[
                tLanding("pillLiveFeed"),
                tLanding("pillUpdatedDaily"),
                tLanding("pillFree"),
              ].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Mock Dashboard Hero Image */}
          <div className="w-full max-w-5xl mx-auto px-0 sm:px-4 z-10 mt-20 relative">
            {/* Floating AI badge */}
            <span className="absolute -top-5 right-2 md:right-8 bg-violet-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_0_30px_-6px_rgba(139,92,246,0.9)] z-20 animate-float">
              ✨ AI Fit: 94%
            </span>
            <span className="absolute -top-5 left-2 md:left-8 bg-neutral-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-20 animate-float-delayed backdrop-blur-sm">
              ⚡ Auto-filled in 3s
            </span>

            {/* Glass frame with gradient edge */}
            <div className="rounded-2xl p-[1px] bg-gradient-to-b from-white/20 via-white/[0.06] to-transparent shadow-[0_50px_120px_-30px_rgba(139,92,246,0.45)]">
              <div className="rounded-2xl bg-neutral-950/90 p-2 backdrop-blur-xl">
                {/* Browser header */}
                <div className="h-10 bg-neutral-900 rounded-t-xl border-b border-white/[0.06] flex items-center px-4 gap-3">
                  <div className="flex gap-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 mx-4 h-6 bg-neutral-800 rounded-md flex items-center px-3 gap-2 max-w-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                    <span className="text-neutral-500 text-xs">accepta.site/feed</span>
                  </div>
                </div>

                {/* Live scholarship feed */}
                <div className="bg-neutral-900 rounded-b-xl overflow-hidden p-4 sm:p-5 flex flex-col gap-3" style={{ minHeight: 320 }}>
                  {/* Feed header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-neutral-100 font-bold text-sm sm:text-base">Live Opportunities</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" /> Live
                      </span>
                    </div>
                    <span className="text-neutral-500 text-xs hidden sm:block">26 new this week</span>
                  </div>

                  {/* Filter chips */}
                  <div className="flex gap-2 flex-wrap">
                    {["🏆 Scholarships", "💸 Free Application", "🎓 Fully Funded"].map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded-full bg-neutral-800/80 border border-white/[0.06] text-neutral-400 text-[11px] font-medium">
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Scholarship cards */}
                  <div className="grid sm:grid-cols-3 gap-3 flex-1">
                    {MOCK_FEED_CARDS.map((card, i) => (
                      <div key={i} className={`bg-neutral-800/60 border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2.5 ${i === 2 ? "hidden lg:flex" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${card.badge}`}>
                            {card.badgeText}
                          </span>
                          <div className={`w-10 h-10 rounded-full border-2 ${card.fitColor} flex items-center justify-center shrink-0`}>
                            <span className="text-[11px] font-bold">{card.fit}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-neutral-100 font-bold text-sm leading-snug">{card.name}</p>
                          <p className="text-neutral-400 text-xs">{card.where}</p>
                          <p className="text-emerald-400 text-xs font-semibold">{card.fund}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-2 gap-2">
                          <span className="text-neutral-500 text-[11px]">{card.deadline}</span>
                          <span className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-semibold">Save</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SCHOLARSHIP TICKER ── */}
        <section className="w-full py-10 relative overflow-hidden">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-600 mb-6">
            Tracking the world&apos;s top scholarships
          </p>
          <div className="marquee-mask overflow-hidden">
            <div className="flex gap-3 w-max animate-marquee">
              {[...TICKER_SCHOLARSHIPS, ...TICKER_SCHOLARSHIPS].map((s, i) => (
                <span
                  key={i}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.07] text-sm whitespace-nowrap"
                >
                  <span>{s.flag}</span>
                  <span className="font-semibold text-neutral-200">{s.name}</span>
                  <span className="text-neutral-500 text-xs">{s.tag}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="w-full py-12 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px beam-line" />
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { number: tLanding("statLiveNumber"), label: tLanding("statLiveLabel") },
                { number: tLanding("statBetaNumber"), label: tLanding("statBetaLabel") },
                { number: tLanding("statSetupNumber"), label: tLanding("statSetupLabel") },
                { number: tLanding("statFreeNumber"), label: tLanding("statFreeLabel") },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center text-center rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm py-6 px-4 hover:border-violet-500/25 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <span className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
                    {stat.number}
                  </span>
                  <span className="text-xs md:text-sm text-neutral-500 mt-1.5">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6-FEATURE GRID ── */}
        <section className="w-full max-w-6xl mx-auto px-4 py-24 z-10 relative">
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              Everything you need to get accepted
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              A complete AI toolkit for international students — from finding scholarships to submitting your application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
            {[
              {
                icon: Globe, tint: "blue",
                chip: "bg-blue-500/10 ring-blue-500/25 text-blue-400",
                hover: "hover:border-blue-500/40 hover:shadow-[0_0_40px_-12px_rgba(59,130,246,0.5)]",
                title: tFeatures("feedTitle"), desc: tFeatures("feedDesc"),
              },
              {
                icon: FileText, tint: "violet",
                chip: "bg-violet-500/10 ring-violet-500/25 text-violet-400",
                hover: "hover:border-violet-500/40 hover:shadow-[0_0_40px_-12px_rgba(139,92,246,0.5)]",
                title: tFeatures("cvTitle"), desc: tFeatures("cvDesc"),
              },
              {
                icon: Zap, tint: "orange",
                chip: "bg-orange-500/10 ring-orange-500/25 text-orange-400",
                hover: "hover:border-orange-500/40 hover:shadow-[0_0_40px_-12px_rgba(249,115,22,0.5)]",
                title: tFeatures("chromeTitle"), desc: tFeatures("chromeDesc"),
              },
              {
                icon: Mail, tint: "violet",
                chip: "bg-violet-500/10 ring-violet-500/25 text-violet-400",
                hover: "hover:border-violet-500/40 hover:shadow-[0_0_40px_-12px_rgba(139,92,246,0.5)]",
                title: "Letter Studio",
                desc: "Generate motivation letters, scholarship letters, and cover letters tailored to each program.",
              },
              {
                icon: LayoutDashboard, tint: "emerald",
                chip: "bg-emerald-500/10 ring-emerald-500/25 text-emerald-400",
                hover: "hover:border-emerald-500/40 hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.5)]",
                title: "Application Tracker",
                desc: "Visualize your pipeline with a drag-and-drop Kanban board. Never miss a deadline.",
              },
              {
                icon: TrendingUp, tint: "amber",
                chip: "bg-amber-500/10 ring-amber-500/25 text-amber-400",
                hover: "hover:border-amber-500/40 hover:shadow-[0_0_40px_-12px_rgba(245,158,11,0.5)]",
                title: "Profile Strength Score",
                desc: "See exactly how complete your profile is and what's needed to maximize AI recommendation accuracy.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`relative bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm transition-all duration-300 group p-8 rounded-2xl hover:-translate-y-1 ${f.hover}`}
              >
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className={`w-12 h-12 rounded-xl ring-1 ring-inset flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${f.chip}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROBLEM STATEMENT ── */}
        <section className="w-full bg-neutral-900/30 border-y border-white/[0.06] py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 blur-[110px] rounded-full pointer-events-none animate-aurora-slow" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 blur-[110px] rounded-full pointer-events-none animate-aurora" />

          <div className="max-w-4xl mx-auto px-4 text-center z-10 relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
              {tAbout("title")}
            </h2>
            <p className="text-xl md:text-2xl text-neutral-400 leading-relaxed font-light">
              {tAbout("desc")}
              <br /><br />
              <span className="text-violet-400 font-medium">{tAbout("solution")}</span>
            </p>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-24 max-w-5xl mx-auto px-4 relative z-10 w-full">
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-aurora" />

          <div className="text-center mb-20 relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              {tJourney("title")}
            </h2>
            <p className="text-xl text-neutral-400">{tJourney("subtitle")}</p>
          </div>

          <div className="space-y-12 relative z-10 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-violet-500/25 before:to-transparent">

            {/* Step 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-neutral-950 bg-neutral-900 text-blue-400 group-hover:bg-blue-900/50 group-hover:text-blue-300 shadow-[0_0_24px_rgba(59,130,246,0.25)] group-hover:shadow-[0_0_36px_rgba(59,130,246,0.5)] transition-all shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <FileText className="w-6 h-6" />
              </div>
              <div className="w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.05] hover:border-blue-500/25 transition-all">
                <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">Step 1</span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-2">{tJourney("step1Title")}</h3>
                <p className="text-neutral-400 leading-relaxed">{tJourney("step1Desc")}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-neutral-950 bg-neutral-900 text-violet-400 group-hover:bg-violet-900/50 group-hover:text-violet-300 shadow-[0_0_24px_rgba(139,92,246,0.25)] group-hover:shadow-[0_0_36px_rgba(139,92,246,0.5)] transition-all shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Globe className="w-6 h-6" />
              </div>
              <div className="w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.05] hover:border-violet-500/25 transition-all">
                <span className="text-xs font-semibold text-violet-400 tracking-wider uppercase">Step 2</span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-2">{tJourney("step2Title")}</h3>
                <p className="text-neutral-400 leading-relaxed">{tJourney("step2Desc")}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-neutral-950 bg-neutral-900 text-orange-400 group-hover:bg-orange-900/50 group-hover:text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.25)] group-hover:shadow-[0_0_36px_rgba(249,115,22,0.5)] transition-all shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Zap className="w-6 h-6" />
              </div>
              <div className="w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.05] hover:border-orange-500/25 transition-all">
                <span className="text-xs font-semibold text-orange-400 tracking-wider uppercase">Step 3</span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-2">{tJourney("step3Title")}</h3>
                <p className="text-neutral-400 leading-relaxed">{tJourney("step3Desc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── EARLY ACCESS ── */}
        <section className="w-full py-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px beam-line" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-aurora-slow" />

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
                  <Users className="w-3.5 h-3.5" />
                  {tLanding("earlyAccessLabel")}
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                {tLanding("earlyAccessTitle")}
              </h2>
              <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                {tLanding("earlyAccessBody")}
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              <div className="rounded-2xl p-[1px] bg-gradient-to-b from-violet-500/30 via-white/[0.06] to-transparent">
                <div className="bg-neutral-950/80 backdrop-blur-xl rounded-2xl p-8 flex flex-col gap-3 text-center transition-all hover:shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]">
                  <h3 className="text-white font-semibold text-lg">{tLanding("feedbackTitle")}</h3>
                  <p className="text-neutral-400 leading-relaxed">{tLanding("feedbackBody")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES DEEP DIVE ── */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 w-full relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px beam-line" />
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              {tDeepDive("mainTitle")}
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto font-light">
              {tDeepDive("mainSubtitle")}
            </p>
          </div>

          <div className="space-y-32">

            {/* Feature 1: AI CV Tailoring */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 ring-1 ring-inset ring-violet-500/25 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-3xl font-bold text-white">{tDeepDive("block1Title")}</h3>
                <p className="text-lg text-neutral-400 leading-relaxed font-light">
                  {tDeepDive("block1Desc")}
                </p>
                <ul className="space-y-3 pt-2">
                  {[
                    tDeepDive("block1Bullet1"),
                    tDeepDive("block1Bullet2"),
                    tDeepDive("block1Bullet3"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-neutral-300">
                      <CheckCircle className="w-5 h-5 text-violet-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-2xl p-[1px] bg-gradient-to-br from-violet-500/25 via-white/[0.06] to-transparent shadow-[0_30px_80px_-30px_rgba(139,92,246,0.35)]">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 overflow-hidden flex flex-col">
                    <div className="h-12 border-b border-white/[0.06] flex items-center px-4 gap-2 bg-neutral-900/50">
                      <div className="flex gap-1.5 shrink-0">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                      </div>
                      <div className="w-full max-w-sm mx-auto h-6 bg-neutral-800/50 rounded-md flex items-center px-3 gap-2">
                        <div className="w-3 h-3 rounded-sm bg-neutral-700" />
                        <div className="w-24 h-2 bg-neutral-700 rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 p-6 flex gap-6">
                      <div className="w-1/3 space-y-3">
                        <div className="h-4 w-20 bg-neutral-800 rounded mb-2" />
                        <div className="h-10 w-full bg-neutral-800/50 rounded-md border border-white/[0.06]" />
                        <div className="h-10 w-full bg-neutral-800/50 rounded-md border border-white/[0.06]" />
                        <div className="h-10 w-full bg-violet-600/20 border border-violet-500/30 rounded-md mt-4" />
                      </div>
                      <div className="flex-1 bg-white/[0.03] rounded-lg border border-white/[0.08] p-5 space-y-5">
                        <div className="space-y-2">
                          <div className="h-5 w-48 bg-neutral-700 rounded" />
                          <div className="h-3 w-32 bg-neutral-800 rounded" />
                        </div>
                        <div className="space-y-2.5">
                          {[100, 90, 75].map((w, i) => (
                            <div key={i} className="h-2.5 bg-neutral-800 rounded-full" style={{ width: `${w}%` }} />
                          ))}
                        </div>
                        <div className="space-y-2.5">
                          {[100, 85].map((w, i) => (
                            <div key={i} className="h-2.5 bg-neutral-800 rounded-full" style={{ width: `${w}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Chrome Extension */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 ring-1 ring-inset ring-orange-500/25 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold text-white">{tDeepDive("block2Title")}</h3>
                <p className="text-lg text-neutral-400 leading-relaxed font-light">
                  {tDeepDive("block2Desc")}
                </p>
                <ul className="space-y-3 pt-2">
                  {[
                    tDeepDive("block2Bullet1"),
                    tDeepDive("block2Bullet2"),
                    tDeepDive("block2Bullet3"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-neutral-300">
                      <CheckCircle className="w-5 h-5 text-orange-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-2xl p-[1px] bg-gradient-to-tl from-orange-500/25 via-white/[0.06] to-transparent shadow-[0_30px_80px_-30px_rgba(249,115,22,0.3)]">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-neutral-900 to-neutral-950 overflow-hidden flex items-center justify-center relative p-8">
                    <div className="absolute inset-0 bg-neutral-950/50 flex flex-col px-10 pt-14 gap-5 opacity-25 pointer-events-none">
                      <div className="h-7 w-64 bg-neutral-700 rounded mb-2" />
                      <div className="space-y-1.5"><div className="h-3 w-24 bg-neutral-800 rounded" /><div className="h-11 w-full max-w-md bg-neutral-800 rounded-md" /></div>
                      <div className="space-y-1.5"><div className="h-3 w-32 bg-neutral-800 rounded" /><div className="h-11 w-full max-w-md bg-neutral-800 rounded-md" /></div>
                    </div>
                    <div className="relative z-10 w-72 h-96 bg-neutral-900 rounded-xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden ml-auto mr-0 sm:mr-8 rotate-2 hover:rotate-0 transition-transform duration-500">
                      <div className="h-14 bg-gradient-to-r from-orange-600/80 to-pink-600/80 flex items-center justify-between px-4">
                        <span className="font-bold text-white tracking-tight text-sm">Accepta</span>
                        <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                          <Zap className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="p-4 space-y-4 flex-1 bg-neutral-900">
                        <div className="w-full h-10 bg-orange-500/20 border border-orange-500/50 rounded-lg flex items-center justify-center text-orange-400 font-medium text-sm gap-2">
                          <Sparkles className="w-4 h-4" /> Auto-Fill Page
                        </div>
                        <div className="space-y-2 mt-2">
                          <div className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Master Profile</div>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-neutral-800/80 rounded-md border border-neutral-700 border-dashed flex items-center px-3 gap-3">
                              <div className="w-6 h-6 rounded-sm bg-neutral-700 shrink-0" />
                              <div className="space-y-1.5 flex-1">
                                <div className="h-2 w-1/2 bg-neutral-600 rounded-full" />
                                <div className="h-1.5 w-1/3 bg-neutral-700 rounded-full" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Live Matching */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 ring-1 ring-inset ring-blue-500/25 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold text-white">{tDeepDive("block3Title")}</h3>
                <p className="text-lg text-neutral-400 leading-relaxed font-light">
                  {tDeepDive("block3Desc")}
                </p>
                <ul className="space-y-3 pt-2">
                  {[
                    tDeepDive("block3Bullet1"),
                    tDeepDive("block3Bullet2"),
                    tDeepDive("block3Bullet3"),
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-neutral-300">
                      <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-2xl p-[1px] bg-gradient-to-bl from-blue-500/25 via-white/[0.06] to-transparent shadow-[0_30px_80px_-30px_rgba(59,130,246,0.3)]">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-bl from-neutral-900 to-neutral-950 overflow-hidden flex flex-col p-6 gap-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="h-5 w-32 bg-neutral-700 rounded" />
                      <div className="h-8 w-8 bg-neutral-800 rounded-full" />
                    </div>
                    {[
                      { pct: "91%", color: "border-violet-500/50 text-violet-400" },
                      { pct: "87%", color: "border-blue-500/50 text-blue-400" },
                    ].map((card, i) => (
                      <div key={i} className="flex-1 bg-neutral-950/40 border border-white/[0.06] rounded-xl p-5 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-3/4 bg-neutral-600 rounded" />
                            <div className="h-3 w-1/2 bg-neutral-700/60 rounded" />
                          </div>
                          <div className={`w-12 h-12 rounded-full border-4 ${card.color} flex items-center justify-center shrink-0 ml-4`}>
                            <span className={`font-bold text-xs ${card.color.split(" ")[1]}`}>{card.pct}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <div className="h-8 w-24 bg-blue-600/20 rounded-md border border-blue-500/30" />
                          <div className="h-8 w-20 bg-neutral-800 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="w-full py-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px beam-line" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/8 blur-[120px] rounded-full pointer-events-none animate-aurora-slow" />

          <div className="max-w-3xl mx-auto px-4 relative z-10">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-neutral-400">Everything you need to know before getting started.</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Is Accepta really free?",
                  a: "Yes. The core features — profile setup, scholarship feed, AI fit evaluation, and letter generation — are completely free. Unlimited access is available as a one-time Sprint (30-day) or Season (90-day) pass.",
                },
                {
                  q: "Do I need a Chrome extension?",
                  a: "No. The Chrome extension is optional for portal auto-fill. All AI tools work directly in the browser without any extension.",
                },
                {
                  q: "What languages are supported?",
                  a: "The platform currently supports English and Amharic (አማርኛ), with more languages coming soon.",
                },
                {
                  q: "How accurate is the AI Fit Score?",
                  a: "Our AI analyzes your academic background, test scores, and experience against program requirements to generate a personalized fit score. It's directional guidance, not a guarantee.",
                },
              ].map((faq, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/25 backdrop-blur-sm rounded-2xl p-6 transition-all">
                  <h3 className="text-white font-semibold text-lg mb-3 flex items-start gap-3">
                    <span className="text-violet-400 shrink-0 mt-0.5">Q.</span>
                    {faq.q}
                  </h3>
                  <p className="text-neutral-400 leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="w-full py-32 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-violet-900/20 pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-violet-600/25 blur-[150px] rounded-full pointer-events-none animate-aurora" />
          <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-indigo-600/15 blur-[100px] rounded-full pointer-events-none animate-aurora-slow" />
          <div className="absolute inset-0 bg-grid-fade rotate-180 opacity-60 pointer-events-none" />

          <div className="max-w-3xl mx-auto px-4 text-center z-10 space-y-8 relative">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
                <Globe2 className="w-3.5 h-3.5" />
                {tLanding("openBeta")}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {tBottomCTA("title")}
            </h2>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="h-16 px-10 text-xl font-bold bg-white hover:bg-neutral-100 text-neutral-950 rounded-full shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all hover:scale-[1.04]">
                    {tBottomCTA("button")}
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="h-16 px-10 text-xl font-bold bg-white hover:bg-neutral-100 text-neutral-950 rounded-full shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all hover:scale-[1.04]">
                    {tNav("startFreeNoCard")}
                  </button>
                </Link>
              </SignedIn>
            </div>
            <p className="text-neutral-500 text-sm">{tBottomCTA("footer")}</p>
          </div>
        </section>

        {/* ── ENGLISH TEST PROMO ── */}
        <EnglishTestPromo />

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] bg-neutral-950 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px beam-line" />
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

            {/* Col 1 — Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image src={AcceptaLogo} alt="Accepta" width={40} height={40} className="rounded-lg" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-neutral-200">
                  Accepta
                </span>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-xs">
                Automate your path to the world&apos;s best universities.
              </p>
              <div className="flex gap-3 pt-2">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.08] flex items-center justify-center cursor-pointer transition-colors">
                  <Globe className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.08] flex items-center justify-center cursor-pointer transition-colors">
                  <Mail className="w-4 h-4 text-neutral-400" />
                </div>
              </div>
            </div>

            {/* Col 2 — Product */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                {[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Live Feed", href: "#" },
                  { label: "Letter Studio", href: "#" },
                  { label: "AI CV Maker", href: "#" },
                  { label: "Chrome Extension", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-neutral-500 hover:text-neutral-200 text-sm transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Resources */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3">
                {[
                  "Scholarship Guide",
                  "IELTS Prep",
                  "Duolingo Test",
                  "Application Tips",
                ].map((label) => (
                  <li key={label}>
                    <a href="#" className="text-neutral-500 hover:text-neutral-200 text-sm transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-neutral-600 text-sm">
              © {new Date().getFullYear()} Accepta. All rights reserved.
            </p>
            <p className="text-neutral-600 text-sm">
              Built with ❤️ by{" "}
              <a
                href="https://axiomdigital.site"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-violet-300 transition-colors"
              >
                axiomdigital.site
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
