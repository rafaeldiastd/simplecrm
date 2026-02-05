-- Run this in your Supabase SQL Editor

ALTER TABLE forms 
ADD COLUMN style jsonb DEFAULT '{}'::jsonb,
ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
