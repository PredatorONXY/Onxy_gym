"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiSend,
  FiChevronRight,
  FiSearch,
  FiUser,
  FiTarget,
  FiSun,
  FiCoffee,
  FiShoppingBag,
  FiSunset,
  FiMoon,
  FiZap,
  FiDroplet,
  FiList,
  FiInfo,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  ReferencePlanData,
  MealOptionItem,
} from "@/types/diet";

interface MealItem {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  serving_size?: string;
  instructions?: string;
}

interface MealBlock {
  items?: MealItem[];
  total?: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
}

interface DietChartResponse {
  id: string;
  clientId: string;
  title: string;
  description?: string | null;
  active: boolean;
  meals: Record<string, MealBlock>;
  planData?: ReferencePlanData & {
    dailyCalories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    guidelines?: string[];
    meals?: Array<{
      name: string;
      time?: string;
      items: MealItem[];
      instructions?: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  authorId: string;
  authorRole: "USER" | "ADMIN";
  body: string;
  createdAt: string;
  author?: {
    id: string;
    fullName: string;
    role: string;
  };
}

interface Conversation {
  id: string;
  subject?: string | null;
  dietChartId?: string | null;
  dietChart?: { id: string; title: string } | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"diet" | "questions">("diet");
  const [charts, setCharts] = useState<DietChartResponse[]>([]);
  const [selectedChart, setSelectedChart] = useState<DietChartResponse | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Questions State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [convoLoading, setConvoLoading] = useState(false);
  const [newQuestionSubject, setNewQuestionSubject] = useState("");
  const [newQuestionChartId, setNewQuestionChartId] = useState("");
  const [newQuestionBody, setNewQuestionBody] = useState("");
  const [followUpBody, setFollowUpBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);

  const DEFAULT_MEAL_KEYS = ["breakfast", "midmeal", "lunch", "snack", "dinner"] as const;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const fetchCharts = async () => {
      setChartsLoading(true);
      try {
        const data = await apiFetch<DietChartResponse[]>("/diet-charts/me");
        setCharts(data || []);
        if (data && data.length > 0) {
          const active = data.find((c) => c.active) || data[0];
          setSelectedChart(active);
        }
      } catch (err: unknown) {
        console.error("Error fetching charts:", err);
      } finally {
        setChartsLoading(false);
      }
    };

    const fetchConversations = async () => {
      try {
        const convos = await apiFetch<Conversation[]>("/questions/conversations");
        setConversations(convos || []);
        if (convos && convos.length > 0 && !selectedConvo) {
          setSelectedConvo(convos[0]);
        }
      } catch (err: unknown) {
        console.error("Error fetching conversations:", err);
      }
    };

    fetchCharts();
    fetchConversations();
  }, [user, authLoading, router]);

