import { NextResponse } from 'next/server';

const API_BASE = process.env.TIKTOK_API_BASE_URL?.replace(/\/$/, '') || 'https://open.tiktokapis.com';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const accessToken = body?.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: { message: 'Missing access_token' } }, { status: 400 });
    }

    const response = await fetch(`${API_BASE}/v2/post/publish/creator_info/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        {
          error: {
            message: payload?.error?.message || 'TikTok creator_info query failed',
            payload,
          },
        },
        { status: response.status },
      );
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Unexpected creator_info error',
        },
      },
      { status: 500 },
    );
  }
}
