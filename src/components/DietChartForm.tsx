"use client";
import { useEffect, useState, useMemo } from "react";
import { v4 as uuid } from "uuid";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import type { DietChart, Meals, MealItem, Macro } from "@/types/diet";

const DEFAULT_MEAL_KEYS = ["breakfast", "midmeal", "lunch", "snack", "dinner"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<DietChart> & { client_id?: string | null };
  onSaved: () => void;
};

function initializeMeals(initial?: Partial<DietChart>): Meals {
  const meals: Meals = {} as Meals;

  DEFAULT_MEAL_KEYS.forEach((key) => {
    meals[key] = {
      items: initial?.meals?.[key]?.items || [],
      total: initial?.meals?.[key]?.total || { protein: 0, carbs: 0, fat: 0, calories: 0 },
    } as any;
  });

  return meals;
}

function calculateMealTotals(meals: Meals): { meals: Meals; daily_total: Macro } {
  const updatedMeals = { ...meals } as Meals;

  DEFAULT_MEAL_KEYS.forEach((key) => {
    const meal = updatedMeals[key];
    if (meal && meal.items) {
      const total = meal.items.reduce(
        (acc, item) => ({
          protein: acc.protein + (item.protein || 0),
          carbs: acc.carbs + (item.carbs || 0),
          fat: acc.fat + (item.fat || 0),
          calories: acc.calories + (item.calories || 0),
        }),
        { protein: 0, carbs: 0, fat: 0, calories: 0 }
      );
      updatedMeals[key] = { ...meal, total } as any;
    }
  });

  const daily_total = DEFAULT_MEAL_KEYS.reduce(
    (acc, key) => {
      const meal = updatedMeals[key];
      if (meal?.total) {
        return {
          protein: acc.protein + meal.total.protein,
          carbs: acc.carbs + meal.total.carbs,
          fat: acc.fat + meal.total.fat,
          calories: acc.calories + meal.total.calories,
        };
      }
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return { meals: updatedMeals, daily_total };
}

export default function DietChartForm({ open, onClose, initial, onSaved }: Props) {
  const editing = Boolean(initial?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: initial?.title || "",
    description: (initial as any)?.description || "",
    client_name: initial?.client_name || "",
    active: initial?.active ?? true,
  });

  const [meals, setMeals] = useState<Meals>(() => initializeMeals(initial));
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [clientId, setClientId] = useState<string | null>(initial?.client_id || null);
  const [selectedClientName, setSelectedClientName] = useState<string>(initial?.client_name || "");

  // ✅ Reset form when modal opens or initial changes
  useEffect(() => {
    if (!open) return;
    setFormData({
      title: initial?.title || "",
      description: (initial as any)?.description || "",
      client_name: initial?.client_name || "",
      active: initial?.active ?? true,
    });
    setMeals(initializeMeals(initial));
    setClientId(initial?.client_id || null);
    setSelectedClientName(initial?.client_name || "");
    setError(null);
  }, [open, initial]);

  // Fetch clients for dropdown from PostgreSQL
  useEffect(() => {
    if (!open) return;

    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        } else {
          console.error('Failed to fetch clients');
          setClients([]);
        }
      } catch (err) {
        console.error("Unexpected error fetching clients:", err);
        setError("Unexpected error while fetching clients.");
      }
    };

    fetchClients();
  }, [open]);

  // ✅ Daily totals (memoized to avoid unnecessary recalculations)
  const dailyTotals = useMemo(() => calculateMealTotals(meals).daily_total, [meals]);

  const handleSave = async () => {
    setError(null);

    if (!formData.title.trim()) return setError("Title is required.");
    if (!clientId) return setError("Please select a client.");

    const { meals: mealsWithTotals } = calculateMealTotals(meals);
    setSaving(true);

    try {
      const chartData = {
        title: formData.title,
        description: formData.description,
        client_id: clientId,
        client_name: selectedClientName,
        active: formData.active,
        meals: mealsWithTotals,
      };

      const response = await fetch('/api/diet-charts', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: initial?.id, ...chartData } : chartData),
      });

      if (response.ok) {
        onSaved();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save diet chart.");
      }
    } catch (err: any) {
      console.error("Save diet chart error:", err);
      setError(err.message || "Failed to save diet chart.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Add new meal item
  const addMealItem = (mealKey: keyof Meals) => {
    setMeals((prev) => ({
      ...prev,
      [mealKey]: {
        ...prev[mealKey],
        items: [
          ...(prev[mealKey]?.items || []),
          {
            id: uuid(),
            name: "",
            protein: 0,
            carbs: 0,
            fat: 0,
            calories: 0,
          } as MealItem,
        ],
      },
    }));
  };

  const updateMealItem = (mealKey: keyof Meals, itemId: string, field: keyof MealItem, value: string | number) => {
    setMeals((prev) => ({
      ...prev,
      [mealKey]: {
        ...prev[mealKey],
        items:
          prev[mealKey]?.items?.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)) || [],
      },
    }));
  };

  const removeMealItem = (mealKey: keyof Meals, itemId: string) => {
    setMeals((prev) => ({
      ...prev,
      [mealKey]: {
        ...prev[mealKey],
        items: prev[mealKey]?.items?.filter((item) => item.id !== itemId) || [],
      },
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{editing ? "Edit Diet Chart" : "Create New Diet Chart"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Close">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {/* ✅ Form Fields */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Weight Loss Plan"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Brief description of the diet plan"
            />
          </div>

          {/* Client Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Client *</label>
            <select
              value={clientId || ""}
              onChange={(e) => {
                const val = e.target.value || null;
                setClientId(val);
                const selectedClient = clients.find((c) => c.id === val);
                setSelectedClientName(selectedClient?.name || "");
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {clientId && (
              <p className="text-sm text-gray-600 mt-1">Selected: {selectedClientName}</p>
            )}
          </div>

          {/* Active Checkbox */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          {/* ✅ Meals Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Meals</h3>
            <div className="space-y-4">
              {DEFAULT_MEAL_KEYS.map((mealKey) => (
                <div key={mealKey} className="border rounded-lg p-4">
                  <h4 className="font-medium capitalize mb-2">{mealKey}</h4>
                  <div className="space-y-2">
                    {meals[mealKey]?.items?.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateMealItem(mealKey, item.id, "name", e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 border rounded"
                          placeholder="Food item"
                        />
                        <div className="flex gap-2 flex-wrap">
                          {[
                            "protein",
                            "carbs",
                            "fat",
                            "calories",
                          ].map((field) => (
                            <input
                              key={field}
                              type="number"
                              value={(item as any)[field]}
                              onChange={(e) => updateMealItem(mealKey, item.id, field as keyof MealItem, parseFloat(e.target.value) || 0)}
                              className="w-full sm:w-16 px-2 py-1 border rounded"
                              placeholder={field[0].toUpperCase()}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => removeMealItem(mealKey, item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded self-start sm:self-auto"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addMealItem(mealKey)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                      <FiPlus size={16} />
                      Add item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ✅ Daily Totals */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Daily Totals</h4>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(dailyTotals).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-sm text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                  <div className="font-bold">{value}{key !== "calories" ? "g" : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ✅ Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.title.trim() || !clientId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
