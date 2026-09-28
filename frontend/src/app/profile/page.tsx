"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, Activity, Scale, Ruler, Utensils, CheckCircle, AlertCircle, Shield } from "lucide-react";

interface UserProfileResponse {
  weightKg: number | string | null;
  heightCm: number | string | null;
  dietType: "VEGETARIAN" | "NON_VEGETARIAN" | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    emailVerified: boolean;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    weight: "",
    height: "",
    dietType: "VEGETARIAN" as "VEGETARIAN" | "NON_VEGETARIAN",
    age: "25",
    gender: "male",
    goal: "muscle",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await apiFetch<UserProfileResponse>("/users/me/profile");
        setForm((prev) => ({
          ...prev,
          fullName: data.user?.fullName || "",
          email: data.user?.email || "",
          weight: data.weightKg ? String(data.weightKg) : "",
          height: data.heightCm ? String(data.heightCm) : "",
          dietType: data.dietType || "VEGETARIAN",
        }));
      } catch (err: unknown) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const weightNum = form.weight ? parseFloat(form.weight) : undefined;
      const heightNum = form.height ? parseFloat(form.height) : undefined;

      await apiFetch("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          weightKg: weightNum,
          heightCm: heightNum,
          dietType: form.dietType,
        }),
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white">
        <p className="text-sm text-gray-400">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border border-gray-800 bg-gray-900/95 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="border-b border-gray-800 pb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Personal Fitness Profile
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your metrics and nutrition preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {user?.role === "ADMIN" && (
              <div className="mb-6 p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-200">Administrator &amp; Trainer Account</p>
                    <p className="text-xs text-purple-300/80">Manage gym clients, nutrition charts, and inquiries.</p>
                  </div>
                </div>
                <Link href="/admin">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white ml-3">
                    Admin Console
                  </Button>
                </Link>
              </div>
            )}

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center space-x-3 text-sm border ${
                  message.type === "success"
                    ? "bg-green-950/50 border-green-500/50 text-green-300"
                    : "bg-red-950/50 border-red-500/50 text-red-300"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account details (read-only identity) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-gray-800">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={form.fullName}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-800/60 border border-gray-800 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={form.email}
                    className="w-full mt-1.5 px-3 py-2 bg-gray-800/60 border border-gray-800 rounded-lg text-gray-300 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Physical Metrics */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-400 mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2" /> Metrics &amp; Body Stats
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="weight"
                      className="text-xs font-medium text-gray-300 flex items-center"
                    >
                      <Scale className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> Weight (kg)
                    </label>
                    <input
                      id="weight"
                      type="number"
                      step="0.1"
                      name="weight"
                      placeholder="e.g. 75.5"
                      value={form.weight}
                      onChange={handleChange}
                      className="w-full mt-1.5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="height"
                      className="text-xs font-medium text-gray-300 flex items-center"
                    >
                      <Ruler className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> Height (cm)
                    </label>
                    <input
                      id="height"
                      type="number"
                      step="0.1"
                      name="height"
                      placeholder="e.g. 180"
                      value={form.height}
                      onChange={handleChange}
                      className="w-full mt-1.5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Diet Type */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-400 mb-3 flex items-center">
                  <Utensils className="w-4 h-4 mr-2" /> Nutrition Preference
                </h3>
                <div>
                  <label htmlFor="dietType" className="text-xs font-medium text-gray-300">
                    Dietary Classification
                  </label>
                  <select
                    id="dietType"
                    name="dietType"
                    value={form.dietType}
                    onChange={handleChange}
                    className="w-full mt-1.5 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="VEGETARIAN">Vegetarian (High-Protein Plant &amp; Dairy)</option>
                    <option value="NON_VEGETARIAN">Non-Vegetarian (Lean Meats, Poultry &amp; Fish)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
