import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/projects");
  }

  return (
    <AuthLayout
      tagline="Your deployment control plane."
      description="Connect GitHub, configure environments, and ship to Dokploy from one protected workspace."
    >
      <SignInForm />
    </AuthLayout>
  );
}
