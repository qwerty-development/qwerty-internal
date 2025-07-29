-- Schema Analysis Script
-- This script will show us the current state of the clients and quotations tables
-- Run this in Supabase SQL Editor to get the current schema

-- 1. Show all columns in clients table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Show all columns in quotations table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'quotations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Show constraints for clients table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'clients' 
AND tc.table_schema = 'public'
AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY');

-- 4. Show constraints for quotations table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'quotations' 
AND tc.table_schema = 'public'
AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY');

-- 5. Show sample data from clients table (first 3 rows)
SELECT * FROM clients LIMIT 3;

-- 6. Show sample data from quotations table (first 3 rows)
SELECT * FROM quotations LIMIT 3; 