"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth.schema";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/events";

  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || "Failed to sign in. Please verify your credentials.");
        return;
      }

      // Hard redirect to refresh server layout session
      window.location.href = from;
    } catch {
      setServerError("An unexpected network error occurred. Please try again.");
    }
  };

  const handleQuickFill = (email: string) => {
    setValue("email", email);
    setValue("password", "Password123!");
    setServerError(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <Ticket className="h-6 w-6 rotate-[-15deg]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back to EventPass</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your tickets and events</p>
        </div>

        <Card className="shadow-lg border-muted">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your account credentials to continue</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Server Error Alert */}
              {serverError && (
                <div
                  role="alert"
                  className="flex items-center space-x-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium leading-none">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="pl-9"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium leading-none">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-9 pr-10"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full shadow" isLoading={isSubmitting}>
                Sign In
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Demo Accounts Quick-Fill Helper Box */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-xs">
          <p className="font-semibold text-foreground">💡 Pre-seeded Demo Accounts:</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickFill("organizer@eventpass.io")}
              className="text-left rounded border bg-background p-2 hover:bg-muted transition-colors"
            >
              <div className="font-medium text-foreground">Organizer</div>
              <div className="text-muted-foreground truncate">organizer@eventpass.io</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("user1@eventpass.io")}
              className="text-left rounded border bg-background p-2 hover:bg-muted transition-colors"
            >
              <div className="font-medium text-foreground">Attendee</div>
              <div className="text-muted-foreground truncate">user1@eventpass.io</div>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">Password for all accounts: <code>Password123!</code></p>
        </div>
      </div>
    </div>
  );
}
