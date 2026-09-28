"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleVerify = async (tokenToUse: string) => {
    if (!tokenToUse.trim()) {
      setError("Please provide a verification token");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiFetch<{ success: boolean; message: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token: tokenToUse.trim() }),
      });
      setSuccess(res.message || "Email successfully verified!");
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed. Invalid or expired token.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendLoading(true);
    setResendMessage(null);

    try {
      const res = await apiFetch<{ message: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      setResendMessage(res.message);
    } catch {
      setResendMessage("If an account exists with this email, a verification link has been sent.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-gray-800 bg-gray-900/95 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-3">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Email Verification
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Confirm your email address to access all features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {success && (
              <div className="p-4 bg-green-950/60 border border-green-500/50 rounded-lg text-green-300 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{success}</p>
                  <p className="text-xs text-green-400/80 mt-1">Redirecting you to login...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-lg text-red-300 flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!tokenFromUrl && !success && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="token" className="text-sm font-medium text-gray-300">
                    Enter Verification Code
                  </label>
                  <input
                    id="token"
                    type="text"
                    placeholder="Enter received token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <Button
                  onClick={() => handleVerify(token)}
                  disabled={loading || !token.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-800">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Need a new code?</h4>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  placeholder="Your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={resendLoading || !resendEmail.trim()}
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  {resendLoading ? "Sending..." : "Resend Verification Code"}
                </Button>
                {resendMessage && (
                  <p className="text-xs text-purple-300 text-center">{resendMessage}</p>
                )}
              </form>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300"
              >
                Back to Login <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Email Verification
            </h2>
            <p className="text-sm text-gray-400 mt-2">Loading verification details...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
