import React from 'react';
import {
  Ship,
  Compass,
  Navigation,
  Fuel,
  Wrench,
  Package,
  ShieldCheck,
  ArrowRight,
  Activity,
  Eye,
  KeyRound,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LandingPageProps {
  onOpenLogin: (role?: 'admin' | 'user', tab?: 'signin' | 'signup') => void;
  onExplorePublic?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const { login } = useAuth();
  const [isQuickLoggingIn, setIsQuickLoggingIn] = React.useState(false);

  const handleQuickLogin = async (role: 'admin' | 'user') => {
    setIsQuickLoggingIn(true);
    try {
      if (role === 'admin') {
        await login('admin@shipfleet.com', 'Admin@123');
      } else {
        await login('user@shipfleet.com', 'User@123');
      }
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Brand & Logo */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-900/40">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Ship className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-white flex items-center space-x-2">
                  <span>NavisFleet</span>
                  <span className="text-cyan-400">Maritime OS</span>
                </span>
                <span className="block text-xs text-slate-400 font-medium">
                  Enterprise Shipping Fleet &amp; Ocean Logistics Management
                </span>
              </div>
            </div>

            {/* Right: Quick Launch Button */}
            <div className="hidden sm:flex items-center space-x-3">
              <button
                onClick={() => handleQuickLogin('admin')}
                disabled={isQuickLoggingIn}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 transition-all flex items-center space-x-1.5"
              >
                <Compass className="w-4 h-4 text-cyan-200" />
                <span>{isQuickLoggingIn ? 'Entering...' : 'Enter Dashboard'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle maritime grid background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Next-Generation AIS & Ocean Dispatch Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none">
            Intelligent Shipping Fleet Management &amp; <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
              Voyage Monitoring Platform
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Enterprise command center engineered for maritime shipping lines to manage vessel specifications,
            worldwide voyages, routes, fuel bunkering, cargo manifests, maintenance schedules, crew rosters, and
            operational telemetry in real time.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={isQuickLoggingIn}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-blue-900/50 transition-all flex items-center justify-center space-x-2.5 scale-105"
            >
              <Compass className="w-5 h-5 text-cyan-200" />
              <span>{isQuickLoggingIn ? 'Launching Bridge...' : '🚀 Enter Live Fleet Dashboard'}</span>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>
            <button
              onClick={() => onOpenLogin('admin', 'signin')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-500/40 hover:border-rose-500 text-rose-300 font-bold text-sm shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4 text-rose-400" />
              <span>Admin Sign In</span>
            </button>
            <button
              onClick={() => onOpenLogin('user', 'signin')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>User Sign In</span>
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Banner */}
      <section className="border-y border-slate-800 bg-slate-900/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 mb-1">50+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">Vessels Managed</div>
            <div className="text-[11px] text-slate-400">Container, Bulker, LNG, Tankers</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 mb-1">120+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">Voyages Tracked</div>
            <div className="text-[11px] text-slate-400">Continuous telemetry sync</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400 mb-1">35+</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">Active Ocean Routes</div>
            <div className="text-[11px] text-slate-400">Panama, Suez, Trans-Pacific</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mb-1">24/7</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">Fleet Monitoring</div>
            <div className="text-[11px] text-slate-400">Live GPS &amp; Socket.io Telemetry</div>
          </div>
        </div>
      </section>

      {/* How The System Works Workflow */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <h2 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">End-to-End Operational Lifecycle</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">How ShipFleet Operations Work</h3>
          <p className="text-sm text-slate-400">
            A unified pipeline integrating vessel registration, voyage dispatch, cargo loading, bunkering, and operational telemetry.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: '01', title: 'Authenticate', desc: 'Secure JWT role verification', icon: ShieldCheck },
            { step: '02', title: 'Monitor Fleet', desc: 'Real-time GPS & AIS map tracking', icon: Compass },
            { step: '03', title: 'Manage Voyages', desc: 'Route scheduling & ETA management', icon: Navigation },
            { step: '04', title: 'Manage Vessels', desc: 'Technical specs & engine details', icon: Ship },
            { step: '05', title: 'Manage Operations', desc: 'Cargo assignment & fuel bunkering', icon: Fuel },
            { step: '06', title: 'Analyze Performance', desc: 'Fuel efficiency & KPI reporting', icon: BarChart3 }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative hover:border-blue-500/50 transition-all text-center flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 text-cyan-400 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 mb-1">Step {item.step}</span>
                <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Platform Modules */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Comprehensive Capabilities</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Full-Spectrum Maritime Modules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Fleet Monitoring */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Fleet Monitoring</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Monitor vessel locations, vessel operational status (In Transit, Docked, Maintenance, Idle), active voyages, and overall fleet KPIs from an interactive world map.
              </p>
            </div>

            {/* Voyage Management */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Voyage Management</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Create and manage voyages, assign vessels, specify origin and destination coordinates, track distances in nautical miles, and monitor delays and ETA progress.
              </p>
            </div>

            {/* Fuel Operations */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Fuel className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Fuel Operations</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log bunkering events with automatic total cost calculation (<span className="font-mono text-cyan-300">Quantity × Unit Price</span>) and fuel efficiency metrics (<span className="font-mono text-cyan-300">NM / MT</span>).
              </p>
            </div>

            {/* Vessel Management */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Ship className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Vessel Management</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Maintain comprehensive technical specifications: IMO numbers, flag registries, deadweight tonnage, gross tonnage, engine power, draft, fuel capacity, and insurance renewals.
              </p>
            </div>

            {/* Maintenance Management */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Maintenance Management</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Schedule preventive, corrective, and inspection maintenance routines. Track certified technicians, replacement parts, and maintenance expenditures.
              </p>
            </div>

            {/* Cargo & Crew */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Cargo &amp; Crew Rostering</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Assign commercial cargo manifests to active voyages. Maintain crew rosters, STCW marine certifications, officer contracts, and vessel assignments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <Ship className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">FleetOps Maritime ShipFleet Platform</span>
            <span>• Full-Stack MERN Architecture</span>
          </div>
          <div>
            MongoDB Persistence • Express REST API • Socket.io Real-Time • Leaflet GIS
          </div>
        </div>
      </footer>
    </div>
  );
};
