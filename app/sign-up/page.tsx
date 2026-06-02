import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/projects");
  }

  return (
    <AuthLayout
      tagline="Start deploying in minutes."
      description="Create an account, connect your GitHub repositories, and deploy your first project to Dokploy today."
    >
      <SignUpForm />
    </AuthLayout>
  );
}
