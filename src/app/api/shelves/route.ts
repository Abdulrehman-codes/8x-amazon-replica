import { NextResponse, type NextRequest } from "next/server";
import { getShelves } from "@/lib/queries";

export const PAGE = 8;

/**
 * Feeds the home page's infinite scroll. The shelves themselves come out of
 * the same cached builder the first render uses, so paging through them costs
 * nothing extra.
 */
export async function GET(request: NextRequest) {
  const offsetParam = new URL(request.url).searchParams.get("offset");
  const offset = Math.max(0, Number.parseInt(offsetParam ?? "0", 10) || 0);

  const all = await getShelves();
  const slice = all.slice(offset, offset + PAGE);

  return NextResponse.json({
    shelves: slice,
    nextOffset: offset + slice.length,
    done: offset + slice.length >= all.length,
  });
}
