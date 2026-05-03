import React, { useEffect } from "react";
import { Shield } from "lucide-react";

export function GardenMorning() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f0e8] font-sans text-[#4a4641] selection:bg-[#7c9e6e]/20 relative overflow-hidden flex flex-col">
      {/* Decorative leaf motifs */}
      <svg className="absolute top-0 right-0 text-[#7c9e6e]/10 w-96 h-96 -translate-y-1/4 translate-x-1/4 pointer-events-none" viewBox="0 0 200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 0C100 0 150 40 150 100C150 160 100 200 100 200C100 200 50 160 50 100C50 40 100 0 100 0Z" opacity="0.6" />
      </svg>
      <svg className="absolute bottom-0 left-0 text-[#c26d5c]/10 w-[30rem] h-[30rem] translate-y-1/4 -translate-x-1/4 pointer-events-none" viewBox="0 0 200 200" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="100" />
      </svg>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10 flex flex-col flex-1 w-full">
        {/* Nav */}
        <header className="py-6 flex items-center justify-between border-b border-[#2d4a27]/10">
          <div className="text-xl font-['Lora',serif] font-medium text-[#2d4a27] tracking-tight flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c9e6e]">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Life Admin Companion
          </div>
          <button className="px-6 py-2.5 rounded-full text-sm font-medium text-[#7c9e6e] border-2 border-[#7c9e6e]/30 hover:bg-[#7c9e6e]/10 transition-colors duration-200">
            Log in
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center text-center py-16 lg:py-24">
          {/* Decorative element near headline */}
          <div className="mb-10 opacity-90">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 15.5 6 15.5 12C15.5 18 12 22 12 22C12 22 8.5 18 8.5 12C8.5 6 12 2 12 2Z" fill="#7c9e6e" fillOpacity="0.2" stroke="#7c9e6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="font-['Lora',serif] text-5xl md:text-6xl lg:text-[5rem] text-[#2d4a27] leading-[1.1] mb-8 max-w-4xl font-medium tracking-tight">
            One calm place for your everyday admin
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-[#4a4641] max-w-2xl mb-14 leading-relaxed font-light">
            Stay on top of life's moving parts without the stress. A single, peaceful dashboard to track renewals, subscriptions, and tasks that usually slip through the cracks.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 bg-[#7c9e6e] text-white rounded-full font-medium shadow-sm hover:bg-[#6a8b5c] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-lg">
              Start organising
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-[#2d4a27] border-2 border-[#7c9e6e]/40 rounded-full font-medium hover:bg-[#7c9e6e]/10 transition-all duration-300 text-lg">
              See example dashboard
            </button>
          </div>

          {/* Privacy Pill */}
          <div className="mt-auto pt-8">
            <div className="inline-flex items-center gap-3 px-6 py-3.5 bg-[#7c9e6e]/15 rounded-full border border-[#7c9e6e]/20">
              <Shield className="w-5 h-5 text-[#2d4a27]" />
              <span className="text-sm md:text-base font-medium text-[#2d4a27]">
                Your life admin records are private and securely stored.
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
