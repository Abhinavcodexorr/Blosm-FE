import { NextResponse } from "next/server";

/** Ensures dev/prod always emit `middleware-manifest.json` (avoids MODULE_NOT_FOUND on that path). */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
