import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Purges the cached catalog.
 *
 * Catalog reads are cached across requests because they change only when the
 * seed runs — but Vercel's data cache survives deployments, so without this a
 * re-seed would not be visible until the TTL expired. `npm run seed` calls
 * this at the end when REVALIDATE_SECRET is configured.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 501 },
    );
  }

  const provided =
    request.headers.get("x-revalidate-secret") ??
    new URL(request.url).searchParams.get("secret");

  if (provided !== secret) {
    // Deliberately vague: this endpoint should not confirm whether a guess
    // was close, only that it was wrong.
    return NextResponse.json(
      { revalidated: false, error: "Not authorized" },
      { status: 401 },
    );
  }

  // expire: 0 means no stale-while-revalidate window. After a re-seed the
  // next request should block briefly and serve the new catalog, not the old.
  revalidateTag("catalog", { expire: 0 });

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
