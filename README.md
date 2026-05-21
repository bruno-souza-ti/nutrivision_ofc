# Nutri-Vision 🥗👁️

**Nutri-Vision** is an intelligent AI-powered meal tracking application. It utilizes advanced computer vision via the Gemini API to identify foods from an image and estimate macro-nutrients and caloric values automatically, making the process of logging meals effortless.

## 🚀 Features

- **AI Meal Analysis:** Take a picture of your meal, and the Gemini API will analyze the image to identify the food, portion, ingredients, and provide comprehensive macronutrient details (Protein, Carbs, Fat) and calorie estimation.
- **Real-Time Data Extraction:** Uses Gemini 2.5 Flash for fast processing of images into clean, structured JSON data.
- **User Authentication & Profiles:** Register, login, and customize daily calorie and macronutrient targets.
- **Dietary Insights:** Automatic daily generation of tips and expert dietary recommendations based on the logged meal history and achieved targets versus set goals.
- **Full-Stack Application:** Includes a secure server to protect the internal API keys and handle complex generative responses.
- **Modern UI/UX:** Clean, aesthetically pleasing user interface styled with Tailwind CSS, with fluid animations via Motion.

## 🛠️ Technology Stack

**Frontend:**
- **[React 19](https://react.dev/)** & **[Vite](https://vitejs.dev/)**
- **[Tailwind CSS](https://tailwindcss.com/)** for styling
- **[Motion](https://motion.dev/)** for UI animations
- **[Recharts](https://recharts.org/)** for data visualization
- **[Lucide-React](https://lucide.dev/)** for iconography

**Backend & Services:**
- **[Express.js](https://expressjs.com/)** (TypeScript)
- **[Google Gemini API](https://ai.google.dev/docs)** (`@google/genai` SDK) for food image inference
- **[Supabase](https://supabase.com/)** Client for cloud synchronization & persistent database logging

## 📁 Project Overview

- `/src`: Contains the React application (Contexts, Pages, Lib configurations, Components, etc.).
- `/api` or `server.ts`: The Express API setup that proxies the requests to Gemini to keep API parameters hidden and securely perform analysis and advice generation.
- `supabase-schema.sql`: Provides the SQL definition table structure to deploy on Supabase.

## ⚙️ Environment Variables

The project requires several environment variables to function correctly. A `.env` file must be provided containing:

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 💻 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Database Setup:** 
   Execute the `supabase-schema.sql` code in your Supabase project SQL Editor to configure the necessary tables prior to logging meals.

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   This will run the full-stack server allowing both frontend and backend communication.

4. **Production Build:**
   ```bash
   npm run build
   npm run start
   ```

## 🔒 Security

All AI execution runs securely on the server (`server.ts`). The `GEMINI_API_KEY` is not exposed to the browser client.

Enjoy building better habits gracefully!
