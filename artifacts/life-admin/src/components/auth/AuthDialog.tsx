import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/lib/firebase-auth";
import { getAuth } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";

type Mode = "login" | "register" | "reset";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "login" | "register";
}

export function AuthDialog({ open, onOpenChange, defaultMode = "login" }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const { login, register, authError, clearAuthError } = useFirebaseAuth();

  function switchMode(next: Mode) {
    setMode(next);
    clearAuthError();
    setResetSent(false);
    setResetError(null);
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        onOpenChange(false);
      } else if (mode === "register") {
        await register(email, password);
        onOpenChange(false);
      } else {
        setResetError(null);
        try {
          const app = getApps().length > 0 ? getApps()[0]! : initializeApp({
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
          });
          await sendPasswordResetEmail(getAuth(app), email);
          setResetSent(true);
        } catch (err: unknown) {
          const msg = (err instanceof Error && err.message.includes("user-not-found"))
            ? "No account found with that email address."
            : "Something went wrong. Please try again.";
          setResetError(msg);
        }
      }
    } catch {
      // authError set by hook for login/register
    } finally {
      setSubmitting(false);
    }
  }

  const headings: Record<Mode, string> = {
    login: "Sign in",
    register: "Create an account",
    reset: "Reset your password",
  };

  const descriptions: Record<Mode, string> = {
    login: "Sign in to access your life admin records.",
    register: "Create a free account to get started.",
    reset: "Enter your email and we'll send you a reset link.",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Lora', Georgia, serif", color: "#2d4a27" }}>
            {headings[mode]}
          </DialogTitle>
          <DialogDescription>
            {descriptions[mode]}
          </DialogDescription>
        </DialogHeader>

        {mode === "reset" && resetSent ? (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              A reset link has been sent to <strong>{email}</strong>. Check your inbox and follow the link to set a new password.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={() => switchMode("login")}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {mode !== "reset" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-password">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline hover:text-primary transition-colors"
                      onClick={() => switchMode("reset")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
                />
              </div>
            )}

            {(authError || resetError) && (
              <p className="text-sm text-destructive">{authError ?? resetError}</p>
            )}

            <Button
              type="submit"
              className="w-full rounded-full"
              style={{ background: "#7c9e6e" }}
              disabled={submitting}
            >
              {submitting
                ? mode === "login" ? "Signing in…" : mode === "register" ? "Creating account…" : "Sending…"
                : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    className="underline text-foreground hover:text-primary transition-colors"
                    onClick={() => switchMode("register")}
                  >
                    Create one
                  </button>
                </>
              ) : mode === "register" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="underline text-foreground hover:text-primary transition-colors"
                    onClick={() => switchMode("login")}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Remember it?{" "}
                  <button
                    type="button"
                    className="underline text-foreground hover:text-primary transition-colors"
                    onClick={() => switchMode("login")}
                  >
                    Back to sign in
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
