import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { next, error } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : "/";
  return (
    <AuthForm
      mode="signup"
      next={target}
      initialError={typeof error === "string" ? error : undefined}
    />
  );
}
