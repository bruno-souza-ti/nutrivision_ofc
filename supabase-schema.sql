-- Copie e cole este código no painel SQL Editor do seu projeto Supabase para criar as tabelas necessárias.

-- 1. Criação da tabela de Perfis
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  calorie_target NUMERIC DEFAULT 2000,
  protein_target NUMERIC DEFAULT 150,
  notifications BOOLEAN DEFAULT true,
  data_sharing BOOLEAN DEFAULT false
);

-- 2. Criação da tabela de Refeições (Meals)
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbohydrates NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  image_url TEXT,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitando RLS (Row Level Security) para segurança
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança (Policies) para Perfis
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Políticas de segurança (Policies) para Refeições
CREATE POLICY "Users can insert their own meals" ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own meals" ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meals" ON meals FOR DELETE USING (auth.uid() = user_id);

-- 6. Trigger para auto-criar um perfil quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
