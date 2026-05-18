import { useEffect, useRef, useState } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { SessionProvider, useSession } from "next-auth/react";
import { Providers } from "@/providers";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookOpenCheck } from "lucide-react";
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

function SplashScreen() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-background">
            <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-[var(--cl-primary)] flex items-center justify-center text-white shrink-0">
                    <BookOpenCheck size={20} strokeWidth={2.2} />
                </div>
                <div className="text-[20px] tracking-tight leading-none select-none">
                    <span className="font-semibold" style={{ color: "#184F97" }}>Core</span>
                    <span className="font-semibold" style={{ color: "#004A7E" }}>Ledger</span>
                </div>
            </div>
            <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--cl-primary)", borderTopColor: "transparent" }}
            />
        </div>
    );
}

/** Inner shell — must be inside SessionProvider to call useSession(). */
function AppContent({ Component, pageProps }: Pick<AppProps, "Component" | "pageProps">) {
    const router = useRouter();
    const { status } = useSession();

    // Whether the subscription check has completed (only relevant for app routes)
    const [subscriptionChecked, setSubscriptionChecked] = useState(false);
    // Prevents double-fetching across re-renders
    const checking = useRef(false);

    const isAuthRoute = router.pathname.startsWith("/auth/");
    const isOnboard = router.pathname.startsWith("/onboard/");
    const isStandalone =
        router.pathname.startsWith("/settings/org") ||
        router.pathname.startsWith("/settings/account") ||
        isOnboard;

    useEffect(() => {
        // Only gate app routes for authenticated users — auth/onboard routes are open
        if (status !== "authenticated" || isAuthRoute || isStandalone) return;
        // Run once per session load
        if (checking.current) return;
        checking.current = true;

        fetch("/api/subscription/validate")
            .then((r) => {
                if (r.status === 404) {
                    // No subscription — redirect; keep SplashScreen until navigation completes
                    router.replace("/onboard/plans");
                    return;
                }
                // 200 = active, or any unexpected error → fail open (don't block the user)
                setSubscriptionChecked(true);
            })
            .catch(() => {
                // Network error — fail open
                setSubscriptionChecked(true);
            });
    }, [status, isAuthRoute, isStandalone]);

    // Session still resolving
    if (status === "loading") return <SplashScreen />;

    // Auth routes: component must mount to trigger the OIDC redirect
    if (isAuthRoute) {
        return (
            <>
                <SplashScreen />
                <Component {...pageProps} />
            </>
        );
    }

    // Onboard / settings pages render without AppShell
    if (isStandalone) {
        return <Component {...pageProps} />;
    }

    // App routes: hold on splash until subscription check resolves
    if (status === "authenticated" && !subscriptionChecked) {
        return <SplashScreen />;
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
