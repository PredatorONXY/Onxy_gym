"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiFileText,
  FiMessageSquare,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiRefreshCw,
  FiSend,
  FiCheckCircle,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { DietChart } from "@/types/diet";
import DietChartForm from "@/components/DietChartForm";

interface ClientRecord {
  id: string;
  userId?: string;
  name: string;
  email: string;
  created_at: string;
  age?: number | null;
  gender?: string | null;
  goals?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  dietType?: string | null;
}

interface AdminMessage {
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

interface AdminConversation {
  id: string;
  subject?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    user?: {
      fullName?: string;
      email?: string;
    };
  };
  dietChart?: {
    id: string;
    title: string;
  } | null;
  messages: AdminMessage[];
}

export default function TrainerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"clients" | "charts" | "inquiries">("clients");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [charts, setCharts] = useState<DietChart[]>([]);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<AdminConversation | null>(null);

  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DietChart | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/dashboard/client");
      return;
    }

    fetchDashboardData();
  }, [user, authLoading, router]);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);

    try {
      const [clientsRes, chartsRes, convosRes] = await Promise.all([
        apiFetch<{ clients: ClientRecord[] }>("/clients").catch(() => ({ clients: [] })),
        apiFetch<DietChart[]>("/diet-charts").catch(() => []),
        apiFetch<AdminConversation[]>("/admin/conversations").catch(() => []),
      ]);

      setClients(clientsRes.clients || []);
      setCharts(chartsRes || []);
      setConversations(convosRes || []);

      if (convosRes && convosRes.length > 0 && !selectedConvo) {
        setSelectedConvo(convosRes[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate(chart: DietChart) {
    try {
      await apiFetch("/diet-charts", {
        method: "POST",
        body: JSON.stringify({
          clientId: chart.client_id || ((chart as Record<string, unknown>).clientId as string),
          title: `${chart.title} (Copy)`,
          description: chart.description || undefined,
          active: false,
          meals: chart.meals,
          planData: ((chart as Record<string, unknown>).planData as Record<string, unknown>) || {},
        }),
      });

      fetchDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to duplicate chart");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this diet chart?")) return;

    try {
      await apiFetch(`/diet-charts/${id}`, { method: "DELETE" });
      fetchDashboardData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete chart");
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConvo || !replyBody.trim()) return;

    setReplying(true);
    try {
      const newMsg = await apiFetch<AdminMessage>(
        `/admin/conversations/${selectedConvo.id}/reply`,
        {
          method: "POST",
          body: JSON.stringify({ body: replyBody.trim() }),
        },
      );

      setSelectedConvo((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMsg],
              updatedAt: new Date().toISOString(),
            }
          : null,
      );
      setReplyBody("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setReplying(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-400">Loading trainer console...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center text-white">
        <p className="text-sm text-gray-400">Access restricted. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-gray-800">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Trainer &amp; Admin Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Admin Access
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Manage client nutrition plans, monitor physiological metrics, and consult with trainees.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={fetchDashboardData}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-lg text-sm text-gray-300"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Sync</span>
            </button>

            <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-800">
              <button
                onClick={() => setActiveTab("clients")}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "clients"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <FiUsers className="w-3.5 h-3.5" />
                <span>Clients ({clients.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("charts")}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "charts"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <FiFileText className="w-3.5 h-3.5" />
                <span>Diet Charts ({charts.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("inquiries")}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "inquiries"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <FiMessageSquare className="w-3.5 h-3.5" />
                <span>Client Messages ({conversations.length})</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* CLIENTS TAB */}
        {activeTab === "clients" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Registered Clients</h2>
            </div>

            {clients.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 text-white p-12 text-center text-gray-400">
                No clients registered yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map((c) => (
                  <Card
                    key={c.id}
                    className="bg-gray-900 border-gray-800 text-white hover:border-purple-500/40 transition-all shadow-lg"
                  >
                    <CardHeader className="pb-3 border-b border-gray-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-bold text-white">{c.name}</CardTitle>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                          {c.dietType || "Standard"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-2 text-sm text-gray-300">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 block">Weight:</span>
                          <span className="font-semibold text-white">
                            {c.weightKg ? `${c.weightKg} kg` : "Not set"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Height:</span>
                          <span className="font-semibold text-white">
                            {c.heightCm ? `${c.heightCm} cm` : "Not set"}
                          </span>
                        </div>
                      </div>
                      {c.goals && (
                        <div className="text-xs pt-2 border-t border-gray-800">
                          <span className="text-gray-500 block">Goals:</span>
                          <span className="text-gray-300">{c.goals}</span>
                        </div>
                      )}
                      <div className="pt-3 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditing({
                              id: "",
                              client_id: c.id,
                              client_name: c.name,
                              title: `${c.name}'s Custom Diet Plan`,
                              active: true,
                              meals: {},
                            });
                            setFormOpen(true);
                          }}
                          className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs border border-purple-500/40"
                        >
                          + Assign Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DIET CHARTS TAB */}
        {activeTab === "charts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Diet &amp; Nutrition Plans</h2>
                <p className="text-xs text-gray-400">
                  Create, assign, edit, or archive client diet plans
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center space-x-1"
              >
                <FiPlus className="w-4 h-4" />
                <span>Create New Plan</span>
              </Button>
            </div>

            {charts.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 text-white p-12 text-center text-gray-400">
                No diet charts created yet. Click &quot;Create New Plan&quot; to begin.
              </Card>
            ) : (
              <div className="space-y-3">
                {charts.map((chart) => (
                  <Card
                    key={chart.id}
                    className="bg-gray-900 border-gray-800 text-white p-4 hover:border-gray-700 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="font-bold text-white text-base">{chart.title}</h3>
                          {chart.active ? (
                            <span className="flex items-center text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                              <FiCheckCircle className="w-3 h-3 mr-1" /> Active
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                              Archived
                            </span>
                          )}
                        </div>
                        {chart.description && (
                          <p className="text-xs text-gray-400 mt-1">{chart.description}</p>
                        )}
                        <p className="text-xs text-purple-400/80 mt-1">
                          Client: {chart.client_name || (((chart as Record<string, unknown>).client as { user?: { fullName?: string } })?.user?.fullName) || "Assigned Client"}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(chart);
                            setFormOpen(true);
                          }}
                          className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                        >
                          <FiEdit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicate(chart)}
                          className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                        >
                          <FiCopy className="w-3.5 h-3.5 mr-1" /> Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(chart.id)}
                          className="border-red-900/50 text-red-400 hover:bg-red-900/20"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INQUIRIES & REPLIES TAB */}
        {activeTab === "inquiries" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations list */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-base font-bold text-white">Client Questions</h2>
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardContent className="p-0 divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No client inquiries received.
                    </div>
                  ) : (
                    conversations.map((convo) => {
                      const isSelected = selectedConvo?.id === convo.id;
                      const clientName =
                        convo.client?.user?.fullName || convo.client?.user?.email || "Trainee";
                      return (
                        <div
                          key={convo.id}
                          onClick={() => setSelectedConvo(convo)}
                          className={`p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-purple-900/30 border-l-4 border-purple-500"
                              : "hover:bg-gray-800/60"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-semibold text-white">
                              {convo.subject || "Consultation"}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {new Date(convo.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-purple-400 mt-1">From: {clientName}</p>
                          {convo.dietChart && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              Chart: {convo.dietChart.title}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Conversation Thread and Reply Form */}
            <div className="lg:col-span-2">
              {selectedConvo ? (
                <Card className="bg-gray-900 border-gray-800 text-white flex flex-col h-[650px]">
                  <CardHeader className="border-b border-gray-800 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold text-white">
                          {selectedConvo.subject || "Inquiry Thread"}
                        </CardTitle>
                        <p className="text-xs text-purple-400 mt-1">
                          Client:{" "}
                          {selectedConvo.client?.user?.fullName ||
                            selectedConvo.client?.user?.email ||
                            "Client"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(selectedConvo.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                    {selectedConvo.messages.map((msg) => {
                      const isTrainer = msg.authorRole === "ADMIN";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isTrainer ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                isTrainer
                                  ? "bg-purple-600/40 text-purple-300"
                                  : "bg-gray-800 text-gray-300"
                              }`}
                            >
                              {isTrainer ? "You (Trainer Harry)" : "Client"}
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
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                : "bg-gray-800 border border-gray-700 text-gray-100"
                            }`}
                          >
                            {msg.body}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>

                  {/* Reply Form */}
                  <form
                    onSubmit={handleSendReply}
                    className="p-4 border-t border-gray-800 flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      placeholder="Type your coaching guidance or diet adjustment..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <Button
                      type="submit"
                      disabled={replying || !replyBody.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl"
                    >
                      <FiSend className="w-4 h-4 mr-1" /> Reply
                    </Button>
                  </form>
                </Card>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
                  Select an inquiry thread to view messages and reply
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Form for Diet Chart Creation/Editing */}
        <DietChartForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          initial={editing ?? undefined}
          onSaved={() => {
            fetchDashboardData();
            setEditing(null);
          }}
        />
      </div>
    </div>
  );
}
