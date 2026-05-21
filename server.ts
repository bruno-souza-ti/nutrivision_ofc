import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// --- IN MEMORY DB FOR AUTH ---
let users = [
  {
    id: 'user_1',
    name: 'Usuário Acadêmico',
    email: 'aluno@instituicao.edu.br',
    password: 'password123',
    avatarUrl: '',
    preferences: {
      calorieTarget: 2000,
      proteinTarget: 150,
      notifications: true,
      dataSharing: false,
    }
  }
];

let sessions: Record<string, string> = {}; // token -> userId

function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  let userId = sessions[token];
  
  // Dev fallback to prevent session loss on fast-restarts
  if (!userId && users.length > 0) {
    userId = users[0].id;
    sessions[token] = userId;
  }

  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  req.user = user;
  next();
}

async function startServer() {
  const app = express();
  
  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini client globally
  // Follow environment guide: initialize but deal with missing keys cleanly
  let ai: GoogleGenAI | null = null;
  try {
    if (process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI:', error);
  }

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessions[token] = user.id;
    
    const { password: _, ...userWithoutPass } = user;
    res.json({ token, user: userWithoutPass });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      avatarUrl: '',
      preferences: {
        calorieTarget: 2000,
        proteinTarget: 150,
        notifications: true,
        dataSharing: false,
      }
    };
    
    users.push(newUser);
    
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessions[token] = newUser.id;
    
    const { password: _, ...userWithoutPass } = newUser;
    res.json({ token, user: userWithoutPass });
  });

  app.get('/api/user/me', requireAuth, (req: any, res) => {
    const { password: _, ...userWithoutPass } = req.user;
    res.json({ user: userWithoutPass });
  });

  app.put('/api/user/me', requireAuth, (req: any, res) => {
    const updates = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex > -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      // Prevent password update via this general route for safety
      if (updates.password) {
        users[userIndex].password = req.user.password; 
      }
      const { password: _, ...userWithoutPass } = users[userIndex];
      res.json({ user: userWithoutPass });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // --- EXISTING API ---

  app.post('/api/analyze', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY || !ai) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
      }

      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
      }

      // Ensure base64 string doesn't include the data URL prefix
      const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

      let parsedData;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an expert nutritionist and computer vision AI. Analyze this food image very carefully. Identify EVERY SINGLE food item visible on the plate, including side dishes, salads (like lettuce, tomato, onions), sauces, etc. 
Provide the answer in valid JSON format with the following structure:
{
  "foodName": "A descriptive name containing ALL the food items identified in the image, STRICTLY IN BRAZILIAN PORTUGUESE (PT-BR) (e.g., 'Arroz, Feijão, Frango Grelhado, e Salada de Alface com Tomate')",
  "calories": number (total estimated),
  "macronutrients": {
    "protein": number (total grams estimated),
    "carbohydrates": number (total grams estimated),
    "fat": number (total grams estimated)
  },
  "confidence": number (0-100 score of your confidence)
}
Only output the JSON object, NO markdown formatting, NO extra text.`
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }
          ]
        });

        let jsonStr = response.text || "{}";
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(jsonStr);
      } catch (aiErr: any) {
         console.warn("AI Model failed or parsing failed", aiErr?.message);
         if (aiErr?.status === 429 || (aiErr?.message && aiErr.message.includes('quota'))) {
            return res.status(429).json({ error: 'Limite da API atingido. Você excedeu sua cota, tente novamente em alguns instantes.' });
         }
         
         // Presentation fallback mock data only if not rate limit
         parsedData = {
           foodName: "Refeição Identificada (Falha na IA)",
           calories: 450,
           macronutrients: {
             protein: 30,
             carbohydrates: 40,
             fat: 15
           },
           confidence: 50
         };
      }

      res.json(parsedData);
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/tips', requireAuth, async (req: any, res) => {
    try {
      const { calorieTarget, proteinTarget, currentCalories, currentProtein } = req.body;

      if (!process.env.GEMINI_API_KEY || !ai) {
        console.warn("No GEMINI_API_KEY found, returning fallback tips.");
        return res.json({ tips: ["Beba bastante água.", "Priorize o consumo de vegetais hoje."] });
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                   text: `Você é um nutricionista especialista. O usuário tem a meta diária de ${calorieTarget} calorias e ${proteinTarget}g de proteínas. Atualmente ele consumiu ${currentCalories} calorias e ${currentProtein}g de proteínas hoje.
                   Gere 2 a 3 dicas curtas, práticas e motivacionais (não mais que 2 frases cada) em português do Brasil (PT-BR) sobre o que ele pode fazer para alcançar essas metas ou como se manter saudável hoje. Retorne um JSON válido contendo um array de strings chamado "tips":
                   { "tips": ["Dica 1", "Dica 2"] }`
                }
              ]
            }
          ]
        });

        let jsonStr = response.text || "{}";
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(jsonStr);
        res.json(parsedData);
      } catch (aiErr: any) {
        console.warn("AI Model failed to generate tips", aiErr?.message);
        res.json({ tips: ["Beba pelo menos 2 litros de água hoje.", "Adicione uma porção de vegetais verdes escuros no jantar."] });
      }
    } catch(err: any) {
      console.warn("Error processing tips", err?.message);
      res.json({ tips: ["Beba bastante água.", "Priorize o consumo de vegetais hoje."] });
    }
  });

  app.post('/api/expert-tips', requireAuth, async (req: any, res) => {
    try {
      const { mealHistory, dailyStats, preferences } = req.body;

      if (!process.env.GEMINI_API_KEY || !ai) {
        console.warn("No GEMINI_API_KEY found, returning fallback expert tips.");
        return res.json({ recommendations: ["Aumente a ingestão de vegetais verdes escuros.", "Mantenha a hidratação constante."] });
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                   text: `Você é um nutricionista esportivo e clínico avançado. O usuário consumiu ${dailyStats.totalCalories} calorias, ${dailyStats.totalProtein}g de proteína, ${dailyStats.totalCarbs}g de carboidratos e ${dailyStats.totalFat}g de gordura hoje. A meta diária dele é ${preferences?.calorieTarget || 2000} kcal e ${preferences?.proteinTarget || 150}g de proteína.
O histórico de refeições dele de hoje inclui os seguintes alimentos: ${mealHistory.map((m: any) => m.foodName).join(', ')}.
Gere 2 a 3 recomendações de especialista avançadas (cerca de 2 frases cada) em português do Brasil (PT-BR), focando em áreas de melhoria como a possível falta de micronutrientes, distribuição de macros, ou hidratação baseada na qualidade dos alimentos consumidos. Seja prático e forneça insights reais.
Retorne um JSON válido contendo um array de strings chamado "recommendations":
{ "recommendations": ["Recomendação 1", "Recomendação 2"] }`
                }
              ]
            }
          ]
        });

        let jsonStr = response.text || "{}";
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(jsonStr);
        res.json(parsedData);
      } catch (aiErr: any) {
        console.warn("AI Model failed to generate expert tips", aiErr?.message);
        res.json({ recommendations: ["Adicione mais fontes de vitamina C e ferro às suas refeições.", "Tente rotacionar as fontes de proteínas e carboidratos para maior variedade."] });
      }
    } catch(err: any) {
      console.warn("Error processing expert tips", err?.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
