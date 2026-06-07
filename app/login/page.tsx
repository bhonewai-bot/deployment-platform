import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignInForm } from "@/features/auth/components/sign-in-form";

// Session check — runs at request time inside Suspense boundary
async function SessionRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/projects");
  }

  return null;
}

export default function LoginPage() {
  return (
    <AuthLayout
      tagline="Your deployment control plane."
      description="Connect GitHub, configure environments, and ship to Dokploy from one protected workspace."
    >
      <Suspense fallback={null}>
        <SessionRedirect />
      </Suspense>
      <SignInForm />
    </AuthLayout>
  );
}
