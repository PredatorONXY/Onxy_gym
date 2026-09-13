"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import type { DietChart } from "@/types/diet";
import DietChartForm from "@/components/DietChartForm";

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [charts, setCharts] = useState<DietChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DietChart | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // ✅ Check authentication
  useEffect(() => {
    const initSession = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error("No session found");
        router.push("/auth/login");
        return;
      }
      setSession({ user: { id: userId } });
    };
    initSession();
  }, [router]);

  // ✅ Fetch all dashboard data after session is ready
  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  // ✅ Fetch users and charts
  async function fetchDashboardData() {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching dashboard data...");

      // ✅ Fetch all users (clients only)
      const usersResponse = await fetch('/api/clients');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsersList(usersData.clients || []);
      } else {
        console.error("Failed to fetch users");
        setUsersList([]);
      }

      // ✅ Fetch all diet charts (admin can see all charts)
      const chartsResponse = await fetch('/api/diet-charts');
      if (chartsResponse.ok) {
        const chartsData = await chartsResponse.json();
        setCharts(chartsData.dietCharts || []);
      } else {
        console.error("Failed to fetch diet charts");
        setCharts([]);
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate(chart: DietChart) {
    try {
      const duplicatedChart = {
        ...chart,
        id: undefined,
        title: `${chart.title} (Copy)`,
        createdAt: undefined,
        updatedAt: undefined,
      };

      const response = await fetch('/api/diet-charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedChart),
      });

      if (response.ok) {
        fetchDashboardData();
      } else {
        alert('Failed to duplicate chart');
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Error duplicating chart');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this diet chart?')) return;

    try {
      const response = await fetch(`/api/diet-charts?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDashboardData();
      } else {
        alert('Failed to delete chart');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting chart');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trainer Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage clients and diet plans</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* ✅ Users Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Clients ({usersList.length})</h2>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          {usersList.length === 0 ? (
            <div className="p-6 bg-white shadow rounded text-center">
              <p className="text-gray-500 mb-2">No clients registered yet.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersList.map((user) => (
                <li key={user.id} className="p-4 bg-white shadow rounded">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ✅ Diet Charts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Diet Charts ({charts.length})</h2>
            <button
              onClick={() => setFormOpen(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + Add Chart
            </button>
          </div>
          {charts.length === 0 ? (
            <div className="p-6 bg-white shadow rounded text-center">
              <p className="text-gray-500 mb-2">No diet charts available yet.</p>
              <button
                onClick={() => setFormOpen(true)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Create Your First Chart
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {charts.map((chart) => (
                <li key={chart.id} className="p-3 bg-white shadow rounded flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{chart.title}</div>
                    <div className="text-sm text-gray-600">{chart.client_name}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(chart);
                        setFormOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDuplicate(chart)} className="text-green-500 hover:text-green-700">
                      Duplicate
                    </button>
                    <button onClick={() => handleDelete(chart.id)} className="text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ✅ Diet Chart Form Modal */}
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
