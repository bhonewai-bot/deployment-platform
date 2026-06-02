"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setLoading(true);

    const res = await signIn.email({ email, password });

    setLoading(false);

    if (res.error) {
      setError(res.error.message ?? "Invalid email or password.");
      return;
    }

    router.push("/projects");
  }

  async function handleGitHub() {
    setSocialLoading(true);
    await signIn.social({ provider: "github", callbackURL: "/projects" });
    setSocialLoading(false);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Field>
              <Button
                variant="outline"
                type="button"
                onClick={handleGitHub}
                disabled={socialLoading || loading}
              >
                <Icon name="github" className="size-4" />
                Continue with GitHub
              </Button>
            </Field>
            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Or continue with email
            </FieldSeparator>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading || socialLoading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading || socialLoading}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading || socialLoading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </Field>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Sign up
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
