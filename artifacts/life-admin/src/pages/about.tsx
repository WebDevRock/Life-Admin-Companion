import { Shield, Lock, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebaseAuth } from "@/lib/firebase-auth";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const { user, logout } = useFirebaseAuth();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">About</h1>
        <p className="text-muted-foreground mt-1">About this app and your privacy.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            What is Life Admin Companion?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
          <p>
            Life Admin Companion is a calm, private tool to help you keep track of the boring but important things — bills, renewals, warranties, documents, appointments, and deadlines.
          </p>
          <p>
            It is designed for ordinary households, families, carers, older adults, and anyone who struggles to keep track of life admin. The goal is to reduce stress, avoid missed dates, and give you one calm place for everyday admin.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
          <p className="font-medium text-foreground">
            Your life admin records are private to your account. This app is designed to help you stay organised, not to sell your data.
          </p>
          <p>
            Every item you create is stored privately and linked only to your account. Other users cannot see your data.
          </p>
          <p>
            We do not sell your data, show you adverts, or share your information with third parties.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3 leading-relaxed">
          <p>
            Sign-in is handled securely via Firebase Authentication. Your data is stored in a private database that is only accessible to you when you are signed in.
          </p>
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              {(user.firstName || user.lastName) && (
                <div><span className="text-muted-foreground">Name:</span> <span className="ml-2">{[user.firstName, user.lastName].filter(Boolean).join(" ")}</span></div>
              )}
              {user.email && (
                <div><span className="text-muted-foreground">Email:</span> <span className="ml-2">{user.email}</span></div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()} data-testid="btn-logout-about">
              Log out
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