  const loadConversationDetails = async (id: string) => {
    setConvoLoading(true);
    try {
      const detailed = await apiFetch<Conversation>(`/questions/conversations/${id}`);
      setSelectedConvo(detailed);
    } catch (err: unknown) {
      console.error("Error loading conversation:", err);
    } finally {
      setConvoLoading(false);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvo || !followUpBody.trim()) return;

    setSendingMessage(true);
    try {
      const msg = await apiFetch<Message>(
        `/questions/conversations/${selectedConvo.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ body: followUpBody.trim() }),
        },
      );

      setSelectedConvo((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, msg],
              updatedAt: new Date().toISOString(),
            }
          : null,
      );
      setFollowUpBody("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionBody.trim()) return;

    setSendingMessage(true);
    try {
      const convo = await apiFetch<Conversation>("/questions/conversations", {
        method: "POST",
        body: JSON.stringify({
          subject: newQuestionSubject.trim() || "Nutritional Inquiry",
          dietChartId: newQuestionChartId || undefined,
          body: newQuestionBody.trim(),
        }),
      });

      setConversations((prev) => [convo, ...prev]);
      setSelectedConvo(convo);
      setNewQuestionSubject("");
      setNewQuestionChartId("");
      setNewQuestionBody("");
      setShowNewQuestionModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create conversation");
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredCharts = charts.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (authLoading || chartsLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-400">Loading your plans &amp; dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center text-white">
        <p className="text-sm text-gray-400">Redirecting to login...</p>
      </div>
    );
  }

  const renderMealSection = (
    title: string,
    icon: React.ReactNode,
    timing: string,
    mealGroup?: { options?: MealOptionItem[] } | MealOptionItem[]
  ) => {
    const options: MealOptionItem[] = Array.isArray(mealGroup)
      ? mealGroup
      : mealGroup?.options || [];
    if (options.length === 0) return null;

    return (
      <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-700/60 gap-2">
          <div className="flex items-center space-x-2">
            {icon}
            <h4 className="font-semibold text-white text-base">{title}</h4>
          </div>
          {timing && (
            <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-full font-medium w-fit">
              {timing}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {options.map((opt, oIdx) => (
            <div
              key={opt.id || oIdx}
              className="bg-gray-900/80 border border-gray-800 rounded-lg p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold uppercase bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                    Option {oIdx + 1}
                  </span>
                  <span className="font-semibold text-white">
                    {opt.name || `Option ${oIdx + 1}`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="bg-purple-950/80 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded">
                    {opt.calories || 0} kcal
                  </span>
                  <span className="bg-pink-950/80 text-pink-300 border border-pink-800/40 px-2 py-0.5 rounded">
                    P: {opt.protein || 0}g
                  </span>
                  <span className="bg-blue-950/80 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded">
                    C: {opt.carbs || 0}g
                  </span>
                  <span className="bg-yellow-950/80 text-yellow-300 border border-yellow-800/40 px-2 py-0.5 rounded">
                    F: {opt.fat || 0}g
                  </span>
                </div>
              </div>

              {opt.ingredients && opt.ingredients.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-gray-400 bg-gray-950/60 uppercase">
                      <tr>
                        <th className="px-3 py-1.5 rounded-l">Ingredient / Food Item</th>
                        <th className="px-3 py-1.5 rounded-r">Quantity / Serving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {opt.ingredients.map((ing, iIdx) => (
                        <tr key={ing.id || iIdx} className="hover:bg-gray-800/20">
                          <td className="px-3 py-1.5 text-gray-200 font-medium">{ing.name}</td>
                          <td className="px-3 py-1.5 text-gray-400">
                            {ing.quantity || ing.serving || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {opt.recipe && (
                <div className="text-xs text-gray-300 bg-gray-950/50 p-2.5 rounded border border-gray-800/60">
                  <span className="font-semibold text-purple-300 mr-1">Instructions / Note:</span>
                  {opt.recipe}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Client Portal
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Welcome, {user?.fullName || user?.email}. View your diet charts and ask your trainer questions.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mt-4 md:mt-0 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab("diet")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "diet"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span>Nutrition &amp; Diet Plans</span>
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "questions"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FiMessageSquare className="w-4 h-4" />
              <span>Trainer Inquiries ({conversations.length})</span>
            </button>
          </div>
        </div>

        {/* DIET TAB */}
        {activeTab === "diet" && (
          <div className="space-y-6">
            {/* Top stats and search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search your diet plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                      <FiFileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Plans</p>
                      <p className="text-lg font-bold">{charts.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                      {charts.filter((c) => c.active).length} Active
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Plan list & History */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="bg-gray-900 border-gray-800 text-white">
                  <CardHeader className="pb-3 border-b border-gray-800">
                    <CardTitle className="text-base font-semibold text-gray-200">
                      Your Plans &amp; History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                    {filteredCharts.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">
                        {searchTerm ? "No plans match your search." : "No diet plans assigned yet."}
                      </div>
                    ) : (
                      filteredCharts.map((chart) => {
                        const isSelected = selectedChart?.id === chart.id;
                        return (
                          <div
                            key={chart.id}
                            onClick={() => setSelectedChart(chart)}
                            className={`p-4 cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-purple-900/30 border-l-4 border-purple-500"
                                : "hover:bg-gray-800/60"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-white">{chart.title}</h3>
                                <p className="text-xs text-gray-400">
                                  {new Date(chart.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  chart.active
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-gray-800 text-gray-400"
                                }`}
                              >
                                {chart.active ? "Active" : "Archived"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Active/Selected Chart Details */}
              <div className="lg:col-span-2">
                {selectedChart ? (
                  <Card className="bg-gray-900 border-gray-800 text-white">
                    <CardHeader className="border-b border-gray-800 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-xl font-bold text-white">
                              {selectedChart.title}
                            </CardTitle>
                            {selectedChart.active && (
                              <span className="flex items-center text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full font-medium">
                                <FiCheckCircle className="w-3 h-3 mr-1" /> Current Active Plan
                              </span>
                            )}
                          </div>
                          {selectedChart.description && (
                            <p className="text-sm text-gray-400 mt-1">
                              {selectedChart.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-400 flex items-center shrink-0">
                          <FiClock className="w-3.5 h-3.5 mr-1" />
                          Created: {new Date(selectedChart.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                      {/* Check if chart has reference-style structure */}
                      {Boolean(
                        selectedChart.planData &&
                          (selectedChart.planData.clientDetails ||
                            selectedChart.planData.morningRoutine ||
                            selectedChart.planData.breakfast?.options?.length ||
                            selectedChart.planData.lunch?.options?.length ||
                            selectedChart.planData.eveningSnack?.options?.length ||
                            selectedChart.planData.dinner?.options?.length ||
                            selectedChart.planData.postWorkout?.options?.length ||
                            selectedChart.planData.weeklyGuidelines?.length),
                      ) ? (
                        <div className="space-y-6">
                          {/* 1. Client Details Header Banner */}
                          {selectedChart.planData?.clientDetails && (
                            <div className="p-5 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-pink-950/30 border border-purple-800/40 rounded-xl space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-800/30">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-lg">
                                    <FiUser className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-semibold tracking-wider text-purple-400 uppercase">
                                      Prepared For Client
                                    </p>
                                    <h3 className="text-lg font-bold text-white">
                                      {selectedChart.planData.clientDetails.name || "Client"}
                                    </h3>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {selectedChart.planData.clientDetails.goal && (
                                    <span className="px-3 py-1 bg-purple-900/50 text-purple-300 border border-purple-700/50 rounded-full text-xs font-semibold">
                                      🎯 Goal: {selectedChart.planData.clientDetails.goal}
                                    </span>
                                  )}
                                  {selectedChart.planData.clientDetails.planType && (
                                    <span className="px-3 py-1 bg-pink-900/50 text-pink-300 border border-pink-700/50 rounded-full text-xs font-semibold">
                                      📋 {selectedChart.planData.clientDetails.planType}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 text-xs">
                                <div className="bg-gray-950/40 p-2.5 rounded-lg border border-purple-900/30">
                                  <span className="text-gray-400 block text-[10px] uppercase">Age</span>
                                  <span className="font-semibold text-white">
                                    {selectedChart.planData.clientDetails.age || "N/A"}
                                  </span>
                                </div>
                                <div className="bg-gray-950/40 p-2.5 rounded-lg border border-purple-900/30">
                                  <span className="text-gray-400 block text-[10px] uppercase">Weight</span>
                                  <span className="font-semibold text-white">
                                    {selectedChart.planData.clientDetails.weight || "N/A"}
                                  </span>
                                </div>
                                <div className="bg-gray-950/40 p-2.5 rounded-lg border border-purple-900/30">
                                  <span className="text-gray-400 block text-[10px] uppercase">Height</span>
                                  <span className="font-semibold text-white">
                                    {selectedChart.planData.clientDetails.height || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. Plan Overview & Targets Banner */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                              <FiTarget className="w-3.5 h-3.5" />
                              <span>Plan Overview &amp; Daily Targets</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                              <div>
                                <p className="text-xs text-gray-400">Target Calories</p>
                                <p className="text-lg font-bold text-purple-400">
                                  {Number(selectedChart.planData?.planOverview?.dailyCalories) ||
                                    Number(selectedChart.planData?.dailyCalories) ||
                                    0}{" "}
                                  kcal
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Protein</p>
                                <p className="text-lg font-bold text-pink-400">
                                  {Number(selectedChart.planData?.planOverview?.proteinGrams) ||
                                    Number(selectedChart.planData?.proteinGrams) ||
                                    0}{" "}
                                  g
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Carbs</p>
                                <p className="text-lg font-bold text-blue-400">
                                  {Number(selectedChart.planData?.planOverview?.carbsGrams) ||
                                    Number(selectedChart.planData?.carbsGrams) ||
                                    0}{" "}
                                  g
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Healthy Fats</p>
                                <p className="text-lg font-bold text-yellow-400">
                                  {Number(selectedChart.planData?.planOverview?.fatGrams) ||
                                    Number(selectedChart.planData?.fatGrams) ||
                                    0}{" "}
                                  g
                                </p>
                              </div>
                            </div>

                            {(selectedChart.planData?.planOverview?.focus ||
                              selectedChart.planData?.planOverview?.notes) && (
                              <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-lg text-xs text-gray-300 flex items-start space-x-2">
                                <FiInfo className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                  {selectedChart.planData.planOverview.focus && (
                                    <p className="font-semibold text-white mb-0.5">
                                      Focus: {selectedChart.planData.planOverview.focus}
                                    </p>
                                  )}
                                  {selectedChart.planData.planOverview.notes && (
                                    <p className="text-gray-400">
                                      {selectedChart.planData.planOverview.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Morning Routine */}
                          {selectedChart.planData?.morningRoutine &&
                            (selectedChart.planData.morningRoutine.timing ||
                              selectedChart.planData.morningRoutine.description ||
                              selectedChart.planData.morningRoutine.hydration) && (
                              <div className="p-4 bg-gradient-to-r from-amber-950/20 to-orange-950/10 border border-amber-800/30 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
                                    <FiSun className="w-4 h-4" />
                                    <span>Morning Routine</span>
                                  </div>
                                  {selectedChart.planData.morningRoutine.timing && (
                                    <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
                                      {selectedChart.planData.morningRoutine.timing}
                                    </span>
                                  )}
                                </div>
                                {selectedChart.planData.morningRoutine.description && (
                                  <p className="text-sm text-gray-300">
                                    {selectedChart.planData.morningRoutine.description}
                                  </p>
                                )}
                                {selectedChart.planData.morningRoutine.instructions && (
                                  <p className="text-xs text-gray-400">
                                    {selectedChart.planData.morningRoutine.instructions}
                                  </p>
                                )}
                                {selectedChart.planData.morningRoutine.hydration && (
                                  <div className="flex items-center space-x-1.5 text-xs text-cyan-400 pt-1">
                                    <FiDroplet className="w-3.5 h-3.5" />
                                    <span>Daily Hydration: {selectedChart.planData.morningRoutine.hydration}</span>
                                  </div>
                                )}
                              </div>
                            )}

                          {/* 4. Structured Meal Sections */}
                          <div className="space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                              Structured Meals &amp; Options
                            </h3>

                            {renderMealSection(
                              "Breakfast",
                              <FiCoffee className="w-4 h-4 text-orange-400" />,
                              "Morning (8:30 - 9:00 AM)",
                              selectedChart.planData?.breakfast,
                            )}

                            {renderMealSection(
                              "Lunch",
                              <FiShoppingBag className="w-4 h-4 text-emerald-400" />,
                              "Midday (1:00 - 1:30 PM)",
                              selectedChart.planData?.lunch,
                            )}

                            {renderMealSection(
                              "Evening Snack",
                              <FiSunset className="w-4 h-4 text-purple-400" />,
                              "Late Afternoon (4:30 - 5:00 PM)",
                              selectedChart.planData?.eveningSnack,
                            )}

                            {renderMealSection(
                              "Dinner / Pre-Workout",
                              <FiMoon className="w-4 h-4 text-indigo-400" />,
                              "Evening (7:30 - 8:00 PM)",
                              selectedChart.planData?.dinner,
                            )}

                            {renderMealSection(
                              "Post-Workout Nutrition",
                              <FiZap className="w-4 h-4 text-pink-400" />,
                              "Within 30 mins after workout",
                              selectedChart.planData?.postWorkout,
                            )}
                          </div>

                          {/* 5. Weekly Guidelines */}
                          {selectedChart.planData?.weeklyGuidelines &&
                            selectedChart.planData.weeklyGuidelines.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                                  <FiList className="w-3.5 h-3.5" />
                                  <span>Weekly Guidelines &amp; Directives</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {selectedChart.planData.weeklyGuidelines.map((g, idx) => (
                                    <div
                                      key={g.id || idx}
                                      className="p-3 bg-gray-800/40 border border-gray-800 rounded-lg text-xs space-y-1"
                                    >
                                      <span className="inline-block px-2 py-0.5 rounded font-semibold text-[10px] uppercase bg-purple-900/50 text-purple-300 border border-purple-700/50">
                                        {g.category || "Guideline"}
                                      </span>
                                      <p className="text-gray-300 font-medium">{g.text}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* 6. Daily Macro Summary (Option 1 totals vs Targets) */}
                          {(() => {
                            const bOptions = selectedChart.planData?.breakfast?.options || [];
                            const lOptions = selectedChart.planData?.lunch?.options || [];
                            const sOptions = selectedChart.planData?.eveningSnack?.options || [];
                            const dOptions = selectedChart.planData?.dinner?.options || [];
                            const pOptions = selectedChart.planData?.postWorkout?.options || [];

                            const primaryMeals = [
                              bOptions[0],
                              lOptions[0],
                              sOptions[0],
                              dOptions[0],
                              pOptions[0],
                            ].filter(Boolean);

                            const sumCal = primaryMeals.reduce((acc, m) => acc + (Number(m?.calories) || 0), 0);
                            const sumProt = primaryMeals.reduce((acc, m) => acc + (Number(m?.protein) || 0), 0);
                            const sumCarb = primaryMeals.reduce((acc, m) => acc + (Number(m?.carbs) || 0), 0);
                            const sumFat = primaryMeals.reduce((acc, m) => acc + (Number(m?.fat) || 0), 0);

                            const targetCal =
                              Number(selectedChart.planData?.planOverview?.dailyCalories) ||
                              Number(selectedChart.planData?.dailyCalories) ||
                              0;
                            const targetProt =
                              Number(selectedChart.planData?.planOverview?.proteinGrams) ||
                              Number(selectedChart.planData?.proteinGrams) ||
                              0;
                            const targetCarb =
                              Number(selectedChart.planData?.planOverview?.carbsGrams) ||
                              Number(selectedChart.planData?.carbsGrams) ||
                              0;
                            const targetFat =
                              Number(selectedChart.planData?.planOverview?.fatGrams) ||
                              Number(selectedChart.planData?.fatGrams) ||
                              0;

                            return (
                              <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-xl space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                                    Daily Macro Summary (Option 1 Baseline)
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    Calculated vs Target
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-400">Calories</p>
                                    <p className="text-base font-bold text-purple-400">{sumCal} kcal</p>
                                    {targetCal > 0 && (
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        Target: {targetCal} kcal
                                      </p>
                                    )}
                                  </div>
                                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-400">Protein</p>
                                    <p className="text-base font-bold text-pink-400">{sumProt} g</p>
                                    {targetProt > 0 && (
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        Target: {targetProt}g
                                      </p>
                                    )}
                                  </div>
                                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-400">Carbs</p>
                                    <p className="text-base font-bold text-blue-400">{sumCarb} g</p>
                                    {targetCarb > 0 && (
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        Target: {targetCarb}g
                                      </p>
                                    )}
                                  </div>
                                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-400">Fat</p>
                                    <p className="text-base font-bold text-yellow-400">{sumFat} g</p>
                                    {targetFat > 0 && (
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        Target: {targetFat}g
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        /* Fallback to legacy planData.meals or standard meals JSON */
                        <div className="space-y-6">
                          {selectedChart.planData &&
                            (selectedChart.planData.dailyCalories ||
                              selectedChart.planData.proteinGrams) && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                                <div>
                                  <p className="text-xs text-gray-400">Target Calories</p>
                                  <p className="text-lg font-bold text-purple-400">
                                    {selectedChart.planData.dailyCalories || 0} kcal
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Protein</p>
                                  <p className="text-lg font-bold text-pink-400">
                                    {selectedChart.planData.proteinGrams || 0} g
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Carbs</p>
                                  <p className="text-lg font-bold text-blue-400">
                                    {selectedChart.planData.carbsGrams || 0} g
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Healthy Fats</p>
                                  <p className="text-lg font-bold text-yellow-400">
                                    {selectedChart.planData.fatGrams || 0} g
                                  </p>
                                </div>
                              </div>
                            )}

                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-400">
                              Structured Meals &amp; Guidelines
                            </h3>

                            {selectedChart.planData?.meals && selectedChart.planData.meals.length > 0 ? (
                              <div className="space-y-4">
                                {selectedChart.planData.meals.map((meal, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-gray-800/40 border border-gray-800 rounded-xl p-4"
                                  >
                                    <div className="flex items-center justify-between mb-3 border-b border-gray-700/60 pb-2">
                                      <h4 className="font-semibold text-white">{meal.name}</h4>
                                      {meal.time && (
                                        <span className="text-xs text-purple-400">{meal.time}</span>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {meal.items.map((item, itemIdx) => (
                                        <div
                                          key={itemIdx}
                                          className="flex items-center justify-between text-sm py-1 border-b border-gray-800/50 last:border-0"
                                        >
                                          <div>
                                            <span className="font-medium text-gray-200">
                                              {item.name}
                                            </span>
                                            {item.serving_size && (
                                              <span className="text-xs text-gray-400 ml-2">
                                                ({item.serving_size})
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-400 space-x-3">
                                            <span>P: {item.protein}g</span>
                                            <span>C: {item.carbs}g</span>
                                            <span>F: {item.fat}g</span>
                                            <span className="font-semibold text-white">
                                              {item.calories} kcal
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {selectedChart.meals && Object.keys(selectedChart.meals).length > 0 ? (
                              <div className="space-y-4">
                                {DEFAULT_MEAL_KEYS.map((key) => {
                                  const meal = selectedChart.meals[key];
                                  if (!meal || !meal.items || meal.items.length === 0) return null;

                                  return (
                                    <div
                                      key={key}
                                      className="bg-gray-800/40 border border-gray-800 rounded-xl p-4"
                                    >
                                      <div className="flex items-center justify-between mb-3 border-b border-gray-700/60 pb-2">
                                        <h4 className="font-semibold capitalize text-white">{key}</h4>
                                        {meal.total && (
                                          <span className="text-xs text-purple-400">
                                            Total: {meal.total.calories} kcal | P: {meal.total.protein}g
                                          </span>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        {meal.items.map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-between text-sm py-1 border-b border-gray-800/50 last:border-0"
                                          >
                                            <span className="font-medium text-gray-200">
                                              {item.name}
                                            </span>
                                            <div className="text-xs text-gray-400 space-x-3">
                                              <span>P: {item.protein}g</span>
                                              <span>C: {item.carbs}g</span>
                                              <span>F: {item.fat}g</span>
                                              <span className="font-semibold text-white">
                                                {item.calories} kcal
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
                    Select a plan from the list to view full details
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS / TRAINER INQUIRIES TAB */}
        {activeTab === "questions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Inquiry Threads</h3>
                <Button
                  onClick={() => setShowNewQuestionModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  + Ask Trainer
                </Button>
              </div>

              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardContent className="p-0 divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No questions asked yet. Click &quot;Ask Trainer&quot; to begin.
                    </div>
                  ) : (
                    conversations.map((convo) => {
                      const isSelected = selectedConvo?.id === convo.id;
                      return (
                        <div
                          key={convo.id}
                          onClick={() => loadConversationDetails(convo.id)}
                          className={`p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-purple-900/30 border-l-4 border-purple-500"
                              : "hover:bg-gray-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-white truncate max-w-[200px]">
                              {convo.subject || "General Inquiry"}
                            </h4>
                            <FiChevronRight className="w-4 h-4 text-gray-500" />
                          </div>
                          {convo.dietChart && (
                            <p className="text-xs text-purple-400 mt-1">
                              Re: {convo.dietChart.title}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(convo.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Conversation Thread */}
            <div className="lg:col-span-2">
              {selectedConvo ? (
                <Card className="bg-gray-900 border-gray-800 text-white flex flex-col h-[650px]">
                  <CardHeader className="border-b border-gray-800 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-white">
                          {selectedConvo.subject || "Consultation Thread"}
                        </CardTitle>
                        {selectedConvo.dietChart && (
                          <p className="text-xs text-purple-400 mt-1">
                            Referenced Diet Chart: {selectedConvo.dietChart.title}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        Thread ID: {selectedConvo.id.slice(0, 8)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                    {convoLoading ? (
                      <div className="py-8 text-center text-gray-500 text-sm">Loading thread...</div>
                    ) : (
                      selectedConvo.messages.map((msg) => {
                        const isTrainer = msg.authorRole === "ADMIN";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isTrainer ? "items-start" : "items-end"
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  isTrainer
                                    ? "bg-purple-600/40 text-purple-300"
                                    : "bg-gray-800 text-gray-400"
                                }`}
                              >
                                {isTrainer ? "Trainer Harry" : "You"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                isTrainer
                                  ? "bg-gray-800 border border-gray-700 text-gray-100"
                                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                              }`}
                            >
                              {msg.body}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>

                  {/* Follow-up input form */}
                  <form
                    onSubmit={handleSendFollowUp}
                    className="p-4 border-t border-gray-800 flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      placeholder="Type a follow-up message to your trainer..."
                      value={followUpBody}
                      onChange={(e) => setFollowUpBody(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <Button
                      type="submit"
                      disabled={sendingMessage || !followUpBody.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl"
                    >
                      <FiSend className="w-4 h-4 mr-1" /> Send
                    </Button>
                  </form>
                </Card>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
                  Select a consultation thread to view messages
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Ask Trainer / New Question */}
        {showNewQuestionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Ask Trainer Harry
              </h3>
              <form onSubmit={handleCreateQuestion} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-300">Subject / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Diet substitution, Creatine timing"
                    value={newQuestionSubject}
                    onChange={(e) => setNewQuestionSubject(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300">
                    Related Diet Plan (Optional)
                  </label>
                  <select
                    value={newQuestionChartId}
                    onChange={(e) => setNewQuestionChartId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No specific chart</option>
                    {charts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300">Your Question</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what you would like advice or adjustments on..."
                    value={newQuestionBody}
                    onChange={(e) => setNewQuestionBody(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewQuestionModal(false)}
                    className="border-gray-700 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendingMessage || !newQuestionBody.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  >
                    {sendingMessage ? "Sending..." : "Submit Question"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
