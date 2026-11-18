import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Construction,
  Droplets,
  Hammer,
  Lightbulb,
  MapPin,
  Search,
  Trash2,
  Trees,
  Waves,
} from 'lucide-react';
import { PublicNavbar } from '../../components/PublicNavbar';
import { PublicFooter } from '../../components/PublicFooter';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { StatusIndicator } from '../../components/StatusBadge';
import { civicApi } from '../../lib/civicApi';
import { formatRelativeDate } from '../../utils/civicLogic';
import type { PublicStats } from '../../types/civic';

const ISSUE_CATEGORIES = [
  {
    name: 'Road Damage & Potholes',
    summary: 'Asphalt craters, cracked crosswalks, curb damage, and faded lane markings.',
    icon: Construction,
  },
  {
    name: 'Broken Streetlights',
    summary: 'Unlit neighborhood lamps, damaged poles, and malfunctioning pedestrian signals.',
    icon: Lightbulb,
  },
  {
    name: 'Garbage Accumulation',
    summary: 'Overflowing park receptacles, illegal dumping sites, and missed street sweeps.',
    icon: Trash2,
  },
  {
    name: 'Blocked Drainage',
    summary: 'Clogged storm grates, curb ponding, and obstructed rainwater runoff inlets.',
    icon: Waves,
  },
  {
    name: 'Water Leakage',
    summary: 'Burst street mains, leaking meter vaults, and damaged municipal hydrants.',
    icon: Droplets,
  },
  {
    name: 'Damaged Public Infrastructure',
    summary: 'Broken guardrails, damaged park benches, fencing, and public walkways.',
    icon: Hammer,
  },
  {
    name: 'Environmental & Civic',
    summary: 'Fallen branches blocking sidewalks, graffiti on civic structures, and park hazards.',
    icon: Trees,
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [referenceInput, setReferenceInput] = useState('');
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    civicApi
      .getPublicStats()
      .then(setStats)
      .catch(() => {
        // Ignore silent landing stats fetch failure
      });
  }, []);

  function handleQuickTrack(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = referenceInput.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/track?ref=${encodeURIComponent(cleaned)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Split */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center">
                <p className="text-sm font-semibold text-[#163A5F] tracking-wide">
                  Municipal Public Infrastructure Portal
                </p>
                <h1 className="mt-3 text-[clamp(2.25rem,4vw,3.5rem)] font-extrabold tracking-tight text-slate-900 leading-[1.08] text-balance">
                  Report It. Track It. Resolve It.
                </h1>
                <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                  CivicTrack connects residents directly with city engineering, sanitation, lighting, and water departments. Pin a problem on the map, attach field photographs, and follow verified repair progress from intake to completion.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/citizen/report"
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] transition-colors whitespace-nowrap"
                  >
                    <span>Report a Problem</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-5 py-3 text-sm font-semibold text-[#163A5F] bg-[#F2F6FA] border border-slate-200 rounded-md hover:bg-[#E6EEF6] transition-colors whitespace-nowrap"
                  >
                    Create Citizen Account
                  </Link>
                </div>

                {/* Quick Track Bar */}
                <form
                  onSubmit={handleQuickTrack}
                  className="mt-8 p-4 bg-[#F8FAFC] border border-slate-200 rounded-lg max-w-xl"
                >
                  <label
                    htmlFor="hero-track-ref"
                    className="block text-xs font-semibold text-slate-700 mb-2"
                  >
                    Check Live Complaint Status by Reference ID
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search
                        className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <input
                        id="hero-track-ref"
                        type="text"
                        value={referenceInput}
                        onChange={(e) => setReferenceInput(e.target.value)}
                        placeholder="Enter Reference ID (e.g. CT-2026-1001)"
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      Track Status
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-5">
                <div className="h-full min-h-[280px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <ImageWithFallback
                    src="/src/assets/images/civic_hero_city_1794926288973.jpg"
                    alt="Municipal civic plaza and clean urban avenue"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* 4-Column Municipal KPI Strip */}
            <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Civic Reports Logged</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
                  {stats ? stats.totalComplaints : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Verified Resolutions</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-700 font-mono tabular-nums">
                  {stats ? stats.resolvedComplaints : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active Field Dispatches</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#163A5F] font-mono tabular-nums">
                  {stats ? stats.inProgressComplaints : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Average Resolution Time</p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
                  {stats ? `${stats.avgResolutionHours} hrs` : '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 border-b border-slate-200 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Transparent Workflow from Intake to Field Repair
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
                Every submission enters a single shared database monitored by municipal dispatchers and department leads.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <p className="text-sm font-mono font-semibold text-[#163A5F]">01. Capture &amp; Pin</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Submit Issue with Photo &amp; GPS
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Use browser geolocation or drop an exact pin on the OpenStreetMap canvas, attach a photo, and receive an instant reference ID.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <p className="text-sm font-mono font-semibold text-[#163A5F]">02. Triage &amp; Route</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Department Assignment
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Municipal administrators verify evidence, prioritize severity, and assign the ticket directly to Roads, Water, Sanitation, or Lighting.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <p className="text-sm font-mono font-semibold text-[#163A5F]">03. Track &amp; Close</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Live Updates &amp; Resolution Notes
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Citizens follow stage-by-stage progress, receive notifications on status changes, and inspect official resolution notes upon completion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="categories" className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Public Issues Covered by CivicTrack
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600">
                  Select a category when filing your report so it reaches the right municipal crew immediately.
                </p>
              </div>
              <Link
                to="/citizen/report"
                className="text-sm font-semibold text-[#163A5F] hover:underline whitespace-nowrap"
              >
                Start a New Report
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ISSUE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.name}
                    className="p-5 rounded-lg border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-9 w-9 rounded-md bg-[#E6EEF6] text-[#163A5F] flex items-center justify-center mb-3">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{cat.summary}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent Verified Resolutions */}
        {stats && stats.recentResolved.length > 0 && (
          <section className="py-16 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Recently Resolved Public Works
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-slate-600">
                    Real municipal repairs verified and closed in the shared CivicTrack ledger.
                  </p>
                </div>
                <Link
                  to="/track"
                  className="text-sm font-semibold text-[#163A5F] hover:underline whitespace-nowrap"
                >
                  Look up any Reference ID
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.recentResolved.map((item) => (
                  <Link
                    key={item.id}
                    to={`/track?ref=${encodeURIComponent(item.referenceId)}`}
                    className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-[#163A5F] transition-colors flex flex-col"
                  >
                    <div className="h-44 bg-slate-100 overflow-hidden">
                      <ImageWithFallback
                        src={item.photoUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-mono font-semibold text-[#163A5F]">
                            {item.referenceId}
                          </span>
                          <StatusIndicator status={item.status} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                          {item.resolutionNotes || item.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.address}</span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatRelativeDate(item.resolvedAt || item.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
