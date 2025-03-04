import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Only protect portal routes
    if ((path.startsWith("/brandportal") || path === "/brandportal") && token?.role !== "BRAND") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    if ((path.startsWith("/creatorportal") || path === "/creatorportal") && token?.role !== "CREATOR") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // If user is logged in as brand or creator, redirect them to their respective portals
    if (path === "/" && token?.role === "BRAND") {
      return NextResponse.redirect(new URL("/brandportal/dashboard", req.url))
    }

    if (path === "/" && token?.role === "CREATOR") {
      return NextResponse.redirect(new URL("/creatorportal/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Only require auth for portal routes
        if (path.startsWith("/brandportal") || path.startsWith("/creatorportal")) {
          return !!token
        }
        return true
      }
    },
    pages: {
      signIn: '/login',
    }
  }
)

export const config = {
  matcher: ["/", "/brandportal", "/brandportal/:path*", "/creatorportal", "/creatorportal/:path*"]
}
