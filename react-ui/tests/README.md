# Motorcycle Log - Test Suite & Production Reports

This directory contains automated integration and end-to-end tests for Motorcycle Log against the live Supabase backend and production endpoints.

## Contents

- **`prod_site_test_report.md`**: Full audit report for [https://moto-logger.vercel.app/](https://moto-logger.vercel.app/) including database validations, metrics calculations, and codebase audit findings.
- **`run_e2e_tests.ps1`**: Automated PowerShell test runner validating Auth, Vehicle CRUD, Form Submissions (Fuel, Service, Upgrade, Tax, Note, Reminder), Dashboard Calculations, and Cascade Deletions.
- **`test_report.json`**: Structured JSON test results from the latest execution.

## How to Run

From PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\react-ui\tests\run_e2e_tests.ps1
```

All test records are tagged and cleaned up automatically via Postgres cascade deletion upon test completion.
