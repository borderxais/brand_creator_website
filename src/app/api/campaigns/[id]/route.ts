import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1️⃣  Resolve the promise
  const { id: campaignId } = await params;

  if (!campaignId) {
    return NextResponse.json(
      { error: 'Campaign ID is required' },
      { status: 400 },
    );
  }

  const apiBaseUrl = process.env.CAMPAIGNS_API_URL ?? 'http://localhost:5000';
  const apiUrl = `${apiBaseUrl}/campaigns/${campaignId}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            errorData?.detail ??
            `Failed to fetch campaign (status: ${response.status})`,
        },
        { status: response.status },
      );
    }

    const campaign = await response.json();
    return NextResponse.json(campaign);
  } catch (err) {
    console.error('Error processing request:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
