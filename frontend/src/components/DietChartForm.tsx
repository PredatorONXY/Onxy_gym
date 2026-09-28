"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { v4 as uuid } from "uuid";
import {
  FiPlus,
  FiTrash2,
  FiX,
  FiSearch,
  FiUser,
  FiArrowLeft,
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
  FiActivity,
  FiClock,
} from "react-icons/fi";
import type {
  DietChart,
  Meals,
  MealItem,
  Macro,
  ClientDetails,
  PlanOverview,
  MorningRoutine,
  MealOptionItem,
  IngredientItem,
  WeeklyGuidelineItem,
  ReferencePlanData,
} from "@/types/diet";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<DietChart> & { client_id?: string | null; clientId?: string | null };
  onSaved: () => void;
};

interface UserCandidate {
  id: string; // User ID
  email: string;
  fullName: string;
  role: string;
  client?: {
    id: string;
    weightKg?: number | null;
    heightCm?: number | null;
    dietType?: string | null;
  } | null;
}

const DEFAULT_GUIDELINE_CATEGORIES = [
  "Goal / Deficit",
  "Refeed",
  "Hydration",
  "Sleep",
  "Tracking",
  "Training",
  "Other",
];

export default function DietChartForm({ open, onClose, initial, onSaved }: Props) {
  const editing = Boolean(initial?.id);

  // Workflow steps: 'SELECT_USER' (initial step for new charts) or 'BUILDER'
  const [step, setStep] = useState<"SELECT_USER" | "BUILDER">(editing ? "BUILDER" : "SELECT_USER");

  // User Selection State
  const [userList, setUserList] = useState<UserCandidate[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserCandidate | null>(null);

  // Form Saving State
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Top-level Chart Meta
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  // Section 1: Client Details
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    name: "",
    age: "",
    weight: "",
    height: "",
    goal: "Fat loss & muscle retention",
    planType: "High-protein / Low-carb / Moderate-fat",
  });

  // Section 2: Plan Overview (Macro Targets)
  const [planOverview, setPlanOverview] = useState<PlanOverview>({
    dailyCalories: 1700,
    proteinGrams: 170,
    carbsGrams: 75,
    fatGrams: 58,
    focus: "Accelerated fat loss + muscle definition",
    notes: "",
  });

  // Section 3: Morning Routine
  const [morningRoutine, setMorningRoutine] = useState<MorningRoutine>({
    timing: "7:00 AM – 8:00 AM",
    description: "Lemon water or black coffee (optional), 5 g soaked fenugreek or cumin water.",
    hydration: "400–500 ml water before breakfast",
    notes: "",
  });

  // Section 4: Breakfast Options
  const [breakfastOptions, setBreakfastOptions] = useState<MealOptionItem[]>([
    {
      id: uuid(),
      name: "Egg & Paneer Scramble",
      ingredients: [
        { id: uuid(), name: "Whole eggs", quantity: "1", serving: "50 g" },
        { id: uuid(), name: "Egg whites", quantity: "5", serving: "160 g" },
        { id: uuid(), name: "Low-fat paneer", quantity: "50 g", serving: "diced" },
        { id: uuid(), name: "Onion + tomato", quantity: "50 g", serving: "chopped" },
        { id: uuid(), name: "Olive oil", quantity: "5 g", serving: "1 tsp" },
      ],
      recipe: "Sauté onion and tomato in olive oil. Add eggs and low-fat paneer; scramble until fluffy.",
      calories: 300,
      protein: 38,
      carbs: 8,
      fat: 12,
    },
    {
      id: uuid(),
      name: "Greek Yogurt Bowl",
      ingredients: [
        { id: uuid(), name: "Greek yogurt", quantity: "200 g", serving: "1 bowl" },
        { id: uuid(), name: "Chia seeds", quantity: "10 g", serving: "1 tbsp" },
        { id: uuid(), name: "Almonds", quantity: "8 g", serving: "6-8 pcs" },
        { id: uuid(), name: "Blueberries", quantity: "40 g", serving: "fresh" },
      ],
      recipe: "Mix yogurt with chia seeds. Top with crushed almonds and fresh blueberries.",
      calories: 295,
      protein: 27,
      carbs: 10,
      fat: 12,
    },
  ]);

  // Section 5: Lunch Options
  const [lunchOptions, setLunchOptions] = useState<MealOptionItem[]>([
    {
      id: uuid(),
      name: "Grilled Chicken & Veg Bowl",
      ingredients: [
        { id: uuid(), name: "Chicken breast", quantity: "170 g", serving: "raw weight" },
        { id: uuid(), name: "Broccoli", quantity: "100 g", serving: "steamed" },
        { id: uuid(), name: "Bell pepper", quantity: "50 g", serving: "sliced" },
        { id: uuid(), name: "Olive oil", quantity: "10 g", serving: "for grilling" },
      ],
      recipe: "Grill chicken breast with spices. Sauté vegetables in olive oil until tender-crisp.",
      calories: 450,
      protein: 42,
      carbs: 15,
      fat: 22,
    },
    {
      id: uuid(),
      name: "Paneer & Mushroom Stir-Fry",
      ingredients: [
        { id: uuid(), name: "Low-fat paneer", quantity: "120 g", serving: "cubed" },
        { id: uuid(), name: "Mushrooms", quantity: "100 g", serving: "sliced" },
        { id: uuid(), name: "Spinach", quantity: "50 g", serving: "leaves" },
        { id: uuid(), name: "Olive oil", quantity: "10 g", serving: "1 tbsp" },
      ],
      recipe: "Stir-fry paneer, mushrooms, and spinach in olive oil with garlic until golden.",
      calories: 430,
      protein: 37,
      carbs: 16,
      fat: 18,
    },
  ]);

  // Section 6: Evening Snack Options
  const [snackOptions, setSnackOptions] = useState<MealOptionItem[]>([
    {
      id: uuid(),
      name: "Whey Protein Shake",
      ingredients: [
        { id: uuid(), name: "Whey protein isolate", quantity: "1 scoop", serving: "30 g" },
        { id: uuid(), name: "Unsweetened almond milk", quantity: "150 ml", serving: "chilled" },
      ],
      recipe: "Blend or shake thoroughly in shaker cup.",
      calories: 140,
      protein: 26,
      carbs: 3,
      fat: 2,
    },
    {
      id: uuid(),
      name: "Egg Whites + Cucumber",
      ingredients: [
        { id: uuid(), name: "Hard-boiled egg whites", quantity: "4", serving: "130 g" },
        { id: uuid(), name: "Fresh cucumber", quantity: "100 g", serving: "sliced" },
      ],
      recipe: "Season with black pepper and pink Himalayan salt.",
      calories: 180,
      protein: 15,
      carbs: 4,
      fat: 0,
    },
  ]);

  // Section 7: Dinner / Pre-Workout Options
  const [dinnerOptions, setDinnerOptions] = useState<MealOptionItem[]>([
    {
      id: uuid(),
      name: "Chicken Sweet Potato Bowl",
      ingredients: [
        { id: uuid(), name: "Chicken breast", quantity: "150 g", serving: "grilled" },
        { id: uuid(), name: "Sweet potato", quantity: "70 g", serving: "boiled / baked" },
        { id: uuid(), name: "Broccoli", quantity: "50 g", serving: "steamed" },
        { id: uuid(), name: "Olive oil", quantity: "5 g", serving: "1 tsp" },
      ],
      recipe: "Grill chicken with herbs. Serve alongside mashed sweet potato and steamed broccoli.",
      calories: 420,
      protein: 43,
      carbs: 20,
      fat: 15,
    },
    {
      id: uuid(),
      name: "Paneer Egg Wrap",
      ingredients: [
        { id: uuid(), name: "Low-fat paneer", quantity: "100 g", serving: "grated" },
        { id: uuid(), name: "Egg whites", quantity: "3", serving: "100 g" },
        { id: uuid(), name: "Whole wheat roti dough", quantity: "35 g", serving: "1 flat roti" },
        { id: uuid(), name: "Olive oil", quantity: "5 g", serving: "brushing" },
      ],
      recipe: "Sauté paneer with spices. Prepare egg-white omelet and roll inside whole wheat roti.",
      calories: 445,
      protein: 35,
      carbs: 25,
      fat: 15,
    },
  ]);

  // Section 8: Post-Workout Options
  const [postWorkoutOptions, setPostWorkoutOptions] = useState<MealOptionItem[]>([
    {
      id: uuid(),
      name: "Whey Protein Isolate",
      ingredients: [
        { id: uuid(), name: "Whey protein isolate", quantity: "1 scoop", serving: "30 g" },
        { id: uuid(), name: "Water", quantity: "300 ml", serving: "room temp" },
      ],
      recipe: "Consume within 30 minutes post-training session.",
      calories: 120,
      protein: 27,
      carbs: 1,
      fat: 1,
    },
    {
      id: uuid(),
      name: "Boiled Egg Whites",
      ingredients: [
        { id: uuid(), name: "Egg whites", quantity: "5", serving: "160 g" },
      ],
      recipe: "Lightly seasoned with black salt.",
      calories: 85,
      protein: 18,
      carbs: 1,
      fat: 0,
    },
  ]);

  // Section 9: Weekly Guidelines
  const [guidelines, setGuidelines] = useState<WeeklyGuidelineItem[]>([
    {
      id: uuid(),
      category: "Goal / Deficit",
      text: "Maintain targeted deficit for 10–12 days, then schedule a refeed day (+50g carbs).",
    },
    {
      id: uuid(),
      category: "Hydration",
      text: "Drink minimum 3.5 – 4.0 Liters of water daily.",
    },
    {
      id: uuid(),
      category: "Sleep",
      text: "Aim for 7 to 8 hours of uninterrupted restorative sleep every night.",
    },
    {
      id: uuid(),
      category: "Tracking",
      text: "Track progress via waist measurements, mirror definition, and gym performance—not just scale.",
    },
  ]);

  // Fetch users automatically when opened
  const fetchRegisteredUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      // Fetch users with role=USER
      const res = await apiFetch<UserCandidate[]>("/admin/users?role=USER");
      const filtered = (res || []).filter((u) => u.role === "USER");
      setUserList(filtered);
    } catch {
      // Fallback to /clients endpoint if /admin/users had an issue
      try {
        const fallback = await apiFetch<{ clients: Array<{ id: string; userId?: string; name: string; email: string }> }>("/clients");
        const mapped: UserCandidate[] = (fallback.clients || []).map((c) => ({
          id: c.userId || c.id,
          fullName: c.name,
          email: c.email,
          role: "USER",
          client: { id: c.id },
        }));
        setUserList(mapped);
      } catch {
        setUsersError("Unable to load users. Try again.");
      }
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchRegisteredUsers();

    if (initial?.id) {
      setStep("BUILDER");
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setActive(initial.active ?? true);

      // Pre-populate reference plan data if present
      const pd = initial.planData as ReferencePlanData | undefined;
      if (pd) {
        if (pd.clientDetails) setClientDetails(pd.clientDetails);
        if (pd.planOverview) setPlanOverview(pd.planOverview);
        if (pd.morningRoutine) setMorningRoutine(pd.morningRoutine);
        if (pd.breakfast?.options) setBreakfastOptions(pd.breakfast.options);
        if (pd.lunch?.options) setLunchOptions(pd.lunch.options);
        if (pd.eveningSnack?.options) setSnackOptions(pd.eveningSnack.options);
        if (pd.dinner?.options) setDinnerOptions(pd.dinner.options);
        if (pd.postWorkout?.options) setPostWorkoutOptions(pd.postWorkout.options);
        if (pd.weeklyGuidelines) setGuidelines(pd.weeklyGuidelines);
      }

      // If initial has client info
      const clientInfo = initial.client?.user;
      if (clientInfo) {
        setSelectedUser({
          id: clientInfo.id,
          fullName: clientInfo.fullName || initial.client_name || "Client",
          email: clientInfo.email || "",
          role: "USER",
          client: { id: initial.client_id || initial.clientId || "" },
        });
        setClientDetails((prev) => ({
          ...prev,
          name: clientInfo.fullName || prev.name,
        }));
      }
    } else {
      setStep("SELECT_USER");
      setSelectedUser(null);
      setTitle("");
      setDescription("");
      setActive(true);
    }
  }, [open, initial, fetchRegisteredUsers]);

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    const q = userSearchTerm.trim().toLowerCase();
    if (!q) return userList;
    return userList.filter(
      (u) =>
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }, [userList, userSearchTerm]);

  // User Selection Handler
  function handleSelectUser(candidate: UserCandidate) {
    setSelectedUser(candidate);
    setTitle(`${candidate.fullName}'s Personalized Nutrition Plan`);
    setDescription(`Comprehensive diet chart and nutrition guidelines for ${candidate.fullName}.`);
    setClientDetails((prev) => ({
      ...prev,
      name: candidate.fullName,
      weight: candidate.client?.weightKg ? String(candidate.client.weightKg) : prev.weight,
      height: candidate.client?.heightCm ? `${candidate.client.heightCm} cm` : prev.height,
      dietType: candidate.client?.dietType ? String(candidate.client.dietType) : prev.planType,
    }));
    setStep("BUILDER");
  }

  // Calculate live macro totals (Option 1 of each meal as standard baseline)
  const calculatedMacros = useMemo<Macro>(() => {
    const sumOption = (opt?: MealOptionItem) => ({
      calories: Number(opt?.calories) || 0,
      protein: Number(opt?.protein) || 0,
      carbs: Number(opt?.carbs) || 0,
      fat: Number(opt?.fat) || 0,
    });

    const b = sumOption(breakfastOptions[0]);
    const l = sumOption(lunchOptions[0]);
    const s = sumOption(snackOptions[0]);
    const d = sumOption(dinnerOptions[0]);
    const p = sumOption(postWorkoutOptions[0]);

    return {
      calories: b.calories + l.calories + s.calories + d.calories + p.calories,
      protein: b.protein + l.protein + s.protein + d.protein + p.protein,
      carbs: b.carbs + l.carbs + s.carbs + d.carbs + p.carbs,
      fat: b.fat + l.fat + s.fat + d.fat + p.fat,
    };
  }, [breakfastOptions, lunchOptions, snackOptions, dinnerOptions, postWorkoutOptions]);

  // Helpers for Meal Option management
  function handleAddOption(
    setter: React.Dispatch<React.SetStateAction<MealOptionItem[]>>,
    defaultName: string,
  ) {
    setter((prev) => [
      ...prev,
      {
        id: uuid(),
        name: `${defaultName} ${prev.length + 1}`,
        ingredients: [{ id: uuid(), name: "", quantity: "", serving: "" }],
        recipe: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    ]);
  }

  function handleRemoveOption(
    setter: React.Dispatch<React.SetStateAction<MealOptionItem[]>>,
    id: string,
  ) {
    setter((prev) => (prev.length > 1 ? prev.filter((o) => o.id !== id) : prev));
  }

  function handleUpdateOption(
    setter: React.Dispatch<React.SetStateAction<MealOptionItem[]>>,
    id: string,
    field: keyof MealOptionItem,
    val: unknown,
  ) {
    setter((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: val } : o)),
    );
  }

  function handleAddIngredient(
    setter: React.Dispatch<React.SetStateAction<MealOptionItem[]>>,
    optionId: string,
  ) {
    setter((prev) =>
      prev.map((o) =>
        o.id === optionId
          ? {
              ...o,
              ingredients: [
                ...o.ingredients,
                { id: uuid(), name: "", quantity: "", serving: "" },
              ],
            }
          : o,
      ),
    );
  }

  function handleRemoveIngredient(
    setter: React.Dispatch<React.SetStateAction<MealOptionItem[]>>,
    optionId: string,
    ingId: string,
  ) {
    setter((prev) =>
      prev.map((o) =>
        o.id === optionId
          ? {
              ...o,
              ingredients: o.ingredients.filter((i) => i.id !== ingId),
            }
          : o,
      ),
    );
  }

  function handleUpdateIngredient(
    setter: React.Dispatch<React.SetStateAction<MealOptionItem[]>>,
    optionId: string,
    ingId: string,
    field: keyof IngredientItem,
    val: string,
  ) {
    setter((prev) =>
      prev.map((o) =>
        o.id === optionId
          ? {
              ...o,
              ingredients: o.ingredients.map((i) =>
                i.id === ingId ? { ...i, [field]: val } : i,
              ),
            }
          : o,
      ),
    );
  }

  // Guidelines management
  function handleAddGuideline() {
    setGuidelines((prev) => [
      ...prev,
      { id: uuid(), category: "Training", text: "" },
    ]);
  }

  function handleRemoveGuideline(id: string) {
    setGuidelines((prev) => prev.filter((g) => g.id !== id));
  }

  function handleUpdateGuideline(id: string, field: keyof WeeklyGuidelineItem, val: string) {
    setGuidelines((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: val } : g)),
    );
  }

  // Save Diet Chart Handler
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) {
      setSaveError("Please select a valid user first.");
      setStep("SELECT_USER");
      return;
    }

    if (!title.trim()) {
      setSaveError("Chart title is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // Reference-style structured plan data payload
      const referencePlanData: ReferencePlanData = {
        clientDetails: {
          name: clientDetails.name || selectedUser.fullName,
          age: clientDetails.age || "",
          weight: clientDetails.weight || "",
          height: clientDetails.height || "",
          goal: clientDetails.goal || "",
          planType: clientDetails.planType || "",
        },
        planOverview: {
          dailyCalories: Number(planOverview.dailyCalories) || 0,
          proteinGrams: Number(planOverview.proteinGrams) || 0,
          carbsGrams: Number(planOverview.carbsGrams) || 0,
          fatGrams: Number(planOverview.fatGrams) || 0,
          focus: planOverview.focus || "",
          notes: planOverview.notes || "",
        },
        morningRoutine,
        breakfast: { options: breakfastOptions },
        lunch: { options: lunchOptions },
        eveningSnack: { options: snackOptions },
        dinner: { options: dinnerOptions },
        postWorkout: { options: postWorkoutOptions },
        weeklyGuidelines: guidelines,
        calculatedTotals: calculatedMacros,
      };

      // Backward-compatible standard meals JSON payload
      const mapOptionToMealItems = (opts: MealOptionItem[]): MealItem[] =>
        opts.flatMap((opt) =>
          opt.ingredients.map((ing) => ({
            id: ing.id,
            name: `${opt.name}: ${ing.name}`,
            serving_size: ing.quantity ? `${ing.quantity} (${ing.serving || ""})` : ing.serving,
            protein: Math.round((opt.protein || 0) / Math.max(opt.ingredients.length, 1)),
            carbs: Math.round((opt.carbs || 0) / Math.max(opt.ingredients.length, 1)),
            fat: Math.round((opt.fat || 0) / Math.max(opt.ingredients.length, 1)),
            calories: Math.round((opt.calories || 0) / Math.max(opt.ingredients.length, 1)),
          })),
        );

      const legacyMeals: Meals = {
        breakfast: {
          items: mapOptionToMealItems(breakfastOptions),
          total: {
            calories: breakfastOptions[0]?.calories || 0,
            protein: breakfastOptions[0]?.protein || 0,
            carbs: breakfastOptions[0]?.carbs || 0,
            fat: breakfastOptions[0]?.fat || 0,
          },
        },
        lunch: {
          items: mapOptionToMealItems(lunchOptions),
          total: {
            calories: lunchOptions[0]?.calories || 0,
            protein: lunchOptions[0]?.protein || 0,
            carbs: lunchOptions[0]?.carbs || 0,
            fat: lunchOptions[0]?.fat || 0,
          },
        },
        snack: {
          items: mapOptionToMealItems(snackOptions),
          total: {
            calories: snackOptions[0]?.calories || 0,
            protein: snackOptions[0]?.protein || 0,
            carbs: snackOptions[0]?.carbs || 0,
            fat: snackOptions[0]?.fat || 0,
          },
        },
        dinner: {
          items: mapOptionToMealItems(dinnerOptions),
          total: {
            calories: dinnerOptions[0]?.calories || 0,
            protein: dinnerOptions[0]?.protein || 0,
            carbs: dinnerOptions[0]?.carbs || 0,
            fat: dinnerOptions[0]?.fat || 0,
          },
        },
      };

      if (editing && initial?.id) {
        // Edit existing chart
        await apiFetch(`/diet-charts/${initial.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            active,
            meals: legacyMeals,
            planData: referencePlanData,
          }),
        });
      } else {
        // Create new chart: Always creates a new record preserving history
        await apiFetch("/diet-charts", {
          method: "POST",
          body: JSON.stringify({
            userId: selectedUser.id,
            clientId: selectedUser.client?.id || undefined,
            title: title.trim(),
            description: description.trim() || undefined,
            active,
            meals: legacyMeals,
            planData: referencePlanData,
          }),
        });
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save diet chart.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-5xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/80 sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editing ? "Edit Nutrition Plan" : "Create New Diet Chart"}
              </h2>
              <p className="text-xs text-gray-400">
                {step === "SELECT_USER"
                  ? "Step 1 of 2: Select the trainee who will receive this nutrition plan"
                  : "Step 2 of 2: Build personalized multi-option diet plan"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* STEP 1: CHOOSE USER SCREEN                                               */}
          {/* ========================================================================= */}
          {step === "SELECT_USER" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Choose User</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Select a registered client to create their tailored diet chart.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* User List States */}
              {usersLoading ? (
                <div className="p-12 text-center text-gray-400 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-sm">Fetching registered users...</p>
                </div>
              ) : usersError ? (
                <div className="p-8 text-center bg-red-950/40 border border-red-500/40 rounded-xl space-y-3">
                  <FiAlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                  <p className="text-sm text-red-300">{usersError}</p>
                  <Button
                    onClick={fetchRegisteredUsers}
                    size="sm"
                    className="bg-red-900/60 hover:bg-red-800 text-white border border-red-600/40"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
                  </Button>
                </div>
              ) : userList.length === 0 ? (
                <div className="p-12 text-center bg-gray-950/50 border border-gray-800 rounded-xl text-gray-400">
                  <FiUser className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-base font-semibold text-white">No registered users yet.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Users with role USER will automatically appear here once registered.
                  </p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center bg-gray-950/50 border border-gray-800 rounded-xl text-gray-400">
                  <p className="text-sm text-gray-300">
                    No users found matching &quot;{userSearchTerm}&quot;.
                  </p>
                  <button
                    onClick={() => setUserSearchTerm("")}
                    className="mt-2 text-xs text-purple-400 hover:underline"
                  >
                    Clear search query
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>Registered Users ({filteredUsers.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredUsers.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="bg-gray-950 border border-gray-800 hover:border-purple-500/50 rounded-xl p-4 transition-all flex flex-col justify-between space-y-3 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                              {candidate.fullName ? candidate.fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                                {candidate.fullName}
                              </h4>
                              <p className="text-xs text-gray-400">{candidate.email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                            Client
                          </span>
                        </div>

                        {/* Optional Meta Badges */}
                        <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                          {candidate.client?.weightKg && (
                            <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                              Weight: {candidate.client.weightKg} kg
                            </span>
                          )}
                          {candidate.client?.dietType && (
                            <span className="bg-purple-950/40 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                              {candidate.client.dietType}
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-900 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSelectUser(candidate)}
                            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-md"
                          >
                            <FiCheck className="w-3.5 h-3.5 mr-1.5" /> Choose User
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: DIET CHART BUILDER                                                */}
          {/* ========================================================================= */}
          {step === "BUILDER" && (
            <form onSubmit={handleSave} className="space-y-8">
              {/* SELECTED USER BANNER */}
              <div className="p-4 bg-gradient-to-r from-purple-950/70 via-gray-900 to-pink-950/60 border border-purple-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-200">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold block">
                      Creating Diet Chart For
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {selectedUser?.fullName || clientDetails.name || "Selected Client"}
                    </h3>
                    <p className="text-xs text-gray-400">{selectedUser?.email}</p>
                  </div>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => setStep("SELECT_USER")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-800 text-xs text-purple-300 border border-gray-700 transition-colors self-start sm:self-auto"
                  >
                    <FiArrowLeft className="w-3.5 h-3.5" />
                    <span>Change User</span>
                  </button>
                )}
              </div>

              {saveError && (
                <div className="p-3.5 bg-red-950/70 border border-red-500/50 rounded-xl text-red-300 text-xs">
                  {saveError}
                </div>
              )}

              {/* BASIC PLAN META */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Plan Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Personalized Nutrition & Hypertrophy Plan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center space-x-2.5 p-2.5 bg-gray-950 border border-gray-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium text-gray-200">
                      Set as Active Plan for User
                    </span>
                  </label>
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Plan Description / Intro</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description or greeting for the trainee..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 1: CLIENT DETAILS                                                 */}
              {/* ========================================================================= */}
              <div className="p-5 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-4">
                <div className="border-b border-gray-800 pb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
                    Client Details
                  </h3>
                  <p className="text-xs text-gray-400">
                    Personalized biometrics and training parameters
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Client Name</label>
                    <input
                      type="text"
                      readOnly
                      value={clientDetails.name}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 text-xs cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Age (years)</label>
                    <input
                      type="text"
                      placeholder="e.g. 29"
                      value={clientDetails.age || ""}
                      onChange={(e) => setClientDetails({ ...clientDetails, age: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Weight (kg)</label>
                    <input
                      type="text"
                      placeholder="e.g. 79.5"
                      value={clientDetails.weight || ""}
                      onChange={(e) => setClientDetails({ ...clientDetails, weight: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Height</label>
                    <input
                      type="text"
                      placeholder="e.g. 5'8'' or 173 cm"
                      value={clientDetails.height || ""}
                      onChange={(e) => setClientDetails({ ...clientDetails, height: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Goal</label>
                    <input
                      type="text"
                      placeholder="e.g. Visible abs, fat loss & muscle retention"
                      value={clientDetails.goal || ""}
                      onChange={(e) => setClientDetails({ ...clientDetails, goal: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Plan Type</label>
                    <input
                      type="text"
                      placeholder="e.g. High-protein / Low-carb / Moderate-fat"
                      value={clientDetails.planType || ""}
                      onChange={(e) => setClientDetails({ ...clientDetails, planType: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 2: PLAN OVERVIEW                                                  */}
              {/* ========================================================================= */}
              <div className="p-5 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-4">
                <div className="border-b border-gray-800 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
                      Plan Overview &amp; Macro Targets
                    </h3>
                    <p className="text-xs text-gray-400">
                      Daily calorie and macronutrient targets set by the trainer
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                    <label className="text-[11px] text-gray-400 block">Daily Calories</label>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <input
                        type="number"
                        min={0}
                        value={planOverview.dailyCalories || ""}
                        onChange={(e) =>
                          setPlanOverview({ ...planOverview, dailyCalories: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-purple-300 font-bold text-sm"
                      />
                      <span className="text-xs text-gray-400">kcal</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                    <label className="text-[11px] text-gray-400 block">Daily Protein</label>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <input
                        type="number"
                        min={0}
                        value={planOverview.proteinGrams || ""}
                        onChange={(e) =>
                          setPlanOverview({ ...planOverview, proteinGrams: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-pink-300 font-bold text-sm"
                      />
                      <span className="text-xs text-gray-400">g</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                    <label className="text-[11px] text-gray-400 block">Carbohydrates</label>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <input
                        type="number"
                        min={0}
                        value={planOverview.carbsGrams || ""}
                        onChange={(e) =>
                          setPlanOverview({ ...planOverview, carbsGrams: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-blue-300 font-bold text-sm"
                      />
                      <span className="text-xs text-gray-400">g</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
                    <label className="text-[11px] text-gray-400 block">Healthy Fat</label>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <input
                        type="number"
                        min={0}
                        value={planOverview.fatGrams || ""}
                        onChange={(e) =>
                          setPlanOverview({ ...planOverview, fatGrams: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-yellow-300 font-bold text-sm"
                      />
                      <span className="text-xs text-gray-400">g</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Focus / Trainer Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Accelerated fat loss + muscle definition"
                    value={planOverview.focus || ""}
                    onChange={(e) => setPlanOverview({ ...planOverview, focus: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 3: MORNING ROUTINE                                                */}
              {/* ========================================================================= */}
              <div className="p-5 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-4">
                <div className="border-b border-gray-800 pb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400 flex items-center space-x-2">
                    <FiClock className="w-4 h-4" />
                    <span>Morning Routine</span>
                  </h3>
                  <p className="text-xs text-gray-400">Wake-up protocol and hydration</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Routine Timing</label>
                    <input
                      type="text"
                      placeholder="e.g. 7:00 AM – 8:00 AM"
                      value={morningRoutine.timing || ""}
                      onChange={(e) => setMorningRoutine({ ...morningRoutine, timing: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Pre-Breakfast Hydration</label>
                    <input
                      type="text"
                      placeholder="e.g. 400–500 ml water before breakfast"
                      value={morningRoutine.hydration || ""}
                      onChange={(e) => setMorningRoutine({ ...morningRoutine, hydration: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-400 block mb-1">Instructions &amp; Routine Details</label>
                    <textarea
                      rows={2}
                      placeholder="- Lemon water or black coffee&#10;- 5 g soaked fenugreek or cumin water"
                      value={morningRoutine.description || ""}
                      onChange={(e) => setMorningRoutine({ ...morningRoutine, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* REUSABLE MEAL SECTION BUILDER COMPONENT                                   */}
              {/* ========================================================================= */}
              <MealSectionBuilder
                title="Breakfast"
                options={breakfastOptions}
                onAddOption={() => handleAddOption(setBreakfastOptions, "Breakfast Option")}
                onRemoveOption={(id) => handleRemoveOption(setBreakfastOptions, id)}
                onUpdateOption={(id, f, v) => handleUpdateOption(setBreakfastOptions, id, f, v)}
                onAddIngredient={(optId) => handleAddIngredient(setBreakfastOptions, optId)}
                onRemoveIngredient={(optId, ingId) =>
                  handleRemoveIngredient(setBreakfastOptions, optId, ingId)
                }
                onUpdateIngredient={(optId, ingId, f, v) =>
                  handleUpdateIngredient(setBreakfastOptions, optId, ingId, f, v)
                }
              />

              <MealSectionBuilder
                title="Lunch"
                options={lunchOptions}
                onAddOption={() => handleAddOption(setLunchOptions, "Lunch Option")}
                onRemoveOption={(id) => handleRemoveOption(setLunchOptions, id)}
                onUpdateOption={(id, f, v) => handleUpdateOption(setLunchOptions, id, f, v)}
                onAddIngredient={(optId) => handleAddIngredient(setLunchOptions, optId)}
                onRemoveIngredient={(optId, ingId) =>
                  handleRemoveIngredient(setLunchOptions, optId, ingId)
                }
                onUpdateIngredient={(optId, ingId, f, v) =>
                  handleUpdateIngredient(setLunchOptions, optId, ingId, f, v)
                }
              />

              <MealSectionBuilder
                title="Evening Snack"
                options={snackOptions}
                onAddOption={() => handleAddOption(setSnackOptions, "Snack Option")}
                onRemoveOption={(id) => handleRemoveOption(setSnackOptions, id)}
                onUpdateOption={(id, f, v) => handleUpdateOption(setSnackOptions, id, f, v)}
                onAddIngredient={(optId) => handleAddIngredient(setSnackOptions, optId)}
                onRemoveIngredient={(optId, ingId) =>
                  handleRemoveIngredient(setSnackOptions, optId, ingId)
                }
                onUpdateIngredient={(optId, ingId, f, v) =>
                  handleUpdateIngredient(setSnackOptions, optId, ingId, f, v)
                }
              />

              <MealSectionBuilder
                title="Dinner / Pre-Workout"
                options={dinnerOptions}
                onAddOption={() => handleAddOption(setDinnerOptions, "Dinner Option")}
                onRemoveOption={(id) => handleRemoveOption(setDinnerOptions, id)}
                onUpdateOption={(id, f, v) => handleUpdateOption(setDinnerOptions, id, f, v)}
                onAddIngredient={(optId) => handleAddIngredient(setDinnerOptions, optId)}
                onRemoveIngredient={(optId, ingId) =>
                  handleRemoveIngredient(setDinnerOptions, optId, ingId)
                }
                onUpdateIngredient={(optId, ingId, f, v) =>
                  handleUpdateIngredient(setDinnerOptions, optId, ingId, f, v)
                }
              />

              <MealSectionBuilder
                title="Post-Workout"
                options={postWorkoutOptions}
                onAddOption={() => handleAddOption(setPostWorkoutOptions, "Post-Workout Option")}
                onRemoveOption={(id) => handleRemoveOption(setPostWorkoutOptions, id)}
                onUpdateOption={(id, f, v) => handleUpdateOption(setPostWorkoutOptions, id, f, v)}
                onAddIngredient={(optId) => handleAddIngredient(setPostWorkoutOptions, optId)}
                onRemoveIngredient={(optId, ingId) =>
                  handleRemoveIngredient(setPostWorkoutOptions, optId, ingId)
                }
                onUpdateIngredient={(optId, ingId, f, v) =>
                  handleUpdateIngredient(setPostWorkoutOptions, optId, ingId, f, v)
                }
              />

              {/* ========================================================================= */}
              {/* SECTION 9: WEEKLY GUIDELINES                                              */}
              {/* ========================================================================= */}
              <div className="p-5 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-4">
                <div className="border-b border-gray-800 pb-2 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
                      Weekly Guidelines
                    </h3>
                    <p className="text-xs text-gray-400">
                      Coaching protocol, sleep, hydration, and monitoring rules
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddGuideline}
                    className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs border border-purple-500/40"
                  >
                    <FiPlus className="w-3.5 h-3.5 mr-1" /> Add Guideline
                  </Button>
                </div>

                <div className="space-y-3">
                  {guidelines.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-900/90 rounded-xl border border-gray-800"
                    >
                      <select
                        value={g.category}
                        onChange={(e) => handleUpdateGuideline(g.id, "category", e.target.value)}
                        className="w-full sm:w-44 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-purple-300 font-semibold focus:outline-none"
                      >
                        {DEFAULT_GUIDELINE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Guideline text or instructions..."
                        value={g.text}
                        onChange={(e) => handleUpdateGuideline(g.id, "text", e.target.value)}
                        className="flex-1 w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveGuideline(g.id)}
                        disabled={guidelines.length === 1}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded transition-colors self-end sm:self-auto disabled:opacity-30"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 10: REAL-TIME MACRO COMPARISON SUMMARY                            */}
              {/* ========================================================================= */}
              <div className="p-5 bg-gradient-to-r from-gray-950 via-purple-950/20 to-gray-950 border border-purple-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <FiActivity className="w-4 h-4 text-pink-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Daily Macro Summary
                    </h3>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Calculated from baseline meal options vs target
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-900/90 rounded-xl border border-gray-800/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      Calories
                    </span>
                    <p className="text-base font-bold text-purple-300">
                      {calculatedMacros.calories} kcal
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Target: {planOverview.dailyCalories || 0} kcal
                    </p>
                  </div>

                  <div className="p-3 bg-gray-900/90 rounded-xl border border-gray-800/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      Protein
                    </span>
                    <p className="text-base font-bold text-pink-300">
                      {calculatedMacros.protein} g
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Target: {planOverview.proteinGrams || 0} g
                    </p>
                  </div>

                  <div className="p-3 bg-gray-900/90 rounded-xl border border-gray-800/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      Carbohydrates
                    </span>
                    <p className="text-base font-bold text-blue-300">
                      {calculatedMacros.carbs} g
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Target: {planOverview.carbsGrams || 0} g
                    </p>
                  </div>

                  <div className="p-3 bg-gray-900/90 rounded-xl border border-gray-800/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      Healthy Fat
                    </span>
                    <p className="text-base font-bold text-yellow-300">
                      {calculatedMacros.fat} g
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Target: {planOverview.fatGrams || 0} g
                    </p>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-6"
                >
                  {saving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Plan...</span>
                    </div>
                  ) : editing ? (
                    "Update Diet Chart"
                  ) : (
                    "Save & Assign Diet Chart"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: MEAL SECTION BUILDER (Options, Ingredients, Recipes, Macros)
// =========================================================================
interface MealSectionBuilderProps {
  title: string;
  options: MealOptionItem[];
  onAddOption: () => void;
  onRemoveOption: (id: string) => void;
  onUpdateOption: (id: string, field: keyof MealOptionItem, val: unknown) => void;
  onAddIngredient: (optionId: string) => void;
  onRemoveIngredient: (optionId: string, ingId: string) => void;
  onUpdateIngredient: (
    optionId: string,
    ingId: string,
    field: keyof IngredientItem,
    val: string,
  ) => void;
}

function MealSectionBuilder({
  title,
  options,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateIngredient,
}: MealSectionBuilderProps) {
  return (
    <div className="p-5 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-4">
      <div className="border-b border-gray-800 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">
            {title}
          </h3>
          <p className="text-xs text-gray-400">
            Configure meal options, ingredients, instructions, and macros
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onAddOption}
          className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs border border-purple-500/40"
        >
          <FiPlus className="w-3.5 h-3.5 mr-1" /> Add Option
        </Button>
      </div>

      <div className="space-y-4">
        {options.map((option, optIdx) => (
          <div
            key={option.id}
            className="p-4 bg-gray-900/90 border border-gray-800 rounded-xl space-y-3"
          >
            {/* Option Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Option {optIdx + 1}
                </span>
                <input
                  type="text"
                  placeholder="Meal Name (e.g. Egg & Paneer Scramble)"
                  value={option.name}
                  onChange={(e) => onUpdateOption(option.id, "name", e.target.value)}
                  className="bg-transparent font-semibold text-white text-sm focus:outline-none border-b border-transparent focus:border-purple-400 px-1 py-0.5"
                />
              </div>

              <button
                type="button"
                onClick={() => onRemoveOption(option.id)}
                disabled={options.length === 1}
                className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors disabled:opacity-30"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Ingredients Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Ingredients
                </label>
                <button
                  type="button"
                  onClick={() => onAddIngredient(option.id)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                >
                  <FiPlus className="w-3 h-3" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {option.ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-gray-950 p-2 rounded-lg border border-gray-800/80"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Ingredient name (e.g. Chicken breast)"
                        value={ing.name}
                        onChange={(e) =>
                          onUpdateIngredient(option.id, ing.id, "name", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Quantity (e.g. 150 g)"
                        value={ing.quantity || ""}
                        onChange={(e) =>
                          onUpdateIngredient(option.id, ing.id, "quantity", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Serving notes (e.g. raw weight)"
                        value={ing.serving || ""}
                        onChange={(e) =>
                          onUpdateIngredient(option.id, ing.id, "serving", e.target.value)
                        }
                        className="w-full px-2.5 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onRemoveIngredient(option.id, ing.id)}
                        disabled={option.ingredients.length === 1}
                        className="text-gray-500 hover:text-red-400 p-1 transition-colors disabled:opacity-30"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipe / Prep */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Recipe / Preparation Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Cooking instructions or preparation details..."
                value={option.recipe || ""}
                onChange={(e) => onUpdateOption(option.id, "recipe", e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            {/* Option Macros */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-800/80">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-gray-400">Calories:</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={option.calories ?? ""}
                  onChange={(e) =>
                    onUpdateOption(option.id, "calories", Number(e.target.value))
                  }
                  className="w-16 px-1.5 py-0.5 bg-gray-950 border border-gray-800 rounded text-xs text-purple-300 font-bold"
                />
                <span className="text-[10px] text-gray-500">kcal</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-gray-400">Protein:</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={option.protein ?? ""}
                  onChange={(e) =>
                    onUpdateOption(option.id, "protein", Number(e.target.value))
                  }
                  className="w-16 px-1.5 py-0.5 bg-gray-950 border border-gray-800 rounded text-xs text-pink-300 font-bold"
                />
                <span className="text-[10px] text-gray-500">g</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-gray-400">Carbs:</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={option.carbs ?? ""}
                  onChange={(e) =>
                    onUpdateOption(option.id, "carbs", Number(e.target.value))
                  }
                  className="w-16 px-1.5 py-0.5 bg-gray-950 border border-gray-800 rounded text-xs text-blue-300 font-bold"
                />
                <span className="text-[10px] text-gray-500">g</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-gray-400">Fat:</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={option.fat ?? ""}
                  onChange={(e) =>
                    onUpdateOption(option.id, "fat", Number(e.target.value))
                  }
                  className="w-16 px-1.5 py-0.5 bg-gray-950 border border-gray-800 rounded text-xs text-yellow-300 font-bold"
                />
                <span className="text-[10px] text-gray-500">g</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
