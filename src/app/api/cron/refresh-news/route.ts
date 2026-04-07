import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * Daily cron handler — invalidates the cached news feed.
 *
 * Schedule: Every day at 07:00 KST (= 22:00 UTC) via vercel.json `crons`.
 *
 * Auth: Vercel cron requests automatically include
 *   `Authorization: Bearer ${CRON_SECRET}`
 * when the CRON_SECRET environment variable is set in the Vercel project.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  // `'max'` profile uses stale-while-revalidate semantics — visitors keep
  // seeing the previous news instantly while a fresh fetch runs in the
  // background. Recommended in Next 16.
  revalidateTag('news', 'max');

  return Response.json({
    revalidated: true,
    tag: 'news',
    timestamp: new Date().toISOString(),
  });
}
