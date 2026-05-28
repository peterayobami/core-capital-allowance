import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/providers";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/index.css";

function RouteLoadingBar() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const start = () => setLoading(true);
        const end = () => setLoading(false);
        router.events.on("routeChangeStart", start);
        router.events.on("routeChangeComplete", end);
        router.events.on("routeChangeError", end);
        return () => {
            router.events.off("routeChangeStart", start);
            router.events.off("routeChangeComplete", end);
            router.events.off("routeChangeError", end);
        };
    }, [router]);

    if (!loading) return null;
    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] overflow-hidden" style={{ backgroundColor: "var(--cl-alpha)" }}>
            <div className="cl-progress-bar h-full w-full relative" />
        </div>
    );
}

/**
 * Inner shell. Auth/subscription gating has been disabled so that every part
 * of the app is reachable without an authenticated session. The auth-aware
 * logic is preserved in version control and can be reinstated by restoring
 * the previous implementation of this component (and `src/middleware.ts`).
 */
function AppContent({ Component, pageProps }: Pick<AppProps, "Component" | "pageProps">) {
    const router = useRouter();

    const isAuthRoute = router.pathname.startsWith("/auth/");
    const isOnboard = router.pathname.startsWith("/onboard/");
    const isStandalone =
        router.pathname.startsWith("/settings/org") ||
        router.pathname.startsWith("/settings/account") ||
        isOnboard;

    // Auth routes: render the page so its existing sign-in flow still works
    // for anyone who navigates there directly.
    if (isAuthRoute) {
        return <Component {...pageProps} />;
    }

    // Onboard / standalone settings pages render without AppShell.
    if (isStandalone) {
        return <Component {...pageProps} />;
    }

    return (
        <AppShell>
            <Component {...pageProps} />
        </AppShell>
    );
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    return (
        <SessionProvider session={session}>
            <Providers>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <RouteLoadingBar />
                    <AppContent Component={Component} pageProps={pageProps} />
                </TooltipProvider>
            </Providers>
        </SessionProvider>
    );
}
