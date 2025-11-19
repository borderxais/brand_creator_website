import { NextResponse } from "next/server";

const AUTH_ENDPOINT = "https://www.tiktok.com/v2/auth/authorize/";
const STATE_COOKIE_NAME = "tiktok_oauth_state";

const defaultScopes =
  "user.info.basic,user.info.stats,video.list,video.upload,video.publish";

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
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }

  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: scopes,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });

  const response = NextResponse.redirect(`${AUTH_ENDPOINT}?${params}`);

  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: stateMaxAge,
    path: "/",
  });

  return response;
}
