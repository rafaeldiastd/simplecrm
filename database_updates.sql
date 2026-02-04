-- Execute these commands in your Supabase SQL Editor to update the table structure

-- 1. Add status column for Sales Funnel
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Novo';

-- 2. Add metadata column for capturing location and device info
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 3. (Optional) Create an index/policy if needed in future
