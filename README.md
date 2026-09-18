# Motorcycle Log

A native application tailored for Nepali motorcycle users to track expenses, maintenance, fuel logs, and modifications.

## Architecture & Tech Stack
- **Backend (BaaS)**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Client Application**: Native Android App (planned)
- **Reference**: The project's feature set is inspired by [LubeLogger](https://github.com/hargata/lubelog), but re-architected to use a strict relational Postgres schema instead of a JSON document-store model.

## Database Schema Overview
The database uses a strict relational schema with Row Level Security (RLS) to ensure users can only access data tied to their own vehicles.

### Core Tables
1. **`vehicles`**: The core entity. Tracks `make`, `model`, `year`, `license_plate`, and purchase/sale information.
2. **`service_records`**: For tracking general maintenance (date, odometer, cost, description).
3. **`fuel_records`**: For tracking fuel fill-ups (date, odometer, liters, cost).
4. **`tax_records`**: Handles recurring or one-off bluebook renewals, emissions tests, and insurance taxes.
5. **`upgrade_records`**: Keeps track of aftermarket parts and custom modifications.
6. **`reminders`**: Date and mileage-based reminders for regular maintenance.
7. **`notes`**: Stores textual logs, journaling, and document records (like photos of licenses or bluebooks).

### Triggers & Security
- **`updated_at` Triggers**: A Postgres trigger automatically updates the `updated_at` timestamp on every modification across all tables.
- **Row Level Security (RLS)**: Enforced on all tables. Policies ensure that `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations are restricted to the authenticated user owning the associated vehicle.

## Setup Instructions
1. **Install Dependencies** (if applicable): `npm install`
2. **Supabase Local Development**:
   - Make sure Docker Desktop is running.
   - Start the local Supabase instance: `npx supabase start`
   - Migrations in `supabase/migrations/` will automatically run.
3. **Remote Deployment**:
   - Link your project: `npx supabase link --project-ref <your-project-ref>`
   - Push schema changes: `npx supabase db push`
