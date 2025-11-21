import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/auth.config';
import { prisma } from '@/lib/prisma';

// Define the Python API URL
const PYTHON_API_URL = process.env.CAMPAIGNS_API_URL || 'http://localhost:5000';

export async function GET(request: Request) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authConfig);
    console.log('Session:', session);

    if (!session?.user?.email) {
      console.log('No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user and ensure they are a brand
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    console.log('User:', { id: user?.id, email: session.user.email, role: user?.role });

    if (!user || user.role !== 'BRAND') {
      console.log('Not a brand:', { role: user?.role });
      return NextResponse.json({ error: 'Unauthorized - Brand access only' }, { status: 403 });
    }

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!brandProfile) {
      console.log('Brand profile not found for user:', user.id);
      return NextResponse.json({ error: 'Unauthorized - Brand access only' }, { status: 403 });
    }

    // Extract any query parameters from the request
    const { searchParams } = new URL(request.url);
    const isOpen = searchParams.get('is_open');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build the Python API URL with query parameters using brand profile ID directly
    let pythonApiUrl = `${PYTHON_API_URL}/campaigns/brand-campaigns/${brandProfile.id}`;  // Updated path
    const queryParams = new URLSearchParams();
    
    if (isOpen) queryParams.append('is_open', isOpen);
    if (search) queryParams.append('search', search);
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    if (queryParams.toString()) {
      pythonApiUrl += `?${queryParams.toString()}`;
    }
    
    console.log('Fetching from Python API with brand profile ID:', pythonApiUrl);
    
    const response = await fetch(pythonApiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.error(`Python API returned status ${response.status}`);
      return NextResponse.json(
        { 
          error: `API Error: ${response.status}`,
          campaigns: [] 
        }, 
        { status: response.status === 500 ? 200 : response.status }
      );
    }
    
    const campaigns = await response.json();
    console.log('Python API campaigns:', Array.isArray(campaigns) ? campaigns.length : 'not an array');
    
    // Return the campaigns
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching brand campaigns:', error);
    // Return empty array with error message instead of 500 status
    return NextResponse.json({ 
      error: 'Failed to fetch campaigns',
      campaigns: [] 
    }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user and ensure they are a brand
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'BRAND') {
      return NextResponse.json({ error: 'Unauthorized - Brand access only' }, { status: 403 });
    }

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!brandProfile) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 403 });
    }

    // Check if this is a multipart/form-data request
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData submission with file upload
      const formData = await request.formData();
      
      // Extract and prepare campaign data with all new fields
      const campaignData: any = {
        brand_id: brandProfile.id,
        title: formData.get('title') as string,
        brief: formData.get('brief') as string,
        requirements: formData.get('requirements') as string,
        budget_range: formData.get('budget_range') as string,
        budget_unit: formData.get('budgetUnit') as string,
        commission: formData.get('commission') as string,
        platform: formData.get('platform') as string,
        deadline: formData.get('deadline') as string,
        max_creators: parseInt(formData.get('max_creators') as string) || 10,
        is_open: formData.get('is_open') === 'true',
        sample_video_url: formData.get('sample_video_url') as string,
        // Existing new fields
        industry_category: formData.get('industry_category') as string,
        ad_placement: formData.get('ad_placement') as string,
        campaign_execution_mode: formData.get('campaign_execution_mode') as string,
        language_requirement_for_creators: formData.get('language_requirement_for_creators') as string,
        send_to_creator: formData.get('send_to_creator') as string,
        approved_by_brand: formData.get('approved_by_brand') as string,
        kpi_reference_target: formData.get('kpi_reference_target') as string,
        prohibited_content_warnings: formData.get('prohibited_content_warnings') as string,
        posting_requirements: formData.get('posting_requirements') as string,
        product_photo: formData.get('product_photo') as string,
        // New frontend fields
        script_required: formData.get('script_required') as string,
        product_name: formData.get('product_name') as string,
        product_highlight: formData.get('product_highlight') as string,
        product_price: formData.get('product_price') as string,
        product_sold_number: formData.get('product_sold_number') as string,
        paid_promotion_type: formData.get('paid_promotion_type') as string,
        video_buyout_budget_range: formData.get('video_buyout_budget_range') as string,
        base_fee_budget_range: formData.get('base_fee_budget_range') as string,
      };
      
      // Handle array fields that come as JSON strings
      const arrayFields = [
        'primary_promotion_objectives',
        'creator_profile_preferences_gender',
        'creator_profile_preference_ethnicity',
        'creator_profile_preference_content_niche',
        'preferred_creator_location',
        'creator_tier_requirement'
      ];
      
      arrayFields.forEach(field => {
        const value = formData.get(field) as string;
        if (value) {
          try {
            campaignData[field] = JSON.parse(value);
          } catch (e) {
            // If it's not valid JSON, treat as string
            campaignData[field] = value;
          }
        }
      });
      
      console.log('Campaign data with new fields:', {
        script_required: campaignData.script_required,
        product_name: campaignData.product_name,
        product_highlight: campaignData.product_highlight,
        product_price: campaignData.product_price,
        product_sold_number: campaignData.product_sold_number,
        paid_promotion_type: campaignData.paid_promotion_type,
        video_buyout_budget_range: campaignData.video_buyout_budget_range,
        base_fee_budget_range: campaignData.base_fee_budget_range
      });
      
      // Forward the request to the Python API
      const pythonApiUrl = `${PYTHON_API_URL}/campaigns/brand-campaigns/${user.brand.id}/add_campaign`;  // Updated path
      
      console.log('Creating campaign via Python API:', pythonApiUrl);
      
      const response = await fetch(pythonApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        console.error(`Python API returned status ${response.status} for POST`);
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({ 
          error: 'Failed to create campaign', 
          details: errorData 
        }, { status: response.status });
      }

      const campaign = await response.json();
      console.log('Campaign created successfully:', campaign);
      return NextResponse.json(campaign);
    } else {
      // Handle JSON submission (original implementation) - also update with new fields
      const data = await request.json();
      
      // Ensure all new fields are included
      const campaignData = {
        ...data,
        brand_id: user.brand.id,
        // Ensure new fields have defaults if not provided
        script_required: data.script_required || 'no',
        product_name: data.product_name || '',
        product_highlight: data.product_highlight || '',
        product_price: data.product_price || '',
        product_sold_number: data.product_sold_number || '',
        paid_promotion_type: data.paid_promotion_type || 'commission_based',
        video_buyout_budget_range: data.video_buyout_budget_range || '',
        base_fee_budget_range: data.base_fee_budget_range || '',
      };

      // Forward the request to the Python API
      const pythonApiUrl = `${PYTHON_API_URL}/campaigns/brand-campaigns/${user.brand.id}/add_campaign`;
      
      console.log('Creating campaign via Python API (JSON):', pythonApiUrl);
      
      const response = await fetch(pythonApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        console.error(`Python API returned status ${response.status} for POST`);
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json({ 
          error: 'Failed to create campaign',
          details: errorData 
        }, { status: response.status });
      }

      const campaign = await response.json();
      return NextResponse.json(campaign);
    }
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
