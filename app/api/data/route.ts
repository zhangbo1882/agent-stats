import { NextResponse } from 'next/server';
import { ClaudeDataLoader } from '@/lib/data-loader';

export async function GET() {
  try {
    const loader = new ClaudeDataLoader();
    const data = await loader.loadAllData();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error loading Claude data:', error);
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    );
  }
}
