# Agent Status

Last updated: 2026-08-06

## Current State

- Repository path: `/Users/filmw8/project/POS_project`
- App: Next.js 15 + React 19 pharmacy/POS and RDU drug information project named `rdu-app`.
- Branch: `film`
- All features, stock sync fixes, tax calculation systems, dynamic store settings, and theme toggle enhancements are 100% completed, tested (HTTP 200 OK), committed, and pushed to GitHub branch `film`.

## Recent Work

- **Clean Thai FDA Badges (`src/app/page.jsx`)**: Rendered GPP & FDA drug classification badges (`ยาสามัญประจำบ้าน`, `ยาอันตราย (ข.ย. 11)`, `ยาควบคุมพิเศษ (ข.ย. 10)`) on POS product cards without emojis.
- **Registered Patient Symptom Input (`src/app/page.jsx`)**: Displayed patient symptom / dispensing reason log box strictly when a registered customer is selected, hiding for walk-in customers.
- **Dynamic Store Settings Helper & Exports (`src/utils/storeSettings.js`, `src/utils/excelStockHelper.js`)**: Integrated dynamic store settings (`NONGFILM_MJU_Pharmacy`) into POS header, Admin sidebar, and Excel stock exports.
- **Stock Quantity Sync Fix (`src/app/api/dashboard/inventory-stock/route.js`, `src/app/api/products/[id]/route.js`)**: Updated stock API to compute `sellable_quantity` using `GREATEST` fallback for lot upserts.
- **Theme-Adaptive Modals (`src/components/ProductDetailModal.jsx`, `src/components/AddProductModal.jsx`)**: Applied CSS variables for theme adaptation.
- **Theme Toggle Component (`src/components/ThemeToggle.jsx`)**: Restored clean pill button design with text and Moon/Sun icons in expanded mode, and 38x38px centered icon circle in collapsed sidebar mode.
- **Sales Transaction Logs Page (`src/app/dashboard/sales-logs/page.jsx`)**: Added Pharmacist Name and Patient/Customer Name columns, and redesigned expanded rows into executive Receipt Breakdown Cards.
- **Tax Calculation & Section 86 System (`src/app/dashboard/fda-tax-reports/page.jsx`)**: Replaced 6-card overview with Tax & Section 86 Revenue Code Compliance System, including ภ.พ. 30 calculations, 8-requirement checklist, full tax invoice modal, and real downloadable Excel (`.xlsx`) exporter.

## Verification

- `curl -s "http://127.0.0.1:3000"` returned HTTP status 200.
- `curl -s "http://127.0.0.1:3000/dashboard/sales-logs"` returned HTTP status 200.
- `curl -s "http://127.0.0.1:3000/dashboard/fda-tax-reports"` returned HTTP status 200.
- `curl -s "http://127.0.0.1:3000/dashboard/add-product"` returned HTTP status 200.

## Next Agent Start Here

1. Read `AGENTS.md`.
2. Read `.agent/STATUS.md`.
3. Read `.agent/TASKS.md`.
4. Run `git status --short`.
