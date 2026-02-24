import { NextRequest, NextResponse } from 'next/server';
import { ProfileManager } from '@/lib/profile-utils.server';

/**
 * POST /api/profiles/switch
 * Switches the active profile
 */
export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const manager = new ProfileManager();
    await manager.switchProfile(profileId);
    return NextResponse.json({ success: true, activeProfile: profileId });
  } catch (error) {
    console.error('Error switching profile:', error);
    return NextResponse.json(
      { error: 'Failed to switch profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}
