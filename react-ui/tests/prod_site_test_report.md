# Production Site & Database Integration Validation Report

**Target**: [https://moto-logger.vercel.app/](https://moto-logger.vercel.app/)  
**Backend**: Supabase (`https://dpnatfvndlyzvukryrgk.supabase.co`)  
**Test Account**: `puribijay@gmail.com`  
**Date**: September 18, 2026  

---

## Executive Summary

| Category | Component | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Authentication** | Supabase Auth (Password Grant) | **PASSED** | Valid credentials authenticated, JWT token issued, user profile resolved. |
| **Database Read** | User Profile (`user_profiles`) | **PASSED** | Retrieved user record (`ef04687b-8b9e-427e-a34c-a0d2b98b3782`). |
| **Database Read** | Vehicle Query (`vehicles`) | **PASSED** | Successfully queried existing production motorcycle (`2016 Bajaj pulsar 150`). |
| **Form Insertion** | Add Vehicle (`vehicles`) | **PASSED** | Inserted test motorcycle (`2024 Yamaha MT-15 V2`), generated valid UUID with RLS `auth.uid() = user_id`. |
| **Form Insertion** | Fuel Record (`fuel_records`) | **PASSED** | Inserted fuel log (12,000 km, 10.5L, Rs. 1,850), foreign key verified. |
| **Form Insertion** | Second Fuel Record | **PASSED** | Inserted second fuel log (12,450 km, 9.8L, Rs. 1,725), verified multi-fill data. |
| **Form Insertion** | Service Record (`service_records`) | **PASSED** | Inserted service log (`Full Periodic Service & Motul 7100`, Rs. 2,800). |
| **Form Insertion** | Upgrade Record (`upgrade_records`) | **PASSED** | Inserted upgrade log (`Crash Guard & Mobile Holder Mount`, Rs. 4,500). |
| **Form Insertion** | Tax Record (`tax_records`) | **PASSED** | Inserted tax log (`Nepal Government Road Tax & Bluebook`, Rs. 3,000). |
| **Form Insertion** | Notes (`notes`) | **PASSED** | Inserted maintenance note (`Tire Pressure Checklist: Front 29 / Rear 33 PSI`). |
| **Form Insertion** | Reminders (`reminders`) | **PASSED** | Inserted reminder (`Next Engine Oil Change` at 15,000 km). |
| **Data Integrity** | Dashboard Aggregations | **PASSED** | Total cost calculation matches exactly: Rs. 13,875. Distance: 450 km. Mileage: 45.92 km/L. |
| **Settings Update** | Currency Preference | **PASSED** | Successfully updated profile currency to `NPR` in `user_profiles`. |
| **RLS & Cleanup** | Cascade Delete | **PASSED** | Deleting the test vehicle cleanly cascade-deleted all associated logs with zero orphan rows. |

---

## Detailed Test Results

### 1. Authentication & Session Resolution
- **Endpoint**: `POST /auth/v1/token?grant_type=password`
- **Result**: `200 OK`
- **User ID**: `ef04687b-8b9e-427e-a34c-a0d2b98b3782`
- **Email Verified**: `true`
- **Providers**: Email & Google OAuth linked
- **Session**: Valid bearer JWT issued with 3600s TTL.

### 2. Vehicle Management (`vehicles` Table)
- **RLS Policy**: `Users can insert their own vehicles` (`auth.uid() = user_id`)
- **Existing Production Vehicle**:
  - Make/Model: **Bajaj pulsar 150**
  - Year: 2016
  - ID: `f9b16b87-494a-4719-a7c7-ad48ac648ba7`
- **Creation Test**:
  - Payload: `{ year: 2024, make: "Yamaha Test", model: "MT-15 V2", license_plate: "PROD TEST 99" }`
  - Result: `201 Created` (ID: `52552352-a951-4347-a5f3-f9f023dd33a5`)

### 3. Form Submissions to Database (`AddLog.jsx`)

#### A. Fuel Entry
```json
{
  "vehicle_id": "52552352-a951-4347-a5f3-f9f023dd33a5",
  "date": "2026-09-18",
  "odometer": 12000,
  "liters": 10.5,
  "cost": 1850,
  "is_fill_to_full": true,
  "missed_previous_fill": false,
  "notes": "Automated verification fuel log"
}
```
- **Database Status**: `201 Created`
- **Validation**: Read query returned exact numeric matches for `odometer`, `liters`, `cost`.

#### B. Service Entry
```json
{
  "vehicle_id": "52552352-a951-4347-a5f3-f9f023dd33a5",
  "date": "2026-09-18",
  "odometer": 12450,
  "description": "Full Periodic Service & Motul 7100 Engine Oil",
  "cost": 2800,
  "notes": "Verified by automated test suite"
}
```
- **Database Status**: `201 Created`

#### C. Upgrade & Tax Entries
- **Upgrade**: `Crash Guard & Mobile Holder Mount` | Cost: Rs. 4,500 | `201 Created`
- **Tax**: `Nepal Government Annual Road Tax & Bluebook Renewal` | Cost: Rs. 3,000 | `201 Created`

#### D. Notes & Reminders
- **Note**: `Tire Pressure & Maintenance Checklist` | Content: `Front tire: 29 PSI, Rear tire: 33 PSI` | `201 Created`
- **Reminder**: `Next Engine Oil Change` | Metric: `Odometer` | Target: `15000` | `201 Created`

---

### 4. Metrics & Calculations Validation

```
Sum of Costs:
  Fuel 1:     Rs. 1,850
  Fuel 2:     Rs. 1,725
  Service:    Rs. 2,800
  Upgrade:    Rs. 4,500
  Tax:        Rs. 3,000
------------------------
Total Cost:  Rs. 13,875 (Exact match with Dashboard formula)

Distance:
  12,450 km - 12,000 km = 450 km

Mileage:
  450 km / 9.8 L = 45.92 km/L
```

---

## Codebase Audit & Detected Discrepancies

> [!WARNING]
> **Issue 1: Notes Not Rendering in Logs View (`react-ui/src/pages/Logs.jsx:108`)**
> In `Logs.jsx`: `{log.note && <p ...>{log.note}</p>}`.
> In the Supabase database schema (`fuel_records` and `service_records`), the column name is **`notes`** (plural), NOT `note`. Consequently, notes saved from the form never display on the Logs screen.
> 
> **Fix**: Change `log.note` to `log.notes` in `react-ui/src/pages/Logs.jsx`.

> [!NOTE]
> **Issue 2: Upgrade and Tax Records Not Displayed on `/logs`**
> In `AddLog.jsx`, users can create `Upgrade` and `Tax` entries, and `Dashboard.jsx` includes their costs in the `Total Cost` card. However, `react-ui/src/pages/Logs.jsx` only queries `fuel_records` and `service_records`. Upgrade and tax entries do not appear in the log list.

> [!NOTE]
> **Issue 3: `current_odometer` on `activeVehicle`**
> In `Dashboard.jsx:75`: `if (activeVehicle.current_odometer && lastOdo)`. The `vehicles` table does not contain a `current_odometer` column, so `lastFillupStr` relies only on the fallback calculation.

---

## Cleanup
The automated test runner cleanly deleted the temporary test motorcycle (`Yamaha Test MT-15 V2`). Cascading foreign keys confirmed that all child test records were removed, leaving the user's live production data intact.
