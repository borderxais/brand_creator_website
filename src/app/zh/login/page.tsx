"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginChinese() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      if (session.user.role === "BRAND") {
        router.push("/brandportal/dashboard");
      } else if (session.user.role === "CREATOR") {
        router.push("/creatorportal/dashboard");
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码无效");
      } else {
        const response = await fetch("/api/auth/session");
        const sessionData = await response.json();

        if (sessionData?.user?.role === "BRAND") {
          router.push("/brandportal/dashboard");
        } else if (sessionData?.user?.role === "CREATOR") {
          router.push("/creatorportal/dashboard");
        } else {
          setError("无效的用户角色");
        }
      }
    } catch (error) {
      console.error("登录错误:", error);
      setError("登录过程中发生错误。请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-black">
          登录您的账户
        </h2>
        <p className="mt-2 text-center text-sm text-black">
          或者{" "}
          <Link href="/zh/join-creator" className="font-medium text-purple-600 hover:text-purple-500">
            注册成为创作者{" "}
          </Link>
          /{" "}
          <Link href="/zh/join-brand" className="font-medium text-purple-600 hover:text-purple-500">
            注册成为品牌
          </Link>
        </p>
      </div>

      {/* ✅ Wrap useSearchParams() inside a Suspense Boundary */}
      <Suspense fallback={<div>加载中...</div>}>
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
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black">
                电子邮箱
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
                密码
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
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "登录中..." : "登录"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ✅ Extract `useSearchParams()` into a Separate Component
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams?.get("registered") === "true";

  if (justRegistered) {
    return (
      <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        账户创建成功！请登录。
      </div>
    );
  }

  return null;
}
