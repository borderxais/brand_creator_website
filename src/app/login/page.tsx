"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAttemptsLimiter } from "@/lib/rate-limiter";
import { getSession } from "next-auth/react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTikTokLoading, setIsTikTokLoading] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTime, setRateLimitTime] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      // Check if there's a redirect URL from career application
      const redirectUrl = searchParams?.get('redirect');
      const fromApply = searchParams?.get('from');
      const positionId = searchParams?.get('position');
      
      if (redirectUrl && fromApply === 'apply' && positionId && session.user.role === "CREATOR") {
        // Redirect back to career page with parameters to open modal
        router.push(`${redirectUrl}?from=apply&position=${positionId}`);
      } else if (session.user.role === "BRAND") {
        router.push("/brandportal/dashboard");
      } else if (session.user.role === "CREATOR") {
        router.push("/creatorportal/dashboard");
      }
    }
  }, [status, session, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setShowResendButton(false);

    try {
      // Check if the user is rate limited (client-side check)
      const ip = "client"; // We'll use a placeholder since we can't get IP on client
      const key = `login-attempt:${ip}:${email}`;

      // Actually check on the server side through the API
      const rateLimitCheck = await fetch("/api/auth/check-rate-limit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const rateLimitData = await rateLimitCheck.json();

      if (rateLimitData.limited) {
        setIsRateLimited(true);
        setRateLimitTime(rateLimitData.remainingTime);
        setError(`Too many login attempts. Please try again in ${rateLimitData.remainingTime} seconds.`);
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if the error is due to unverified email
        if (result.error === "EmailNotVerified") {
          setError("Your email is not verified. Please verify your email before logging in.");
          setShowResendButton(true);
        } else {
          setError("Invalid email or password");
        }
      } else {
        
        // Use getSession() to get the latest session
        const session = await getSession();
        console.log('Session after login:', session);

        // Check if there's a redirect URL from career application
        const redirectUrl = searchParams?.get('redirect');
        const fromApply = searchParams?.get('from');
        const positionId = searchParams?.get('position');
        
        if (redirectUrl && fromApply === 'apply' && positionId && session?.user?.role === "CREATOR") {
          // Redirect back to career page with parameters to open modal
          router.push(`${redirectUrl}?from=apply&position=${positionId}`);
        } else if (session?.user?.role === "BRAND") {
          router.push("/brandportal/dashboard");
        } else if (session?.user?.role === "CREATOR") {
          router.push("/creatorportal/dashboard");
        } else {
          console.error('No valid role found in session');
          setError('Invalid user role');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to resend verification email
  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsResendingEmail(true);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        setError("");
      } else {
        setError(data.error || "Failed to resend verification email");
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-black">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-black">
          Or{" "}
          <Link href="/join-creator" className="font-medium text-purple-600 hover:text-purple-500">
            Join as Creator{" "}
          </Link>
          /{" "}
          <Link href="/join-brand" className="font-medium text-purple-600 hover:text-purple-500">
            Join as Brand
          </Link>
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsHandler />
      </Suspense>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                Verification email has been resent. Please check your inbox.
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setIsTikTokLoading(true);
                  window.location.href = "/api/auth/tiktok/authorize";
                }}
                disabled={isTikTokLoading}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${isTikTokLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-black"
                  fill="currentColor"
                >
                  <path d="M16.5 3a4.5 4.5 0 0 0 4.5 4.5V8a8 8 0 0 1-5-1.67V15a5.5 5.5 0 1 1-5.5-5.5c.17 0 .34 0 .5.02V6.01c-.17-.01-.33-.01-.5-.01A9 9 0 1 0 21 15.5V9.5h-1a3.5 3.5 0 0 1-3.5-3.5V3h-1Z" />
                </svg>
                {isTikTokLoading ? "Redirecting..." : "Login with TikTok"}
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Requires TikTok approval; you’ll choose permissions on TikTok.
              </p>
            </div>

            {showResendButton && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-purple-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  {isResendingEmail ? "Sending..." : "Resend verification email"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams?.get("registered") === "true";
  const justVerified = searchParams?.get("verified") === "true";
  const oauthError =
    searchParams?.get("provider") === "tiktok"
      ? searchParams?.get("error")
      : null;

  if (justVerified) {
    return (
      <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        Your email has been verified successfully! You can now log in to your account.
      </div>
    );
  }

  if (justRegistered) {
    return (
      <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        Account created successfully! Please check your email to verify your account before logging in.
      </div>
    );
  }

  if (oauthError) {
    return (
      <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        TikTok login failed: {oauthError.replace(/_/g, " ")}. Please try again.
      </div>
    );
  }

  return null;
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
