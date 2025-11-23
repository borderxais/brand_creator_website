import { Buffer } from "node:buffer";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

const AUTH_ENDPOINT = "https://www.tiktok.com/v2/auth/authorize";
const STATE_COOKIE_NAME = "tiktok_oauth_state";
const CODE_VERIFIER_COOKIE_NAME = "tiktok_code_verifier";

const defaultScopes =
  "user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish";

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://cricher.ai";

const redirectUri =
  process.env.TIKTOK_REDIRECT_URI ??
  `${appBaseUrl}/api/auth/tiktok/callback`;

const scopes =
  process.env.TIKTOK_SCOPES?.split(/[,\s]+/)
    .filter(Boolean)
    .join(",") || defaultScopes;

const stateMaxAge = 5 * 60; // 5 minutes

function generateState() {
  return randomBytes(16).toString("hex");
}

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateCodeVerifier() {
  return randomBytes(32).toString("hex");
}

function generateCodeChallenge(verifier: string) {
  const hash = createHash("sha256").update(verifier).digest();
  return base64UrlEncode(hash);
}

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;

  if (!clientKey) {
    return NextResponse.json(
      { error: "TikTok client key is not configured." },
      { status: 500 }
    );
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: scopes,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(`${AUTH_ENDPOINT}?${params}`);

  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: stateMaxAge,
    path: "/",
  });

  response.cookies.set(CODE_VERIFIER_COOKIE_NAME, codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: stateMaxAge,
    path: "/",
  });

  return response;
}
