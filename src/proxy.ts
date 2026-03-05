import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isAuth = !!req.auth;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");
    const isSetupPage = req.nextUrl.pathname.startsWith("/setup");
    const isApiRoute = req.nextUrl.pathname.startsWith("/api");

    // Allow API routes to pass through (Auth.js handles its own API routes)
    if (isApiRoute) {
        return NextResponse.next();
    }

    // If unauthenticated and not on the login page -> Redirect to login
    if (!isAuth && !isAuthPage) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If authenticated
    if (isAuth) {
        const role = req.auth?.user?.role;

        // pending_setup means login was successful but they have no user row 
        // because no organization exists yet.
        if (role === "pending_setup") {
            if (!isSetupPage) {
                return NextResponse.redirect(new URL("/setup", req.url));
            }
            return NextResponse.next(); // Allow access to /setup
        }

        // Role is normal but they are trying to access /login or /setup
        if (role !== "pending_setup" && (isAuthPage || isSetupPage)) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Protective boundary for Settings / Admin panel
        if (req.nextUrl.pathname.startsWith("/settings") && role !== "super_admin") {
            // Only super admins can access settings
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
});

// Configure matcher to protect everything except static files and Auth.js API limits
export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
