-- Enable Row Level Security (RLS) on tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Create policies for 'products' table

-- Policy 1: Allow read access to authenticated users
CREATE POLICY "Enable read access for authenticated users" 
ON public.products 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow insert access to authenticated users
CREATE POLICY "Enable insert access for authenticated users" 
ON public.products 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Allow update access to authenticated users
CREATE POLICY "Enable update access for authenticated users" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (true);

-- Policy 4: Allow delete access to authenticated users
CREATE POLICY "Enable delete access for authenticated users" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (true);

-- Create policies for 'movements' table

-- Policy 1: Allow read access to authenticated users
CREATE POLICY "Enable read access for authenticated users" 
ON public.movements 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow insert access to authenticated users
CREATE POLICY "Enable insert access for authenticated users" 
ON public.movements 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- NOTE: Movements are typically immutable logs, so we might not need UPDATE/DELETE
-- But if your app allows editing movements, uncomment the following:

-- CREATE POLICY "Enable update access for authenticated users" 
-- ON public.movements 
-- FOR UPDATE 
-- TO authenticated 
-- USING (true);
