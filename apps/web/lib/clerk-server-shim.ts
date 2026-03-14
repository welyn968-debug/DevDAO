import { NextResponse } from "next/server";

export function clerkMiddleware() {
  return function middleware() {
    return NextResponse.next();
  };
}
