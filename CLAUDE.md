# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a rental property management system built as a LINE LIFF (LINE Front-end Framework) application with Google Apps Script as the backend API and Google Sheets as the database.

**Key Technologies:**
- Frontend: Vanilla JavaScript, Bootstrap 5, Font Awesome
- LIFF SDK: LINE integration for authentication
- Backend: Google Apps Script (GAS)
- Database: Google Sheets (3 worksheets: Tenant_Config, individual tenant sheets, Admins)

## Architecture

### Three-Tier Structure

1. **Frontend (LIFF App)**
   - Single-page application ([index.html](index.html))
   - Role-based UI: Landlord view vs Tenant view
   - Authentication via LINE login (LIFF SDK)

2. **Backend API (Gas/)**
   - [Code.gs](Gas/Code.gs): Entry point (doPost/doGet), API routing, script lock management
   - [Database.gs](Gas/Database.gs): Core database operations (bind, getStatus, pay)
   - [landlord.gs](Gas/landlord.gs): Landlord-specific features (dashboard, verify payments, auto-billing)

3. **Database (Google Sheets)**
   - See [Gas/GoogleSheet.md](Gas/GoogleSheet.md) for complete schema
   - `Tenant_Config`: Master tenant registry with binding info
   - Individual sheets per tenant: Bill records (created automatically on binding)
   - Admin detection via Status field = "ADMIN" in Tenant_Config

### Frontend Module Organization

- [js/config.js](js/config.js): LIFF_ID, API_URL, global state (currentUser, currentCommunityId)
- [js/api.js](js/api.js): ApiService wrapper for all backend calls
- [js/main.js](js/main.js): App initialization, LIFF login flow, user binding
- [js/tenant.js](js/tenant.js): Tenant UI logic (bill display, payment actions)
- [js/landlord.js](js/landlord.js): Landlord dashboard, tenant management, payment verification
- [js/utils.js](js/utils.js): Helper functions (formatMoney, hideLoading, etc.)

## Critical Data Flow Patterns

### Authentication & Role Detection

1. LIFF SDK authenticates user → gets LINE User ID
2. Backend queries `Tenant_Config` worksheet by LINE User ID
3. If Status = "ADMIN" → redirect to landlord view
4. If bound tenant found → load tenant bills from individual worksheet
5. If unbound → show binding screen (requires national ID verification)

### Binding Process

When a tenant binds their account:
1. User inputs national ID (身分證字號)
2. Backend matches against `Tenant_Config.national_id` column
3. If match found AND `line_user_id` is empty → write LINE User ID
4. **Auto-create individual worksheet** named after `community_id`
5. Worksheet created with predefined headers (bill_id, month, rent_amt, water_usage, etc.)

### Bill Status Workflow

Bills have 3 states managed in the `status` column:
- `待繳費` (Pending): Initial state, tenant sees "Pay" button
- `待查核` (Under Review): Tenant clicked "已匯款", landlord needs to verify
- `已完成` (Completed): Landlord confirmed payment, moves to history

### Dynamic Worksheet Architecture

Each tenant gets their own worksheet named by `community_id` (e.g., "A-101"). This is NOT a traditional multi-tenant table design. Key implications:
- Adding a new tenant requires updating `Tenant_Config` + creating new worksheet
- Bill queries directly target the worksheet by name (no JOIN operations)
- Auto-billing function iterates through `Tenant_Config` and appends rows to individual sheets

## Key Implementation Patterns

### API Request Structure

All frontend API calls follow this pattern:
```javascript
ApiService.post({
  action: "actionName",
  userId: lineUserId,  // from LIFF
  ...otherParams
})
```

Backend routing in [Code.gs](Gas/Code.gs) uses if-else on `action` field.

### Concurrency Control

Uses `LockService.getScriptLock()` in [Code.gs:12](Gas/Code.gs#L12) with 10-second timeout to prevent race conditions on concurrent bill updates.

### Auto-Billing Function

`autoGenerateMonthlyBills()` in [landlord.gs:111](Gas/landlord.gs#L111):
- Designed to run via GAS time-driven trigger (monthly on 1st)
- Iterates all tenants in `Tenant_Config`
- Checks if bill for current month exists (by matching month column)
- Auto-creates bill with base_rent, status="待繳費", water/elec=0
- Can also be manually triggered via landlord UI button

### Tenant Status Field

The `status` field in `Tenant_Config` (column F) serves dual purpose:
- `ADMIN`: Flags landlord accounts (skips bill loading, shows admin UI)
- For regular tenants: Could be used for access control (e.g., "正常", "退租", "封鎖") though not fully implemented

## Development Workflow

### Deploying GAS Changes

1. Open Google Apps Script project linked to the spreadsheet
2. Edit .gs files in GAS editor
3. Deploy as Web App → Create new deployment
4. Copy new deployment URL → update `API_URL` in [js/config.js](js/config.js)
5. Frontend will automatically use new API endpoint

### Testing Locally

Since this is a LIFF app, local testing requires:
1. Serve files via local HTTP server (e.g., `python3 -m http.server 8080`)
2. Update LIFF endpoint URL in LINE Developers Console to point to ngrok/tunneled URL
3. Use LINE mobile app to access LIFF URL (desktop browser won't have LIFF context)

### Modifying Database Schema

If adding columns to worksheets:
1. Update [Gas/GoogleSheet.md](Gas/GoogleSheet.md) documentation
2. Modify `createBillSheet()` headers array in [Database.gs:66](Gas/Database.gs#L66)
3. Update `formatBillV3()` index mappings in [Database.gs:161](Gas/Database.gs#L161)
4. Adjust frontend rendering in [tenant.js](js/tenant.js) and [landlord.js](js/landlord.js)

## Important Constraints

- **No build process**: Pure static files, no npm/webpack/babel
- **No package manager**: All dependencies via CDN (Bootstrap, Font Awesome, LIFF SDK)
- **Hardcoded admin ID**: Admin LINE User ID in [Code.gs:3](Gas/Code.gs#L3) (future: move to Admins worksheet)
- **Synchronous GAS execution**: No async/await in .gs files, use UrlFetchApp for external calls
- **LIFF browser limitations**: Some features only work in LINE in-app browser

## Security Considerations

When modifying code:
- Never expose Google Sheets ID in frontend (currently abstracted via GAS API)
- Validate `communityId` parameters to prevent cross-tenant data access
- Admin actions should verify caller is admin (currently minimal validation)
- National ID comparison is case-insensitive but stored values should be uppercase
- Script lock prevents race conditions but doesn't handle distributed transactions

## Common Gotchas

- **Array indexing in GAS**: `getDataRange().getDisplayValues()` returns 0-indexed arrays, but `getRange(row, col)` uses 1-indexed positions
- **Worksheet naming**: Community IDs with special characters may fail worksheet creation (see try-catch in [Database.gs:82](Gas/Database.gs#L82))
- **LIFF ID mismatch**: If LIFF_ID in config.js doesn't match LINE Developers Console, login fails silently
- **Stale API_URL**: Forgetting to update API_URL after GAS deployment causes 404s
- **Status field overload**: "ADMIN" status in Tenant_Config is a magic value; don't use for regular tenant status codes


## additional Documentation
- *.md files in Docs/ for backend specifics
