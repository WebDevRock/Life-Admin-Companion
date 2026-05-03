import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  verifyFirebaseToken,
  createSession,
  deleteSession,
  clearSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

async function upsertUser(uid: string, email: string | null, displayName: string | null, photoURL: string | null) {
  const nameParts = displayName ? displayName.split(" ") : [];
  const firstName = nameParts[0] ?? null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  const userData = {
    id: uid,
    email: email ?? null,
    firstName,
    lastName,
    profileImageUrl: photoURL ?? null,
  };

  const existing = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  if (existing.length > 0) {
    const [user] = await db
      .update(usersTable)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(usersTable.id, uid))
      .returning();
    return user;
  }

  const [user] = await db.insert(usersTable).values(userData).returning();
  return user;
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post("/auth/session", async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };
  if (!idToken || typeof idToken !== "string") {
    res.status(400).json({ error: "idToken is required" });
    return;
  }

  let decoded: Awaited<ReturnType<typeof verifyFirebaseToken>>;
  try {
    decoded = await verifyFirebaseToken(idToken);
  } catch (err) {
    req.log.warn({ err }, "Firebase token verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const dbUser = await upsertUser(
    decoded.uid,
    decoded.email ?? null,
    decoded.name ?? null,
    decoded.picture ?? null,
  );

  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
    },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json({ ok: true });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ ok: true });
});

router.post("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ ok: true });
});

export default router;
