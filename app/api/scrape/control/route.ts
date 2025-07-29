import { NextRequest, NextResponse } from 'next/server';
import { getGlobalScraperInstance } from '@/lib/scraper-manager';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    const globalScraperInstance = getGlobalScraperInstance();
    if (!globalScraperInstance) {
      return NextResponse.json(
        { error: 'No active scraping session found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'pause':
        globalScraperInstance.pause();
        return NextResponse.json({ 
          message: 'Scraping paused successfully',
          state: globalScraperInstance.getState(),
          progress: globalScraperInstance.getProgress()
        });

      case 'resume':
        globalScraperInstance.resume();
        return NextResponse.json({ 
          message: 'Scraping resumed successfully',
          state: globalScraperInstance.getState(),
          progress: globalScraperInstance.getProgress()
        });

      case 'cancel':
        globalScraperInstance.cancel();
        return NextResponse.json({ 
          message: 'Scraping cancelled successfully',
          state: globalScraperInstance.getState(),
          progress: globalScraperInstance.getProgress()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: pause, resume, or cancel' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Control API error:', error);
    return NextResponse.json(
      { error: 'Failed to control scraping process' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const globalScraperInstance = getGlobalScraperInstance();
    if (!globalScraperInstance) {
      return NextResponse.json({
        active: false,
        state: null,
        progress: null
      });
    }

    return NextResponse.json({
      active: true,
      state: globalScraperInstance.getState(),
      progress: globalScraperInstance.getProgress()
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get scraping status' },
      { status: 500 }
    );
  }
} 