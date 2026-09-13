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

export type DietChart = {
  id: string;
  client_id: string;
  client_name?: string | null;
  title: string;
  description?: string;
  active: boolean;
  meals: Meals;
  created_at?: string;
  updated_at?: string;
};
