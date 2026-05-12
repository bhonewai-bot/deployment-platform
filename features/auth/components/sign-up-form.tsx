"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { signUp } from "@/lib/auth-client";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm-password") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await signUp.email({ name, email, password });

    setLoading(false);

    if (res.error) {
      setError(res.error.message ?? "Something went wrong.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details below to get started.
        </CardDescription>
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
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Jane Smith"
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading}
              />
              <FieldDescription>At least 8 characters.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm password
              </FieldLabel>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                disabled={loading}
              />
            </Field>
            <Field>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </Field>
            <FieldDescription className="text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Log in
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
