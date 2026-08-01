import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPages = ["/dashboard", "/admin", "/courses/new"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = protectedPages.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtectedPage) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
