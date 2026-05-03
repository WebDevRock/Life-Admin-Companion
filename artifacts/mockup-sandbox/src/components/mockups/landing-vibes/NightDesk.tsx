import React from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NightDesk() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f4f1eb] font-sans selection:bg-[#c9863a]/30">
      <nav className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="text-[#f4f1eb] font-semibold tracking-wide text-sm opacity-90">
          Life Admin Companion
        </div>
        <Button 
          variant="outline" 
          className="bg-transparent border-[#c9863a]/40 text-[#c9863a] hover:bg-[#c9863a]/10 hover:text-[#c9863a] rounded-sm transition-colors duration-300"
        >
          Log in
        </Button>
      </nav>

      <main className="flex flex-col items-center justify-center px-4 pt-32 pb-24 text-center max-w-4xl mx-auto">
        <h1 className="font-['Playfair_Display'] text-5xl md:text-7xl font-semibold leading-[1.1] tracking-tight mb-8 text-[#fcfbf9]">
          One calm place<br/>for your everyday admin
        </h1>
        
        <p className="text-[#a19d94] text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-light">
          Organise your life's paperwork, renewals, and tasks in one secure place. 
          Stop relying on memory and scattered emails.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mb-24">
          <Button 
            className="bg-[#c9863a] hover:bg-[#b07330] text-[#0f0f0f] font-medium px-8 py-6 text-lg rounded-sm transition-colors duration-300 shadow-[0_0_30px_rgba(201,134,58,0.15)]"
          >
            Start organising
          </Button>
          <Button 
            variant="outline" 
            className="bg-transparent border-[#f4f1eb]/20 text-[#f4f1eb] hover:bg-[#f4f1eb]/5 hover:text-[#f4f1eb] px-8 py-6 text-lg rounded-sm transition-colors duration-300"
          >
            See example dashboard
          </Button>
        </div>

        <div className="mt-auto pt-12 flex items-center gap-3 px-6 py-4 rounded-full border border-[#f4f1eb]/10 bg-[#141414]">
          <Shield className="w-5 h-5 text-[#c9863a]" />
          <span className="text-sm text-[#a19d94]">
            Your life admin records are private and securely stored.
          </span>
        </div>
      </main>
    </div>
  );
}

export default NightDesk;
