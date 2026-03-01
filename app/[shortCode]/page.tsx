import { redirect, notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface PageProps {
  params: Promise<{
    shortCode: string;
  }>;
}

export default async function RedirectPage({ params }: PageProps) {
  const { shortCode } = await params;

  // Look up short code in database
  const { data, error } = await supabase
    .from('urls')
    .select('original_url, clicks')
    .eq('short_code', shortCode)
    .single();

  // If not found, show 404
  if (error || !data) {
    notFound();
  }

  // Increment click counter in background (fire and forget)
  // We already have the current clicks, so we can increment directly
  const newClicks = (data.clicks || 0) + 1;
  
  // Fire and forget - don't await
  (async () => {
    try {
      await supabase
        .from('urls')
        .update({ clicks: newClicks })
        .eq('short_code', shortCode);
    } catch {
      // Silently fail - click tracking is not critical
    }
  })();

  // Redirect to original URL
  redirect(data.original_url);
}
