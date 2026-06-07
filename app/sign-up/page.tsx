import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

// Session check — runs at request time inside Suspense boundary
async function SessionRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/projects");
  }

  return null;
}

export default function SignUpPage() {
  return (
    <AuthLayout
      tagline="Start deploying in minutes."
      description="Create an account, connect your GitHub repositories, and deploy your first project to Dokploy today."
    >
      <Suspense fallback={null}>
        <SessionRedirect />
      </Suspense>
      <SignUpForm />
    </AuthLayout>
  );
}
