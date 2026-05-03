// This module is intentionally thin — the real implementation lives in
// artifacts/life-admin/src/lib/firebase-auth.ts so that Vite can resolve
// the firebase package from the correct workspace package.
// We re-export the types only so other lib packages still compile.

export type AuthUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};
