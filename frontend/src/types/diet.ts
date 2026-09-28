export type Macro = {
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  calories: number;
};

export type MealItem = {
  id: string;      // local uid for React list handling
  name: string;
  servings?: number; // optional number of servings
  serving_size?: string; // e.g., "1 cup", "150 g"
  instructions?: string; // per-item notes
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

export type Meal = {
  items: MealItem[];
  total?: Macro; // computed on save/display
  label?: string; // optional custom meal label (e.g., "Pre-workout")
  instructions?: string; // meal-level notes
  time?: string; // optional meal time (e.g., "08:00")
};

export type Meals = {
  breakfast?: Meal;
  midmeal?: Meal;
  lunch?: Meal;
  snack?: Meal;
  dinner?: Meal;
  [key: string]: Meal | undefined;
};

// ==========================================
// REFERENCE-STYLE STRUCTURED PLAN DATA TYPES
// Inspired by deitchatexapmle.docx
// ==========================================

export interface ClientDetails {
  name: string;
  age?: number | string;
  weight?: number | string;
  height?: string;
  goal?: string;
  planType?: string;
}

export interface PlanOverview {
  dailyCalories?: number | string;
  proteinGrams?: number | string;
  carbsGrams?: number | string;
  fatGrams?: number | string;
  focus?: string;
  notes?: string;
}

export interface MorningRoutine {
  timing?: string;
  description?: string;
  instructions?: string;
  hydration?: string;
  notes?: string;
}

export interface IngredientItem {
  id: string;
  name: string;
  quantity?: string;
  serving?: string;
}

export interface MealOptionItem {
  id: string;
  name: string;
  ingredients: IngredientItem[];
  recipe?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface WeeklyGuidelineItem {
  id: string;
  category: string; // e.g. "Goal / Deficit", "Refeed", "Hydration", "Sleep", "Tracking", "Training", "Other"
  text: string;
}

export interface ReferencePlanData {
  clientDetails?: ClientDetails;
  planOverview?: PlanOverview;
  morningRoutine?: MorningRoutine;
  breakfast?: {
    options: MealOptionItem[];
  };
  lunch?: {
    options: MealOptionItem[];
  };
  eveningSnack?: {
    options: MealOptionItem[];
  };
  dinner?: {
    options: MealOptionItem[];
  };
  postWorkout?: {
    options: MealOptionItem[];
  };
  weeklyGuidelines?: WeeklyGuidelineItem[];
  calculatedTotals?: Macro;
}

export type DietChart = {
  id: string;
  client_id: string;
  clientId?: string;
  client_name?: string | null;
  title: string;
  description?: string;
  active: boolean;
  meals: Meals;
  planData?: ReferencePlanData;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  client?: {
    id: string;
    user?: {
      id: string;
      fullName?: string;
      email?: string;
    };
  };
};
