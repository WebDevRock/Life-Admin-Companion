import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Shield } from "lucide-react";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div
      className="min-h-[calc(100vh-4rem)] relative overflow-hidden flex flex-col"
      style={{ background: "#f5f0e8", color: "#4a4641" }}
    >
      {/* Decorative background shapes */}
      <svg
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          color: "rgba(124,158,110,0.10)",
          width: "28rem",
          height: "28rem",
          transform: "translate(25%, -25%)",
        }}
        viewBox="0 0 200 200"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M100 0C100 0 150 40 150 100C150 160 100 200 100 200C100 200 50 160 50 100C50 40 100 0 100 0Z" opacity="0.6" />
      </svg>
      <svg
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{
          color: "rgba(194,109,92,0.10)",
          width: "32rem",
          height: "32rem",
          transform: "translate(-25%, 25%)",
        }}
        viewBox="0 0 200 200"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="100" />
      </svg>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 max-w-5xl mx-auto w-full">
        {/* Leaf motif */}
        <div className="mb-10 opacity-80" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C12 2 15.5 6 15.5 12C15.5 18 12 22 12 22C12 22 8.5 18 8.5 12C8.5 6 12 2 12 2Z"
              fill="#7c9e6e"
              fillOpacity="0.25"
              stroke="#7c9e6e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          className="text-5xl md:text-6xl lg:text-7xl leading-tight mb-8 max-w-4xl font-medium tracking-tight"
          style={{ fontFamily: "'Lora', Georgia, serif", color: "#2d4a27" }}
        >
          One calm place for your everyday admin
        </h1>

        <p
          className="text-lg md:text-xl lg:text-2xl max-w-2xl mb-14 leading-relaxed font-light"
          style={{ color: "#4a4641" }}
        >
          Life Admin Companion helps you keep track of the boring but important
          things: bills, renewals, warranties, documents, appointments, and
          deadlines. Designed to reduce stress and avoid missed dates.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button
                className="w-full sm:w-auto px-8 py-4 rounded-full font-medium text-lg text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#7c9e6e" }}
                data-testid="btn-go-dashboard"
              >
                Go to Dashboard
              </button>
            </Link>
          ) : (
            <>
              <button
                onClick={() => setAuthOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-full font-medium text-lg text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#7c9e6e" }}
                data-testid="btn-start-organising"
              >
                Start organising
              </button>
              <Link href="/dashboard">
                <button
                  className="w-full sm:w-auto px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "transparent",
                    color: "#2d4a27",
                    border: "2px solid rgba(124,158,110,0.4)",
                  }}
                  data-testid="btn-example-dashboard"
                >
                  See example dashboard
                </button>
              </Link>
            </>
          )}
        </div>

        <div className="mt-16">
          <div
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full border text-sm md:text-base font-medium"
            style={{
              background: "rgba(124,158,110,0.12)",
              borderColor: "rgba(124,158,110,0.25)",
              color: "#2d4a27",
            }}
          >
            <Shield className="w-5 h-5 shrink-0" />
            <span>
              Your life admin records are private to your account — not sold, not shared.
            </span>
          </div>
        </div>
      </main>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
