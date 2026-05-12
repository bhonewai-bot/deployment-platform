import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { auth } from "@/lib/auth";

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-surface p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium text-on-surface"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/20">
            <Icon name="rocket" className="size-3.5 text-primary" />
          </div>
          Monolithic Void
        </Link>
        <SignUpForm />
      </div>
    </div>
  );
}
