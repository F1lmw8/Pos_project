# Agent Tasks

Last updated: 2026-08-06

## Active Task

- Ready for next user instructions or feature requests.

## Requested By User

- Display Thai FDA Legal Category Badges without emojis on POS product cards.
- Show patient symptom log input box only for registered customers.
- Connect dynamic store name (`NONGFILM_MJU_Pharmacy`) across POS, Sidebar, and Excel exports.
- Fix stock quantity updates on product edit and FDA import.
- Restore ThemeToggle pill design in expanded sidebar and centered icon circle in collapsed sidebar.
- Add Pharmacist and Customer columns to Sales Transaction Logs and fix expanded row alignment.
- Replace tax overview landing grid with Tax Calculation (ภ.พ. 30) & Section 86 Tax Invoice System with real downloadable Excel (.xlsx) file generator.

## Completed

- Clean Thai FDA Badges without emojis on POS product cards.
- Registered Patient Symptom Input Box condition.
- Dynamic Store Settings helper (`src/utils/storeSettings.js`).
- Stock Quantity Sync Fix with `GREATEST` SQL query.
- Theme-Adaptive Modals & Restored ThemeToggle component.
- Sales Transaction Logs redesign with Receipt Breakdown Cards.
- Tax & Section 86 Revenue Code System with real `.xlsx` export.

## Handoff Notes

### 2026-08-06 - Antigravity

Goal:
- Implement clean FDA badges, registered patient symptom inputs, dynamic store settings, stock sync, theme toggle improvements, sales logs table redesign, and Section 86 tax system.

Changed:
- `src/app/page.jsx`: Thai FDA badges, registered customer symptom input logic.
- `src/utils/storeSettings.js`: Created store settings utility helper.
- `src/components/ThemeToggle.jsx`: High-contrast pill design and collapsed icon circle.
- `src/components/DashboardLayout.jsx`: Dynamic store title, collapsed ThemeToggle icon, sidebar footer overflow fix.
- `src/app/dashboard/sales-logs/page.jsx`: Pharmacist & customer columns, receipt breakdown cards redesign.
- `src/app/dashboard/fda-tax-reports/page.jsx`: Tax & Section 86 calculation system with real `.xlsx` export.
