import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/";
const STATE_COOKIE_NAME = "tiktok_oauth_state";
const CODE_VERIFIER_COOKIE_NAME = "tiktok_code_verifier";

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://cricher.ai";
const successRedirectPath =
  process.env.TIKTOK_SUCCESS_REDIRECT_PATH ?? "/creatorportal/ai-video";
const errorRedirectPath =
  process.env.TIKTOK_ERROR_REDIRECT_PATH ?? "/login";

const successRedirectUrl = `${appBaseUrl}${successRedirectPath}`;
const errorRedirectUrl = `${appBaseUrl}${errorRedirectPath}`;

const redirectUri =
  process.env.TIKTOK_REDIRECT_URI ??
  `${appBaseUrl}/api/auth/tiktok/callback`;

type TikTokTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  open_id?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  error?: string;
  error_description?: string;
  message?: string;
};

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
  const codeVerifier = request.cookies.get(CODE_VERIFIER_COOKIE_NAME)?.value;

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

  if (!codeVerifier) {
    return redirectWithError("missing_code_verifier");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirectWithError("missing_session");
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    return redirectWithError("server_configuration");
  }

  try {
    const params = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const payload = (await tokenResponse.json()) as TikTokTokenResponse;
    console.log("TikTok OAuth token exchange response", {
      status: tokenResponse.status,
      ok: tokenResponse.ok,
      payload,
    });

    if (!tokenResponse.ok || payload.error) {
      const errorDescription =
        payload.error_description ||
        payload.message ||
        "token_exchange_failed";

      return redirectWithError(errorDescription);
    }

    const now = Date.now();
    const expiresAt = payload.expires_in
      ? new Date(now + payload.expires_in * 1000)
      : null;
    const refreshExpiresAt = payload.refresh_expires_in
      ? new Date(now + payload.refresh_expires_in * 1000)
      : null;

    if (!payload.open_id) {
      return redirectWithError("missing_open_id");
    }

    try {
      await prisma.tikTokAccount.upsert({
        where: { user_id: session.user.id },
        update: {
          tiktok_open_id: payload.open_id,
          access_token: payload.access_token ?? "",
          refresh_token: payload.refresh_token ?? "",
          scope: payload.scope ?? "",
          expires_at: expiresAt ?? new Date(now),
          refresh_expires_at: refreshExpiresAt ?? new Date(now),
          updated_at: new Date(),
        },
        create: {
          user_id: session.user.id,
          tiktok_open_id: payload.open_id,
          access_token: payload.access_token ?? "",
          refresh_token: payload.refresh_token ?? "",
          scope: payload.scope ?? "",
          expires_at: expiresAt ?? new Date(now),
          refresh_expires_at: refreshExpiresAt ?? new Date(now),
        },
      });

      const profile = await fetchTikTokProfile(payload.access_token ?? "");
      console.log("TikTok profile fetch result", {
        hasAccessToken: Boolean(payload.access_token),
        profile,
      });
      if (profile) {
        await prisma.tikTokAccount.update({
          where: { user_id: session.user.id },
          data: {
            handle: profile.username ?? profile.openId ?? null,
            display_name: profile.displayName ?? null,
            avatar_url: profile.avatarUrl ?? null,
            follower_count: profile.followerCount ?? null,
            last_synced_at: new Date(),
          },
        });
      }
    } catch (err) {
      console.error("Failed to persist TikTok account", err);
      return redirectWithError("account_persist_failed");
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
    response.cookies.set(CODE_VERIFIER_COOKIE_NAME, "", {
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

type TikTokUserProfile = {
  openId?: string;
  displayName?: string;
  avatarUrl?: string;
  username?: string;
  followerCount?: number;
};

async function fetchTikTokProfile(accessToken?: string): Promise<TikTokUserProfile | null> {
  if (!accessToken) {
    console.error("TikTok profile fetch skipped: missing access token");
    return null;
  }

  try {
    const response = await fetch("https://open.tiktokapis.com/v2/user/info/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: [
          "open_id",
          "display_name",
          "avatar_url",
          "username",
          "follower_count",
        ],
      }),
      cache: "no-store",
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Failed to fetch TikTok user info", {
        status: response.status,
        body,
      });
      return null;
    }

    const user =
      body?.data?.user ??
      body?.data ??
      null;

    if (!user) {
      return null;
    }

    return {
      openId: user.open_id ?? user.openId,
      displayName: user.display_name ?? user.displayName,
      avatarUrl: user.avatar_url ?? user.avatarUrl,
      username: user.username ?? user.handle ?? user.open_id,
      followerCount: user.follower_count ?? user.followerCount,
    };
  } catch (error) {
    console.error("Error fetching TikTok profile", error);
    return null;
  }
}
