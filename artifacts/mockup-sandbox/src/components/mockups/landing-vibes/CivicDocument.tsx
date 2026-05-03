import React from "react";
import { Shield } from "lucide-react";

export function CivicDocument() {
  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col font-sans text-[#111827]">
      {/* Top accent stripe */}
      <div className="h-1 w-full bg-[#0d2340]"></div>

      {/* Nav */}
      <nav className="w-full bg-white border-b border-[#e5e7eb] px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="font-bold text-[#0d2340] text-xl tracking-tight">
          Life Admin Companion
        </div>
        <button className="bg-[#0d2340] hover:bg-[#081629] text-white px-6 py-2.5 rounded-sm text-sm font-semibold transition-colors shadow-sm">
          Log in
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-24 md:py-32">
        <div className="max-w-4xl text-center space-y-10">
          <h1 className="text-5xl md:text-7xl font-bold text-[#0d2340] tracking-tighter leading-[1.1]">
            One calm place for your everyday admin
          </h1>
          
          <p className="text-lg md:text-2xl text-[#111827] max-w-3xl mx-auto leading-relaxed font-medium tracking-tight">
            Take control of your household management, documents, and recurring tasks. 
            A single, secure system designed to bring order to the business of life.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button className="w-full sm:w-auto bg-[#0d2340] hover:bg-[#081629] text-white px-8 py-4 rounded-sm text-base font-semibold transition-colors shadow-sm">
              Start organising
            </button>
            <button className="w-full sm:w-auto bg-white border-2 border-[#0d2340] text-[#0d2340] hover:bg-gray-50 px-8 py-4 rounded-sm text-base font-semibold transition-colors shadow-sm">
              See example dashboard
            </button>
          </div>
        </div>

        {/* Privacy Pill */}
        <div className="mt-24 md:mt-32">
          <div className="inline-flex items-center gap-3 bg-white border border-[#e5e7eb] px-5 py-3 rounded-md text-sm font-semibold text-[#0d2340] shadow-sm">
            <Shield className="w-5 h-5 text-[#2563eb]" />
            Your life admin records are private and securely stored.
          </div>
        </div>
      </main>
    </div>
  );
}
