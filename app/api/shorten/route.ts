import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateShortCode } from '@/lib/generate-code';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format (must start with http:// or https://)
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return NextResponse.json(
          { error: 'Invalid URL - must start with http:// or https://' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Generate short code with collision handling
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      shortCode = generateShortCode();

      // Check if code already exists
      const { data: existing } = await supabase
        .from('urls')
        .select('short_code')
        .eq('short_code', shortCode)
        .single();

      if (!existing) {
        // Code is unique, break the loop
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique short code' },
        { status: 500 }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from('urls')
      .insert({
        original_url: url,
        short_code: shortCode!,
        clicks: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create short URL' },
        { status: 500 }
      );
    }

    // Build short URL
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const shortUrl = `${protocol}://${host}/${data.short_code}`;

    return NextResponse.json({
      shortCode: data.short_code,
      shortUrl,
      originalUrl: data.original_url,
      clicks: data.clicks,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
