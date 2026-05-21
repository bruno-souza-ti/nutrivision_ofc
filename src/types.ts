export interface Macronutrients {
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface AnalysisResult {
  foodName: string;
  calories: number;
  macronutrients: Macronutrients;
  confidence: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferences: {
    calorieTarget: number;
    proteinTarget: number;
    notifications: boolean;
    dataSharing: boolean;
  }
}

export interface MealHistoryItem extends AnalysisResult {
  id: string;
  timestamp: string;
  image: string;
}

export interface DailyStats {
  totalMeals: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}
