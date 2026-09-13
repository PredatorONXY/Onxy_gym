"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar, FiUsers, FiFileText, FiCheckCircle, FiXCircle } from "react-icons/fi";
import type { DietChart } from "@/types/diet";

export default function ClientDashboard() {
  const [charts, setCharts] = useState<DietChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [selectedChart, setSelectedChart] = useState<DietChart | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const DEFAULT_MEAL_KEYS = ["breakfast", "midmeal", "lunch", "snack", "dinner"] as const;

  useEffect(() => {
    const fetchSession = async () => {
      // Check localStorage for user session
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push("/auth/login");
        return;
      }
      setSession({ user: { id: userId } });
    };
    fetchSession();
  }, [router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchCharts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/diet-charts?clientId=${session.user.id}&active=true`);
        if (response.ok) {
          const data = await response.json();
          setCharts(data.dietCharts || []);
        } else {
          console.error("Failed to fetch diet charts");
          setCharts([]);
        }
      } catch (error) {
        console.error("Error fetching charts:", error);
        setCharts([]);
      }
      setLoading(false);
    };

    fetchCharts();
  }, [session]);

  const filteredCharts = charts.filter(chart =>
    chart.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-500">Loading your diet plans...</p>
    </div>
  </div>;

  if (!session) return <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
    <div className="text-center">
      <p className="text-gray-500">Please log in to see your diet charts.</p>
    </div>
  </div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your diet plans and track your progress</p>
        </div>

        {/* Search and Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Search diet plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <FiFileText className="w-8 h-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold text-gray-900">{charts.filter(c => c.active).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts List and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Your Diet Plans</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredCharts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? "No plans match your search." : "No diet plans available yet."}
                  </div>
                ) : (
                  filteredCharts.map((chart) => (
                    <div
                      key={chart.id}
                      onClick={() => setSelectedChart(chart)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedChart?.id === chart.id ? "bg-indigo-50 border-r-2 border-indigo-500" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{chart.title}</h3>
                          <p className="text-sm text-gray-500">{chart.client_name}</p>
                        </div>
                        <div className={`flex items-center ${chart.active ? "text-green-500" : "text-gray-400"}`}>
                          {chart.active ? <FiCheckCircle className="w-5 h-5" /> : <FiXCircle className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chart Details */}
          <div className="lg:col-span-2">
            {selectedChart ? (
              <div className="bg-white shadow rounded-lg">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-medium text-gray-900">{selectedChart.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{selectedChart.description}</p>
                </div>
                <div className="p-6">
                  {selectedChart.meals && Object.keys(selectedChart.meals).length > 0 ? (
                    <div className="space-y-6">
                      {DEFAULT_MEAL_KEYS.map((mealKey) => {
                        const meal = selectedChart!.meals![mealKey];
                        if (!meal || !meal.items || meal.items.length === 0) return null;

                        return (
                          <div key={mealKey} className="border rounded-lg p-4">
                            <h3 className="text-lg font-medium capitalize mb-3">{mealKey}</h3>
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr className="text-left">
                                  <th className="p-2">Food Item</th>
                                  <th className="p-2 text-right">Protein</th>
                                  <th className="p-2 text-right">Carbs</th>
                                  <th className="p-2 text-right">Fat</th>
                                  <th className="p-2 text-right">Calories</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {meal.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="p-2">{item.name}</td>
                                    <td className="p-2 text-right">{item.protein}g</td>
                                    <td className="p-2 text-right">{item.carbs}g</td>
                                    <td className="p-2 text-right">{item.fat}g</td>
                                    <td className="p-2 text-right">{item.calories}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50 font-medium">
                                <tr>
                                  <td className="p-2">Total</td>
                                  <td className="p-2 text-right">{(meal.total as any)?.protein || 0}g</td>
                                  <td className="p-2 text-right">{(meal.total as any)?.carbs || 0}g</td>
                                  <td className="p-2 text-right">{(meal.total as any)?.fat || 0}g</td>
                                  <td className="p-2 text-right">{(meal.total as any)?.calories || 0}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
                      Select a diet plan to view details
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
                Select a diet plan to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
