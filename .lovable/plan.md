

# Fix Build Errors + Align Database with PRD

## Immediate Problem
The `src/integrations/supabase/types.ts` file is empty, causing all build errors. Additionally, the `units` table is missing `business_type` and `logistics_type` columns that the Onboarding code references.

## Plan

### 1. Database Migration
Add missing columns to `units` table:
- `business_type` (text, nullable, default 'independent') — 'independent' or 'team'
- `logistics_type` (text, nullable, default 'local') — 'local', 'home', 'hybrid'

### 2. Regenerate `types.ts`
Write a complete `Database` type definition in `src/integrations/supabase/types.ts` that matches the actual Supabase schema (all 9 tables + join_requests), exporting `Database`, `Tables`, `TablesInsert`, and `TablesUpdate` helper types. This will fix all TS2305 errors across `useAppointments.ts`, `useClients.ts`, `useServices.ts`, `useTeamMembers.ts`, and `client.ts`.

### 3. Fix Onboarding insert
The Onboarding code inserts `business_type` and `logistics_type` into the `units` table — after the migration adds these columns, this will work. Also need to save `business_type` and `service_model` to the `profiles` table during onboarding (currently only saved to `units`).

### Files Changed
- `src/integrations/supabase/types.ts` — Full rewrite with Database types
- Supabase migration — Add 2 columns to `units`
- `src/pages/Onboarding.tsx` — Also update profile with business_type/service_model

This unblocks all build errors and aligns the database with the current code and PRD requirements.

