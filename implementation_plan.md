# RBAC Prototype Implementation Plan - FAAN VEMTAP

This plan outlines the steps to implement a powerful, frontend-driven Role-Based Access Control (RBAC) prototype for the FAAN dashboard. The goal is to demonstrate the hierarchy and flow defined in `faan_system_hierarchy_and_flow.md` to stakeholders and the backend team.

## User Review Required

> [!IMPORTANT]
> This is a **frontend prototype**. While it will simulate real logic, the final security must be enforced by the backend API.
> We will implement a "Demo Role Switcher" in the UI to allow stakeholders to instantly jump between Super Admin, Location Admin, and Department Admin views.

## Proposed Changes

### 1. RBAC Infrastructure & State Management
We need a central way to manage the current user's role and their assigned scope (Airport/Department).

#### [NEW] `src/context/RoleContext.tsx`
- Define `UserRole` enum: `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`.
- Create a context to hold `currentRole`, `currentLocation` (Airport), and `currentDepartment`.
- Provide a `checkPermission` helper function.

#### [MODIFY] `src/app/layout.tsx`
- Wrap the application with the `RoleProvider` to ensure role state is available everywhere.

---

### 2. Navigation & Sidebar Control
The sidebar should dynamically hide/show items based on the active role's permissions.

#### [MODIFY] `src/app/(dashboard)/layout.tsx`
- Update `MENU_ITEMS` to include `allowedRoles`.
- Filter the rendered menu based on the user's role from `RoleContext`.
- Update the Header to show the current role and location name.

**Permission Mapping (Prototype):**
- **Super Admin:** All items + "Locations" (Global view).
- **Location Admin:** All items except global Location Management (restricted to their specific airport).
- **Department Admin:** Restricted to Dashboard, Submissions, Issues, and Analytics (filtered to their department).

---

### 3. Route Protection & Scoping
Ensuring that users cannot manually navigate to restricted pages and that content is filtered correctly.

#### [NEW] `src/components/auth/RoleGuard.tsx`
- A wrapper component to protect specific sections of a page or redirect unauthorized users.

#### [MODIFY] `src/app/(dashboard)/dashboard/page.tsx`
- Update the main dashboard statistics cards to reflect role-based data (e.g., HQ sees "Total Interactions", Dept Admin sees "My Dept Issues").

#### [MODIFY] `src/app/(dashboard)/dashboard/submissions/page.tsx`
- Implement automatic filtering logic based on the user's location/department to demonstrate the data flow.

---

### 4. Prototype Demonstration Tools
To make the flow clear for stakeholders, we'll add interactive elements.

#### [NEW] `src/components/debug/DemoRoleSwitcher.tsx`
- A floating panel (only for prototyping/testing) that lets anyone switch roles and locations instantly to see the UI transform.

#### [MODIFY] `header` (in `layout.tsx`)
- Add a "Location Switcher" dropdown for Super Admins to simulate "Switching between Airports" as requested in the doc.

---

## Phase-by-Phase Execution

### Phase 1: Foundation (Current Turn)
- Define Types and Roles.
- Setup `src/context/RoleContext.tsx` and wrap the app.

### Phase 2: UI Adaptation
- Link the Sidebar to RoleContext to hide/show links.
- Update Header to display the active "Identity" (Role + Location).

### Phase 3: Page Logic & Filtering
- Apply `RoleGuard` to sensitive routes.
- Update Submissions and Issues components to show "mocked" filtered data based on the selected Role/Location.

### Phase 4: Stakeholder Experience
- Implement the "Demo Role Switcher" for easy testing.
- Add the Super Admin Location Switcher in the header.

---

## Open Questions

- **Initial Role:** What should be the default role when the app loads? (I propose starting as Super Admin for full visibility).
- **Redirection:** If a Department Admin tries to access the `Locations` management page, should they be redirected to the main dashboard or shown a "Permission Denied" UI?

## Verification Plan

### Manual Verification
1.  **Role Switching:** Use the Demo Switcher to change to "Department Admin".
    - Verify: Sidebar items like "Locations" disappear.
    - Verify: Dashboard card titles change to "My Department Performance".
2.  **Location Selection:** As Super Admin, select "Abuja Airport".
    - Verify: All data summaries update to reflect Abuja only.
3.  **Direct Access:** Try to navigate to `/dashboard/locations` while in "Department Admin" role.
    - Verify: User is redirected or shown an "Access Denied" message.
