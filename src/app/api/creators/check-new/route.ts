import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the "refresh" query param to know if we should return all creators or just new ones
    const searchParams = request.nextUrl.searchParams;
    const refreshAll = searchParams.get('refresh') === 'true';

    // Find users with creator_handle_name that don't exist in the FindCreator table
    const usersWithHandles = await prisma.user.findMany({
      where: {
        creatorHandleName: {
          not: null
        }
      },
      select: {
        creatorHandleName: true
      }
    });
    
    const handleNames = usersWithHandles
      .map(user => user.creatorHandleName)
      .filter((name): name is string => name !== null);
    
    if (handleNames.length === 0) {
      return NextResponse.json({
        hasCreators: false,
        count: 0,
        allCreators: [],
        newCreators: []
      });
    }
    
    // Find existing creators
    const existingCreators = await prisma.findCreator.findMany({
      where: {
        creator_handle_name: {
          in: handleNames
        }
      },
      select: {
        creator_handle_name: true
      }
    });
    
    const existingHandles = existingCreators.map(creator => creator.creator_handle_name);
    
    // Find handles that exist in users but not in FindCreator
    const newHandles = handleNames.filter(handle => !existingHandles.includes(handle));
    
    // Return different data based on whether we're refreshing all or just checking for new ones
    return NextResponse.json({
      hasCreators: handleNames.length > 0,
      hasNewCreators: newHandles.length > 0,
      count: handleNames.length,
      newCount: newHandles.length,
      allCreators: refreshAll ? handleNames : [], // Only return all when requested
      newCreators: newHandles
    });
  } catch (error) {
    console.error('Error checking for creators:', error);
    return NextResponse.json(
      { error: 'Failed to check for creators' },
      { status: 500 }
    );
  }
}
