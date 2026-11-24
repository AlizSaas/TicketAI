import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getRoleHome } from '@/lib/roles';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/inngest',
 
  '/api/webhooks/(.*)',
  '/api/uploadthing',
  '/api/stripe/webhook',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Redirect if user is not logged in and the route is not public
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Force onboarding if not completed
  if (userId && !sessionClaims?.metadata?.onboardingCompleted && !isOnboardingRoute(req)) {
    const onboardingUrl = new URL('/onboarding', req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // Logged-in, onboarded users hitting the landing page or onboarding go straight to their role dashboard
  if (userId && sessionClaims?.metadata?.onboardingCompleted && (isOnboardingRoute(req) || req.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL(getRoleHome(sessionClaims.metadata.role), req.url));
  }

  // Let everything else pass
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
