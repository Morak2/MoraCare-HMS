import { useState, useEffect, Suspense } from "react";
import { Outlet } from "react-router-dom";

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center relative overflow-hidden">
    {/* Background Decorative Glow */}
    <div className="absolute w-96 h-96 bg-[#0A1A3F]/5 rounded-full blur-[100px] animate-pulse"></div>
    <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#FF5A1F]/5 rounded-full blur-[80px]"></div>

    <div className="relative z-10 flex flex-col items-center">
      {/* HMS Medical Logo Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-[#FF5A1F]/20 animate-ping"></div>
        <div className="absolute inset-0 rounded-full bg-[#0A1A3F]/5 animate-pulse scale-150"></div>

        <div className="relative bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-[#0A1A3F] animate-heartbeat"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 12h3l2-3 2 6 1-3h2"
              className="animate-draw text-[#FF5A1F]"
            />
          </svg>
        </div>
      </div>

      {/* Branding Text */}
      <div className="text-center">
        <div className="text-3xl font-black tracking-tight text-[#0A1A3F]">
          Mora<span className="text-[#FF5A1F]">Care</span>
        </div>
        <div className="flex items-center gap-2 justify-center mt-2">
          <span className="h-[1px] w-4 bg-[#FF5A1F]/40 rounded-full"></span>
          <p className="text-slate-400 uppercase text-[10px] tracking-[0.3em] font-bold">
            Advanced Medical Technology
          </p>
          <span className="h-[1px] w-4 bg-[#FF5A1F]/40 rounded-full"></span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-10 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-[#FF5A1F] rounded-full animate-loading-bar"></div>
      </div>
    </div>

    <style>
      {`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.05); }
          28% { transform: scale(1); }
          42% { transform: scale(1.05); }
          70% { transform: scale(1); }
        }
        @keyframes draw {
          0% { stroke-dasharray: 0 100; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 100 0; stroke-dashoffset: 0; }
        }
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 50%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-heartbeat { animation: heartbeat 2s infinite ease-in-out; }
        .animate-loading-bar { animation: loading-bar 2.5s infinite ease-in-out; }
        .animate-draw {
          stroke-dasharray: 25;
          animation: draw 2s infinite linear;
        }
      `}
    </style>
  </div>
);

function App() {
  const [minDelayDone, setMinDelayDone] = useState(false);

  // Minimum 1s display so the loader never just flashes
  useEffect(() => {
    const timer = setTimeout(() => setMinDelayDone(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      {!minDelayDone ? (
        <LoadingScreen />
      ) : (
        <main>
          <Outlet />
        </main>
      )}
    </Suspense>
  );
}

export default App;