import { NextRequest, NextResponse } from "next/server";

const TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/";
const STATE_COOKIE_NAME = "tiktok_oauth_state";

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://cricher.ai";
const successRedirectPath =
  process.env.TIKTOK_SUCCESS_REDIRECT_PATH ?? "/creatorportal/social";
const errorRedirectPath =
  process.env.TIKTOK_ERROR_REDIRECT_PATH ?? "/login";

const successRedirectUrl = `${appBaseUrl}${successRedirectPath}`;
const errorRedirectUrl = `${appBaseUrl}${errorRedirectPath}`;

const redirectUri =
  process.env.TIKTOK_REDIRECT_URI ??
  `${appBaseUrl}/api/auth/tiktok/callback`;

export async function GET(request: NextRequest) {
  const redirectWithError = (message: string) =>
    NextResponse.redirect(
      `${errorRedirectUrl}?provider=tiktok&error=${encodeURIComponent(message)}`
    );

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state") ?? undefined;
  const storedState = request.cookies.get(STATE_COOKIE_NAME)?.value;

  if (!storedState) {
    return redirectWithError("missing_state");
  }

  if (!state || state !== storedState) {
    return redirectWithError("state_mismatch");
  }

  if (error) {
    return redirectWithError(error);
  }

  if (!code) {
    return redirectWithError("missing_code");
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return redirectWithError("server_configuration");
  }

  try {
    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    const payload = await tokenResponse.json();

    if (!tokenResponse.ok || payload.error) {
      const errorDescription =
        payload.error_description ||
        payload.message ||
        "token_exchange_failed";

      return redirectWithError(errorDescription);
    }

    const response = NextResponse.redirect(
      `${successRedirectUrl}?provider=tiktok${
        state ? `&state=${encodeURIComponent(state)}` : ""
      }`
    );

    if (payload.access_token) {
      response.cookies.set("tiktok_access_token", payload.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: payload.expires_in ?? 60 * 60 * 24,
        path: "/",
      });
    }

    if (payload.refresh_token) {
      response.cookies.set("tiktok_refresh_token", payload.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: payload.refresh_expires_in ?? 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    if (payload.open_id) {
      response.cookies.set("tiktok_open_id", payload.open_id, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: payload.refresh_expires_in ?? 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    if (payload.scope) {
      response.cookies.set("tiktok_scope", payload.scope, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: payload.expires_in ?? 60 * 60 * 24,
        path: "/",
      });
    }

    response.cookies.set(STATE_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err) {
    return redirectWithError(
      err instanceof Error ? err.message : "unknown_error"
    );
  }
}
