import { NextRequest, NextResponse } from 'next/server';
import { ProfileManager } from '@/lib/profile-utils.server';

/**
 * GET /api/profiles
 * Fetches all profiles
 */
export async function GET() {
  try {
    const manager = new ProfileManager();
    const storage = await manager.loadProfiles();
    return NextResponse.json(storage);
  } catch (error) {
    console.error('Error loading profiles:', error);
    return NextResponse.json(
      { error: 'Failed to load profiles', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles
 * Creates a new profile
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await request.json();

    // Validate required fields
    if (!profile.id || !profile.name) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Profile must have id and name' },
        { status: 400 }
      );
    }

    const manager = new ProfileManager();
    await manager.createProfile(profile);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profiles
 * Updates an existing profile
 */
export async function PUT(request: NextRequest) {
  try {
    const { profileId, updates } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'profileId is required' },
        { status: 400 }
      );
    }

    const manager = new ProfileManager();
    await manager.updateProfile(profileId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles?id={profileId}
 * Deletes a profile
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('id');

    if (!profileId) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const manager = new ProfileManager();
    await manager.deleteProfile(profileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}
