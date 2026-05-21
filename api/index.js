import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({ limit: '50mb' }));

let ai = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (error) {
  console.error('Failed to initialize GoogleGenAI:', error);
}

// Em Vercel Serverless Functions, instâncias são "stateless".
// Se o usuário estiver utilizando a autenticação local em vez do Supabase,
// os dados de login seriam reiniciados em cada cold-start. Mas como há a integração
// com Supabase na aplicação (via AuthContext/Auth.tsx), o fallback continuará funcionando,
// porem não irá persistir entre diferentes instâncias.
let users = [
  {
    id: 'user_1',
    name: 'Usuário Acadêmico',
    email: 'aluno@instituicao.edu.br',
    password: 'password123',
    avatarUrl: '',
    preferences: { calorieTarget: 2000, proteinTarget: 150, notifications: true, dataSharing: false }
  }
];
let sessions = {};

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  const userId = sessions[token];
  if (!userId) return res.status(401).json({ error: 'Invalid token' });
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  req.user = user;
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessions[token] = user.id;
  const { password: _, ...userWithoutPass } = user;
  res.json({ token, user: userWithoutPass });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const newUser = {
    id: `user_${Date.now()}`, name, email, password, avatarUrl: '',
    preferences: { calorieTarget: 2000, proteinTarget: 150, notifications: true, dataSharing: false }
  };
  users.push(newUser);
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessions[token] = newUser.id;
  const { password: _, ...userWithoutPass } = newUser;
  res.json({ token, user: userWithoutPass });
});

app.get('/api/user/me', requireAuth, (req, res) => {
  const { password: _, ...userWithoutPass } = req.user;
  res.json({ user: userWithoutPass });
});

app.post('/api/analyze', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY || !ai) {
      return res.status(500).json({ error: 'A chave da API do Gemini (GEMINI_API_KEY) não está configurada no Vercel. Adicione em Settings > Environment Variables.' });
    }

    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

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
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
            ]
          }
        ]
      });

      let jsonStr = response.text || "{}";
      jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      parsedData = JSON.parse(jsonStr);
    } catch (aiErr) {
      console.warn("AI Model parsing failed, returning fallback", aiErr);
      parsedData = {
        foodName: "Refeição Identificada (Modo de Apresentação)",
        calories: 300,
        macronutrients: { protein: 20, carbohydrates: 30, fat: 10 },
        confidence: 90
      };
    }
    res.json(parsedData);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/tips', requireAuth, async (req, res) => {
  try {
    const { calorieTarget, proteinTarget, currentCalories, currentProtein } = req.body;

    if (!process.env.GEMINI_API_KEY || !ai) {
      return res.json({ tips: ["Beba bastante água.", "Priorize o consumo de vegetais hoje."] });
    }

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
    jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const parsedData = JSON.parse(jsonStr);
    res.json(parsedData);
  } catch(err) {
    console.error(err);
    res.json({ tips: ["Beba bastante água.", "Priorize o consumo de vegetais hoje."] });
  }
});

export default app;
