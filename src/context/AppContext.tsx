import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DailyStats, MealHistoryItem } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthContext } from './AuthContext';

interface AppContextType {
  dailyStats: DailyStats;
  mealHistory: MealHistoryItem[];
  addMeal: (meal: Omit<MealHistoryItem, 'id' | 'timestamp'>) => void;
}

const INITIAL_STATS: DailyStats = {
  totalMeals: 0,
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [dailyStats, setDailyStats] = useState<DailyStats>(INITIAL_STATS);
  const [mealHistory, setMealHistory] = useState<MealHistoryItem[]>([]);

  useEffect(() => {
    if (!user) {
      setMealHistory([]);
      setDailyStats(INITIAL_STATS);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      fetchMeals();
    }
  }, [user]);

  const fetchMeals = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const parsedMeals: MealHistoryItem[] = data.map(m => ({
        id: m.id,
        timestamp: m.created_at,
        foodName: m.food_name,
        calories: Number(m.calories),
        macronutrients: {
          protein: Number(m.protein),
          carbohydrates: Number(m.carbohydrates),
          fat: Number(m.fat)
        },
        confidence: Number(m.confidence),
        image: m.image_url
      }));

      setMealHistory(parsedMeals);
      recalculateStats(parsedMeals);
    } catch (err) {
      console.error(err);
    }
  };

  const recalculateStats = (meals: MealHistoryItem[]) => {
    const stats = meals.reduce((acc, meal) => ({
      totalMeals: acc.totalMeals + 1,
      totalCalories: acc.totalCalories + meal.calories,
      totalProtein: acc.totalProtein + meal.macronutrients.protein,
      totalCarbs: acc.totalCarbs + meal.macronutrients.carbohydrates,
      totalFat: acc.totalFat + meal.macronutrients.fat,
    }), INITIAL_STATS);
    setDailyStats(stats);
  };

  const addMeal = async (mealData: Omit<MealHistoryItem, 'id' | 'timestamp'>) => {
    const newMeal: MealHistoryItem = {
      ...mealData,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && user) {
      try {
        const { data, error } = await supabase.from('meals').insert([{
          user_id: user.id,
          food_name: mealData.foodName,
          calories: mealData.calories,
          protein: mealData.macronutrients.protein,
          carbohydrates: mealData.macronutrients.carbohydrates,
          fat: mealData.macronutrients.fat,
          confidence: mealData.confidence,
          image_url: mealData.image,
          created_at: newMeal.timestamp
        }]).select().single();
        
        if (error) throw error;
        newMeal.id = data.id; // Override with server ID
      } catch (err) {
        console.error('Failed to save to Supabase:', err);
      }
    }

    setMealHistory(prev => {
      const newList = [newMeal, ...prev];
      recalculateStats(newList);
      return newList;
    });
  };

  return (
    <AppContext.Provider value={{ dailyStats, mealHistory, addMeal }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
