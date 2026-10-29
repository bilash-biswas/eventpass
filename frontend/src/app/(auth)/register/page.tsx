"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Ticket, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth.schema";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "USER",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || "Registration failed. Please check your information.");
        return;
      }

      // Hard redirect to refresh server layout session
      window.location.href = data.role === "ORGANIZER" ? "/dashboard" : "/events";
    } catch {
      setServerError("An unexpected network error occurred. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <Ticket className="h-6 w-6 rotate-[-15deg]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your EventPass Account</h1>
          <p className="text-sm text-muted-foreground">Start discovering events or hosting your own</p>
        </div>

        <Card className="shadow-lg border-muted">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Choose how you plan to use EventPass</CardDescription>
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

              {/* Role Selector Tabs */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none">I want to:</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-1">
                  <button
                    type="button"
                    onClick={() => setValue("role", "USER")}
                    className={cn(
                      "flex items-center justify-center space-x-2 rounded-md py-2 text-xs font-semibold transition-all",
                      selectedRole === "USER"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Attend Events</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("role", "ORGANIZER")}
                    className={cn(
                      "flex items-center justify-center space-x-2 rounded-md py-2 text-xs font-semibold transition-all",
                      selectedRole === "ORGANIZER"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Host & Organize</span>
                  </button>
                </div>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium leading-none">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="pl-9"
                    error={errors.name?.message}
                    {...register("name")}
                  />
                </div>
              </div>

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
                    placeholder="jane@example.com"
                    autoComplete="email"
                    className="pl-9"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
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
                Create Account
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
