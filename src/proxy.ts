import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

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
  } // If user is logged in, but tries to access a public route, redirect to dashboard

  // Force onboarding if not completed
  if (userId && !sessionClaims?.metadata?.onboardingCompleted && !isOnboardingRoute(req)) {
    const onboardingUrl = new URL('/onboarding', req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // If logged in and tries to access onboarding again, redirect based on role
  if (userId && sessionClaims?.metadata?.onboardingCompleted && isOnboardingRoute(req)) {
    const role = sessionClaims.metadata.role;
    const dashboardUrl = new URL(
      role === 'ADMIN' ? '/admin' :
      role === 'MODERATOR' ? '/moderator' :
      '/dashboard',
      req.url
    );
    return NextResponse.redirect(dashboardUrl);
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
