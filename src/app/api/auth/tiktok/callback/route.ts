import { NextRequest, NextResponse } from "next/server";

const TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/";

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
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state") ?? undefined;

  if (error) {
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=missing_code`
    );
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=server_configuration`
    );
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

      return NextResponse.redirect(
        `${errorRedirectUrl}?error=${encodeURIComponent(
          errorDescription
        )}`
      );
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

    return response;
  } catch (err) {
    return NextResponse.redirect(
      `${errorRedirectUrl}?error=${encodeURIComponent(
        err instanceof Error ? err.message : "unknown_error"
      )}`
    );
  }
}
