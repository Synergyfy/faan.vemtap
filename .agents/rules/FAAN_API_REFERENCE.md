# 📡 FAAN VemTap — Comprehensive API Reference

> **Version:** 1.0 | **Base URL:** `http://localhost:4001/api` | **Docs:** `http://localhost:4001/docs`

---

## The Story

The Federal Airports Authority of Nigeria (FAAN) operates airports across the country. Inside each airport, dozens of departments — security, maintenance, passenger services, lounges — work in parallel. Passengers interact with touchpoints (digital feedback kiosks, complaint terminals, incident scanners) and submit forms. Staff raise internal issues. Managers run reports. Directors review analytics dashboards.

This API is the backbone of that system. It governs who can see what, who can act on it, and how information flows from a passenger scanning a QR code at Gate 15 all the way to a director's dashboard showing resolution rates across all locations.

Every endpoint in this document fits into one of nine modules. Read them in order to understand the full data lifecycle, or jump to any section using the table of contents below.

---

## 📑 Table of Contents

1. [Authentication Model & RBAC](#1-authentication-model--rbac)
2. [Global Response Envelope](#2-global-response-envelope)
3. [Global Enums Reference](#3-global-enums-reference)
4. [Module: Auth](#4-module-auth---apiv1auth)
5. [Module: Users](#5-module-users---apiv1users)
6. [Module: Organizations](#6-module-organizations---apiv1organizations)
7. [Module: Locations](#7-module-locations---apiv1locations)
8. [Module: Departments](#8-module-departments---apiv1departments)
9. [Module: Touchpoints](#9-module-touchpoints---apiv1touchpoints)
10. [Module: Submissions](#10-module-submissions---apiv1submissions)
11. [Module: Reports & Issues](#11-module-reports--issues---apiv1reports)
12. [Module: Report Templates](#12-module-report-templates---apiv1report-templates)
13. [Module: Analytics](#13-module-analytics---apiv1analytics)
14. [Module: Settings](#14-module-settings---apiv1settings)
15. [Error Reference](#15-error-reference)

---

## 1. Authentication Model & RBAC

The system uses **JWT Bearer Authentication** with short-lived access tokens (15 minutes default) and long-lived refresh tokens (7 days). Every protected endpoint requires the header:

```
Authorization: Bearer <accessToken>
```

### Role Hierarchy

The system enforces a strict 4-tier role hierarchy:

| Role | Description | Scope |
|---|---|---|
| `SUPER_ADMIN` | Full system access. Creates organizations, locations, and manages everything. | Global |
| `LOCATION_ADMIN` | Manages a single airport location. Can see only data within their `locationId`. | Location-scoped |
| `DEPARTMENT_ADMIN` | Manages a single department. Sees only data within their `departmentId`. | Department-scoped |
| `USER` | Standard user. Can submit forms and view their own submissions. | Personal |

> **Important:** `LOCATION_ADMIN` cannot assign roles of `SUPER_ADMIN` or `LOCATION_ADMIN`. `DEPARTMENT_ADMIN` cannot create users or deactivate accounts. These restrictions are enforced at the service layer, not just the route guards.

### JWT Payload Structure

When you decode an access token, it contains:

```typescript
interface JwtPayload {
  sub: string;          // User UUID
  email: string;
  role: string;         // One of the Role enum values
  departmentId?: string; // Present if user belongs to a department
  locationId?: string;  // Present if user's department has a location
  iat: number;
  exp: number;
}
```

---

## 2. Global Response Envelope

All responses are wrapped by the `TransformInterceptor` in a consistent envelope:

```typescript
// Success Response
{
  success: true,
  data: <T>,            // The actual response payload
  timestamp: string,    // ISO 8601 datetime
  statusCode: number
}

// Error Response
{
  success: false,
  error: {
    statusCode: number,
    message: string | string[],
    error: string       // HTTP error name e.g. "Conflict"
  },
  timestamp: string
}
```

### Paginated Response Shape

List endpoints return paginated results:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;       // Total matching records
    page: number;        // Current page (1-indexed)
    limit: number;       // Items per page
    totalPages: number;  // Math.ceil(total / limit)
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }
}
```

### Common Pagination Query Parameters

All list (`GET` collection) endpoints accept these query params unless noted otherwise:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number (1-indexed) |
| `limit` | `number` | `20` | Items per page |
| `sortBy` | `string` | `createdAt` | Field to sort by |
| `sortOrder` | `ASC \| DESC` | `DESC` | Sort direction |

---

## 3. Global Enums Reference

These enums are used across multiple modules. All values are uppercase strings.

### `Role`
```
SUPER_ADMIN        – Platform-wide administrator
LOCATION_ADMIN     – Single airport/location administrator  
DEPARTMENT_ADMIN   – Single department administrator
USER               – Regular staff/passenger user
```

### `TouchpointType`
```
FEEDBACK    – General satisfaction/rating form
COMPLAINT   – Formal passenger complaint form
INCIDENT    – Urgent incident report (safety, security)
```

### `SubmissionStatus`
```
OPEN         – Newly received, unassigned
IN_PROGRESS  – Currently being handled
RESOLVED     – Issue addressed
ARCHIVED     – Closed/dismissed
```

### `Priority`
```
LOW       – Standard, non-urgent
MEDIUM    – Default priority
HIGH      – Requires prompt attention
CRITICAL  – Immediate action required (auto-set for incidents or low ratings ≤2)
```

### `ReportType`
```
INCIDENT    – Safety/security incident
FEEDBACK    – Staff or system feedback
COMPLAINT   – Formal complaint report
SUGGESTION  – Improvement suggestion
```

### `InternalReportStatus` (Issues & Reports)
```
DRAFT       – Work in progress, not submitted
SUBMITTED   – Formally submitted for review
REVIEWED    – Has been reviewed by a supervisor
PENDING     – Awaiting action
IN_PROGRESS – Being actively worked on
RESOLVED    – Issue resolved
CLOSED      – Report closed/archived
```

### `TemplateStatus`
```
ACTIVE    – Template is available for use
INACTIVE  – Template is disabled
```

---

## 4. Module: Auth — `/api/v1/auth`

> **The story:** This is where every user's journey begins. Security officers, operations managers, and department heads all start here — presenting their credentials, receiving tokens, and continuing their work inside the system.

---

### `POST /api/v1/auth/register`

**Creates a new user account.** The FAAN system allows self-registration, assigning the `USER` role by default. To obtain administrative roles (`LOCATION_ADMIN`, `DEPARTMENT_ADMIN`), a user must be created by a higher-privileged admin.

- **Auth Required:** ❌ Public
- **Roles:** Any

#### Request Body

```typescript
interface RegisterDto {
  email: string;          // Required. Must be valid email. e.g. "john.doe@faan.gov.ng"
  password: string;       // Required. Minimum 8 characters.
  firstName: string;      // Required. Non-empty.
  lastName: string;       // Required. Non-empty.
  phone?: string;         // Optional. e.g. "+2348012345678"
  departmentId?: string;  // Optional UUID. Links user to a department on registration.
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;           // UUID
  email: string;
  firstName: string;
  lastName: string;
  role: "USER";         // Always USER on self-registration
  departmentId: string | null;
  createdAt: string;    // ISO 8601
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `409 Conflict` | `Email already registered` | Email exists in the system |
| `400 Bad Request` | `Department not found` | `departmentId` is invalid UUID |
| `400 Bad Request` | Validation errors array | Missing required fields, invalid email format, password < 8 chars |

---

### `POST /api/v1/auth/login`

**Authenticates a user and issues JWT tokens.** A successful login returns an access token (for API calls) and a refresh token (to renew the access token without re-logging in). The tokens also embed the user's `departmentId` and `locationId` for scoped data access.

- **Auth Required:** ❌ Public
- **Roles:** Any

#### Request Body

```typescript
interface LoginDto {
  email: string;    // e.g. "director@faan.gov.ng"
  password: string; // Min 8 chars
}
```

#### Success Response — `200 OK`

```typescript
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    departmentId: string | null;
    locationId: string | null;  // Resolved from user's department
  };
  accessToken: string;   // Short-lived JWT (15 min default)
  refreshToken: string;  // Long-lived JWT (7 days default)
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `401 Unauthorized` | `Invalid credentials` | Email not found OR wrong password |
| `401 Unauthorized` | `Account is inactive` | User account has been deactivated |

---

### `POST /api/v1/auth/refresh`

**Rotates the JWT token pair.** When the access token expires, the client calls this endpoint with the refresh token to get a fresh access + refresh token pair. The old refresh token is immediately revoked (rotation strategy).

- **Auth Required:** ❌ Public (uses refresh token in body)

#### Request Body

```typescript
interface RefreshTokenDto {
  refreshToken: string; // The JWT refresh token string
}
```

#### Success Response — `200 OK`

Same shape as the login response — returns a new `user` object, fresh `accessToken`, and fresh `refreshToken`.

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `401 Unauthorized` | `Invalid refresh token` | Token is malformed or signature is invalid |
| `401 Unauthorized` | `Refresh token has been revoked` | Token was already used or user logged out |
| `401 Unauthorized` | `Refresh token has expired` | Token is past its 7-day expiry |
| `401 Unauthorized` | `User not found or inactive` | Token references a deleted/inactive account |

---

### `POST /api/v1/auth/logout`

**Revokes all active refresh tokens for the current user.** After logout, any subsequent refresh attempts will fail. The access token remains valid until it expires naturally (no server-side blocklist for access tokens).

- **Auth Required:** ✅ Bearer Token
- **Roles:** Any authenticated user

#### Request Body
_(none — user identity is extracted from the JWT)_

#### Success Response — `200 OK`

```typescript
{ /* empty body */ }
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `401 Unauthorized` | `Unauthorized` | Missing or invalid Bearer token |

---

### `PATCH /api/v1/auth/change-password`

**Changes the current user's password.** Requires the current password as verification. Changing the password also revokes all refresh tokens, forcing the user to log in again on other devices.

- **Auth Required:** ✅ Bearer Token
- **Roles:** Any authenticated user

#### Request Body

```typescript
interface ChangePasswordDto {
  currentPassword: string; // Min 8 chars
  newPassword: string;     // Min 8 chars
}
```

#### Success Response — `200 OK`

```typescript
{ message: "Password changed successfully" }
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `400 Bad Request` | `Current password is incorrect` | The `currentPassword` does not match |
| `404 Not Found` | `User not found` | Token references a deleted user |

---

### `GET /api/v1/auth/profile`

**Retrieves the full profile of the currently authenticated user.** Returns a hierarchical view: the user's info → their department → the department's location → the location's organization.

- **Auth Required:** ✅ Bearer Token
- **Roles:** Any authenticated user

#### Success Response — `200 OK`

```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  department: {
    id: string;
    name: string;
    code: string;
    location: {
      id: string;
      name: string;
      airportCode: string;
      city: string;
      organization: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
  createdAt: string; // ISO 8601
}
```

---

### `PATCH /api/v1/auth/profile`

**Updates the current user's profile fields** (name, phone). Email and role changes require going through the Users module.

- **Auth Required:** ✅ Bearer Token
- **Roles:** Any authenticated user

#### Request Body

```typescript
interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
```

#### Success Response — `200 OK`

Returns the full profile object (same as `GET /auth/profile`).

---

## 5. Module: Users — `/api/v1/users`

> **The story:** Once a location is stood up, the `LOCATION_ADMIN` begins enrolling staff. Department heads are provisioned, security officers are registered, and passenger service agents are linked to their respective departments. This module is the staff directory — with role-aware filtering built in.

All endpoints in this module require authentication. Data is automatically scoped by role:
- `SUPER_ADMIN` → sees all users system-wide
- `LOCATION_ADMIN` → sees only users in departments within their location
- `DEPARTMENT_ADMIN` → sees only users in their own department

---

### `POST /api/v1/users`

**Creates a new user.** Unlike self-registration, this allows privileged users to create accounts with specific roles and department assignments.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

> **RBAC Note:** `LOCATION_ADMIN` cannot assign `SUPER_ADMIN` or `LOCATION_ADMIN` roles, and cannot create users in departments outside their location. `DEPARTMENT_ADMIN` cannot use this endpoint at all.

#### Request Body

```typescript
interface CreateUserDto {
  email: string;           // Required. Must be unique.
  password: string;        // Required. Min 8 chars.
  firstName: string;       // Required.
  lastName: string;        // Required.
  phone?: string;          // Optional.
  role: Role;              // Required. One of: SUPER_ADMIN | LOCATION_ADMIN | DEPARTMENT_ADMIN | USER
  departmentId?: string;   // Optional UUID. Links user to a department.
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    name: string;
    location: {
      id: string;
      name: string;
      airportCode: string;
    } | null;
  } | null;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `409 Conflict` | `Email already registered` | Email already in use |
| `403 Forbidden` | `Location admins cannot assign higher or equivalent administrative roles` | `LOCATION_ADMIN` trying to create another admin |
| `403 Forbidden` | `Location admins can only create users in departments within their location` | Cross-location user creation |
| `403 Forbidden` | `Department admins cannot create users` | `DEPARTMENT_ADMIN` calling this endpoint |
| `404 Not Found` | `Department not found` | `departmentId` doesn't exist |

---

### `GET /api/v1/users`

**Lists all users with role-scoped filtering and pagination.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `page` | `number` | Page number |
| `limit` | `number` | Items per page |
| `sortBy` | `string` | Field to sort by (default: `createdAt`) |
| `sortOrder` | `ASC \| DESC` | Sort direction |
| `search` | `string` | Search across email, firstName, lastName |
| `isActive` | `"true" \| "false"` | Filter by active status |
| `role` | `Role` | Filter by specific role |
| `departmentId` | `UUID` | Filter by department (SUPER_ADMIN only effective) |
| `locationId` | `UUID` | Filter by location (SUPER_ADMIN only effective) |

#### Success Response — `200 OK`

Returns `PaginatedResponse<UserResponse>` where each item matches the `CreateUser` response shape.

---

### `GET /api/v1/users/:id`

**Retrieves a single user by UUID.** Returns full nested department/location/organization context.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | `UUID` | User's unique ID |

#### Success Response — `200 OK`

Same shape as user create response, but with full `department.location.organization` nesting.

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `User not found` | UUID doesn't exist or user was soft-deleted |
| `400 Bad Request` | `Validation failed (uuid is expected)` | `id` is not a valid UUID |

---

### `PATCH /api/v1/users/:id`

**Updates a user's fields.** Role-scoped restrictions apply to which fields different admin types can modify.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

> **RBAC Note:** `LOCATION_ADMIN` cannot assign `SUPER_ADMIN` role or update users outside their location. `DEPARTMENT_ADMIN` cannot update users outside their department, cannot change roles to `SUPER_ADMIN`/`LOCATION_ADMIN`, and cannot activate/deactivate accounts.

#### Request Body

```typescript
interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
  departmentId?: string | null; // null to disconnect from department
  password?: string;            // Min 8 chars if provided
}
```

#### Success Response — `200 OK`

Returns the updated user object (same shape as create response).

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `User not found` | UUID doesn't exist or soft-deleted |
| `409 Conflict` | `Email already in use` | Trying to update email to one that already exists |
| `403 Forbidden` | Various permission messages | Role-based restriction violations |

---

### `DELETE /api/v1/users/:id`

**Soft-deletes a user.** The user record is preserved in the database with `deletedAt` set and `isActive` set to `false`. They cannot log in but their historical data remains intact.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Success Response — `204 No Content`

_(empty body)_

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `User not found` | UUID doesn't exist or already deleted |

---

## 6. Module: Organizations — `/api/v1/organizations`

> **The story:** Before any airport can be configured, it must belong to an organization — the legal entity that operates the airport. FAAN itself is an organization. Create the organization first; everything else hangs off it.

---

### `POST /api/v1/organizations`

**Creates a new organization.** Only the Super Admin can do this, as organizations represent top-level entities in the system hierarchy.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN` only

#### Request Body

```typescript
interface CreateOrganizationDto {
  name: string;          // Required. e.g. "Federal Airports Authority of Nigeria"
  code: string;          // Required. Unique identifier. e.g. "FAAN"
  description?: string;  // Optional.
  logo?: string;         // Optional. URL to logo image.
  supportUrl?: string;   // Optional. Support/helpdesk URL.
  emailAlerts?: boolean; // Optional. Default: true
  smsAlerts?: boolean;   // Optional. Default: false
  retentionDays?: number; // Optional. Data retention period. Default: 90
  webhookUrl?: string;   // Optional. Webhook for event notifications.
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo: string | null;
  supportUrl: string | null;
  emailAlerts: boolean;
  smsAlerts: boolean;
  retentionDays: number;
  apiKey: string | null;
  webhookUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `409 Conflict` | `Organization with this code already exists` | `code` is not unique |

---

### `GET /api/v1/organizations`

**Lists all organizations with pagination and search.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `search` | `string` | Searches name, code, and description |
| `isActive` | `"true" \| "false"` | Filter by active status |
| + pagination params | — | See global pagination |

#### Success Response — `200 OK`

`PaginatedResponse<Organization>` with each item matching the create response shape.

---

### `GET /api/v1/organizations/:id`

**Gets a single organization with its active locations summary.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  // ...all Organization fields
  locations: Array<{
    id: string;
    name: string;
    code: string;
    airportCode: string;
    city: string;
    _count: {
      departments: number;
      touchpoints: number;
    };
  }>;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Organization not found` | UUID doesn't exist |

---

### `PATCH /api/v1/organizations/:id`

**Updates organization details.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN` only

#### Request Body
All fields from `CreateOrganizationDto` are optional.

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Organization not found` | UUID doesn't exist |
| `409 Conflict` | `Organization with this code already exists` | Code clash with another org |

---

### `DELETE /api/v1/organizations/:id`

**Permanently deletes an organization** and all cascading data (locations, departments, touchpoints, submissions).

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN` only

#### Success Response — `204 No Content`

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Organization not found` | UUID doesn't exist |

---

## 7. Module: Locations — `/api/v1/locations`

> **The story:** An organization like FAAN operates multiple airports. Murtala Muhammed Airport (MMA) in Lagos, Nnamdi Azikiwe International Airport (ABV) in Abuja — each is a **Location**. Locations are linked to organizations and identified by their IATA airport code. Once a location is registered, departments can be created within it.

---

### `POST /api/v1/locations`

**Creates a new airport location under an organization.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Request Body

```typescript
interface CreateLocationDto {
  organizationId: string; // Required UUID. Must be an existing organization.
  name: string;           // Required. e.g. "Murtala Muhammed International Airport"
  code: string;           // Required. Unique code. e.g. "MMA-LOS"
  airportCode: string;    // Required. IATA code. e.g. "LOS"
  address: string;        // Required. Physical address.
  city: string;           // Required. e.g. "Lagos"
  state: string;          // Required. e.g. "Lagos State"
  country?: string;       // Optional. Default: "Nigeria"
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;
  organizationId: string;
  name: string;
  code: string;
  airportCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Organization not found` | `organizationId` is invalid |
| `409 Conflict` | `Location with this code already exists` | `code` is not globally unique |
| `403 Forbidden` | `Location admins can only create locations within their organization` | Cross-org attempt |

---

### `GET /api/v1/locations`

**Lists locations with organization info and counts.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

> **Scoping:** `LOCATION_ADMIN` only sees their own location. `DEPARTMENT_ADMIN` only sees the location their department belongs to. `SUPER_ADMIN` sees all.

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `search` | `string` | Searches name, code, city, airportCode |
| `isActive` | `"true" \| "false"` | Filter by active status |
| `organizationId` | `UUID` | Filter by organization (SUPER_ADMIN only) |
| + pagination params | — | See global pagination |

#### Success Response — `200 OK`

```typescript
PaginatedResponse<{
  // ...all Location fields
  organization: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    departments: number;
    touchpoints: number;
  };
}>
```

---

### `GET /api/v1/locations/:id`

**Gets a single location with its organization and active departments.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  // ...all Location fields
  organization: Organization;
  departments: Array<{
    id: string;
    name: string;
    code: string;
    _count: {
      users: number;
      touchpoints: number;
    };
  }>;
  _count: {
    touchpoints: number;
    reports: number;
  };
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Location not found` | UUID doesn't exist |

---

### `PATCH /api/v1/locations/:id`

**Updates location details.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Request Body
All fields from `CreateLocationDto` are optional. `code` uniqueness is enforced (excluding self).

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Location not found` | UUID doesn't exist |
| `409 Conflict` | `Location with this code already exists` | Code clash with another location |

---

### `DELETE /api/v1/locations/:id`

**Permanently deletes a location** and all cascading data.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN` only

#### Success Response — `204 No Content`

---

## 8. Module: Departments — `/api/v1/departments`

> **The story:** Inside the airport, teams are organized into departments. The Security Department at Gate Area A. The Lounge Operations team. The Maintenance crew. Each department gets its own touchpoints, handles its own submissions, and generates its own reports. This module manages that internal structure.

---

### `POST /api/v1/departments`

**Creates a new department within a location.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Request Body

```typescript
interface CreateDepartmentDto {
  locationId: string;    // Required UUID. Parent location.
  name: string;          // Required. e.g. "Passenger Services"
  code: string;          // Required. Unique within the location. e.g. "PS-01"
  responsibility?: string; // Optional. Brief mandate description.
  color?: string;        // Optional. Hex color for UI. Default: "#6366F1"
  description?: string;  // Optional. Longer description.
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;
  locationId: string;
  name: string;
  code: string;
  responsibility: string | null;
  color: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Location not found` | `locationId` doesn't exist |
| `409 Conflict` | `Department with this code already exists in this location` | Code is not unique within the location |
| `403 Forbidden` | `Location admins can only create departments within their location` | Cross-location attempt |
| `403 Forbidden` | `Department admins cannot create departments` | DEPT_ADMIN attempting this |

---

### `GET /api/v1/departments`

**Lists departments with staff/touchpoint counts.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

> **Scoping:** `LOCATION_ADMIN` → only departments in their location. `DEPARTMENT_ADMIN` → only their own department.

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `search` | `string` | Searches name, code, description |
| `isActive` | `"true" \| "false"` | Filter by active status |
| `locationId` | `UUID` | Filter by location (SUPER_ADMIN only effective) |
| + pagination params | — | See global pagination |

#### Success Response — `200 OK`

```typescript
PaginatedResponse<{
  id: string;
  name: string;
  code: string;
  responsibility: string | null;
  color: string;
  description: string | null;
  isActive: boolean;
  location: {
    id: string;
    name: string;
    airportCode: string;
    city: string;
  };
  staffCount: number;        // Number of users in this department
  touchpointCount: number;   // Number of touchpoints linked
  activeIssueCount: number;  // Open/In-progress reports
}>
```

---

### `GET /api/v1/departments/:id`

**Gets a single department with staff list and location/org context.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  // ...all Department fields
  location: {
    // ...full Location object
    organization: Organization;
  };
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
  }>;
  _count: {
    touchpoints: number;
  };
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Department not found` | UUID doesn't exist |

---

### `PATCH /api/v1/departments/:id`

**Updates department details.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

> **RBAC Note:** `LOCATION_ADMIN` can only update departments within their location. `DEPARTMENT_ADMIN` can only update their own department (name, description, etc.).

#### Request Body
All fields from `CreateDepartmentDto` are optional.

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Department not found` | UUID doesn't exist |
| `409 Conflict` | `Department with this code already exists in this location` | Code clash |
| `403 Forbidden` | Permission messages | Cross-location or cross-department edit |

---

### `DELETE /api/v1/departments/:id`

**Permanently deletes a department** and cascades to related data.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Success Response — `204 No Content`

---

### `POST /api/v1/departments/:id/admins`

**Assigns or creates a department administrator.** This is the secure way to provision a `DEPARTMENT_ADMIN`. If the email already exists in the system and the user belongs to this department, their role is elevated. If the email is new, a new user account is created with the `DEPARTMENT_ADMIN` role.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | `UUID` | Target department ID |

#### Request Body

```typescript
interface AssignAdminDto {
  email: string;       // Required. Email of the admin (new or existing).
  password: string;    // Required (for new users). Min 8 chars.
  firstName: string;   // Required (for new users).
  lastName: string;    // Required (for new users).
  phone?: string;      // Optional.
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "DEPARTMENT_ADMIN"; // Always set to DEPARTMENT_ADMIN
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Department not found` | Department UUID is invalid |
| `409 Conflict` | `User already belongs to a different department` | Email exists but is in another department |
| `403 Forbidden` | `Location admins can only assign admins to departments within their location` | Cross-location attempt |

---

## 9. Module: Touchpoints — `/api/v1/touchpoints`

> **The story:** Touchpoints are the physical-digital bridge. A QR code sticker on the seat back of the departure lounge. A tablet mounted at the security checkpoint. Each touchpoint has a **form configuration** — a JSON schema defining what questions passengers see. When scanned, it leads to `GET /api/v1/touchpoints/public/:slug`. The system auto-generates a unique `slug` (e.g., `tp-a3b2c1`) for each touchpoint.

---

### `POST /api/v1/touchpoints`

**Creates a new touchpoint with a form configuration.** A cryptographically secure slug is auto-generated. The `formConfig` defines the form fields shown when passengers scan the QR code.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface CreateTouchpointDto {
  title: string;          // Required. Max 255 chars. e.g. "Gate 15 Feedback"
  description?: string;   // Optional. Max 1000 chars.
  type: TouchpointType;   // Required. FEEDBACK | COMPLAINT | INCIDENT
  locationId: string;     // Required UUID. Must be a valid location.
  departmentId: string;   // Required UUID. Must belong to the locationId.
  formConfig: FormFieldDto[]; // Required. Array of form fields.
}

interface FormFieldDto {
  id: number;             // Field identifier (unique within form)
  type: string;           // "text" | "textarea" | "rating" | "select" | "checkbox"
  label: string;          // Display label. e.g. "Overall Experience"
  name?: string;          // Key used in formData. Auto-generated as "field_N" if absent.
  required?: boolean;     // Whether the field is mandatory. Default: false
  options?: string[];     // For "select" type: available choices
  maxRating?: number;     // For "rating" type: max rating value. e.g. 5
}
```

**Example `formConfig`:**
```json
[
  { "id": 1, "type": "rating", "label": "Overall Experience", "name": "overall_experience", "required": true, "maxRating": 5 },
  { "id": 2, "type": "select", "label": "Area", "name": "area", "required": true, "options": ["Check-in", "Security", "Lounge", "Gate"] },
  { "id": 3, "type": "textarea", "label": "Additional Comments", "name": "comments", "required": false }
]
```

#### Success Response — `201 Created`

```typescript
{
  id: string;
  locationId: string;
  departmentId: string;
  createdById: string;
  title: string;
  description: string | null;
  type: TouchpointType;
  slug: string;           // e.g. "tp-a3b2c1" — auto-generated, unique
  formConfig: FormFieldDto[];
  isActive: boolean;      // Defaults to true
  interactions: number;   // Defaults to 0
  createdAt: string;
  updatedAt: string;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Location not found` | `locationId` is invalid |
| `404 Not Found` | `Department not found` | `departmentId` is invalid |
| `403 Forbidden` | `Department does not belong to this location` | Mismatched location/department IDs |
| `403 Forbidden` | `Location admins can only create touchpoints within their location` | Cross-location attempt |
| `403 Forbidden` | `Department admins can only create touchpoints for their department` | Cross-department attempt |

---

### `GET /api/v1/touchpoints`

**Lists touchpoints with location/department context.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `search` | `string` | Searches title, description, slug |
| `isActive` | `"true" \| "false"` | Filter by active status |
| `type` | `TouchpointType` | Filter by type: FEEDBACK, COMPLAINT, INCIDENT |
| `locationId` | `UUID` | Filter by location (SUPER_ADMIN) |
| `departmentId` | `UUID` | Filter by department |
| + pagination params | — | See global pagination |

#### Success Response — `200 OK`

```typescript
PaginatedResponse<{
  id: string;
  title: string;
  description: string | null;
  type: TouchpointType;
  slug: string;
  isActive: boolean;
  interactions: number;
  location: { id: string; name: string; airportCode: string; city: string; };
  department: { id: string; name: string; code: string; };
  createdAt: string;
  updatedAt: string;
}>
```

---

### `GET /api/v1/touchpoints/public/lookup`

**Looks up a touchpoint by slug.** No auth required — this is the initial call from a scanned QR code. Returns the touchpoint's form configuration so the frontend can render the correct form.

- **Auth Required:** ❌ Public
- **Roles:** Any

#### Request Body

```typescript
{ slug: string } // e.g. "tp-a3b2c1"
```

#### Success Response — `200 OK`

```typescript
{
  id: string;
  title: string;
  description: string | null;
  type: TouchpointType;
  slug: string;
  formConfig: FormFieldDto[];   // The form to render
  isActive: boolean;
  publicUrl: string;            // Full public URL: https://faan.vemtap.com/submit/tp-a3b2c1
  location: {
    id: string; name: string; airportCode: string; city: string; state: string;
  };
  department: { id: string; name: string; code: string; };
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Touchpoint not found` | Slug doesn't match any touchpoint |

---

### `GET /api/v1/touchpoints/public/:slug`

**Gets touchpoint form data by slug in the URL path.** Public, no authentication. Alternative to the body-based lookup above — suitable for direct URL access from QR codes.

- **Auth Required:** ❌ Public

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `slug` | `string` | e.g. `tp-a3b2c1` |

#### Success Response — `200 OK`

Same shape as the `/public/lookup` response.

---

### `GET /api/v1/touchpoints/:id`

**Gets a single touchpoint by UUID with full context including creator.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  // ...all Touchpoint fields
  location: {
    // ...full Location object
    organization: Organization;
  };
  department: Department;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}
```

---

### `GET /api/v1/touchpoints/:id/qr-data`

**Generates QR code data for a touchpoint.** Returns the public URL and a base64-encoded data URL that can be used to render a QR code image.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  slug: string;       // e.g. "tp-a3b2c1"
  url: string;        // e.g. "https://faan.vemtap.com/submit/tp-a3b2c1"
  qrDataUrl: string;  // base64 encoded: "data:text/plain;base64,aHR0..."
}
```

---

### `PATCH /api/v1/touchpoints/:id`

**Updates a touchpoint's details and/or form configuration.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body
All fields from `CreateTouchpointDto` are optional, plus:

```typescript
interface UpdateTouchpointDto extends Partial<CreateTouchpointDto> {
  isActive?: boolean;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Touchpoint not found` | UUID doesn't exist |
| `403 Forbidden` | `Cannot update touchpoints outside your location/department` | Scope violation |

---

### `PATCH /api/v1/touchpoints/:id/status`

**Toggles the active/inactive status of a touchpoint.** When inactive, the public form becomes inaccessible and new submissions are blocked.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface UpdateTouchpointStatusDto {
  isActive: boolean; // true = enable, false = disable
}
```

#### Success Response — `200 OK`

Returns the updated Touchpoint object.

---

### `PATCH /api/v1/touchpoints/:id/link`

**Re-assigns a touchpoint to a different department.** Useful when reorganizing departments or when a touchpoint's responsibility changes.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface LinkTouchpointDto {
  departmentId: string; // UUID of the target department
}
```

#### Success Response — `200 OK`

Returns the updated Touchpoint object.

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Touchpoint not found` | Touchpoint UUID is invalid |
| `404 Not Found` | `Department not found` | Target department UUID is invalid |

---

### `DELETE /api/v1/touchpoints/:id`

**Permanently deletes a touchpoint** and all its submissions.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

> **Note:** `DEPARTMENT_ADMIN` cannot delete touchpoints — they can only disable them via `/status`.

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Touchpoint not found` | UUID doesn't exist |
| `403 Forbidden` | `Department admins cannot delete touchpoints` | DEPT_ADMIN attempting delete |
| `403 Forbidden` | `Cannot delete touchpoints outside your location` | Cross-location attempt |

---

## 10. Module: Submissions — `/api/v1/submissions`

> **The story:** A passenger at the check-in counter feels frustrated by the long queue. They scan the QR code on a nearby pillar and fill out a 30-second complaint form. That form data arrives here as a **Submission**. The system validates the form against the touchpoint's config, assigns an auto-generated code (e.g. `SUB-8812`), and uses a priority detection algorithm to flag it accordingly.
>
> **Auto-Priority Logic:**
> - Any `INCIDENT`-type touchpoint → `HIGH`
> - Rating field value ≤ 2 → `HIGH`
> - Message/description containing keywords like `hazard`, `fire`, `emergency`, `injury`, `accident`, `danger`, `threat` → `CRITICAL`
> - All others → `MEDIUM`

---

### `POST /api/v1/submissions/public`

**Submits a form response from a public QR code scan.** No authentication required — this is the endpoint the passenger-facing frontend calls after a user fills out the form.

- **Auth Required:** ❌ Public
- **Roles:** Any (anonymous)

#### Request Body

```typescript
interface CreatePublicSubmissionDto {
  slug: string;                       // Required. Touchpoint slug. e.g. "tp-a3b2c1"
  formData: Record<string, any>;      // Required. Key-value pairs matching the touchpoint's formConfig.
  submittedAt?: string;               // Optional. ISO 8601 date. Defaults to now.
}

// Example formData for a feedback touchpoint:
{
  "overall_experience": 4,
  "area": "Security",
  "comments": "The scanner was slow but staff were polite."
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;           // UUID
  code: string;         // e.g. "SUB-8812"
  touchpointId: string;
  userId: null;         // Always null for public submissions
  status: "OPEN";       // Default
  priority: Priority;   // Auto-computed
  formData: Record<string, any>;
  submittedAt: string;
  createdAt: string;
  touchpoint: {
    id: string;
    title: string;
    type: TouchpointType;
    location: Location;
    department: Department;
  };
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Touchpoint not found` | Slug doesn't match any touchpoint |
| `403 Forbidden` | `Touchpoint is not active` | Touchpoint has been disabled |
| `400 Bad Request` | `Form validation failed` + errors array | Required fields missing, invalid rating range, invalid select option |

**Form Validation Error Shape:**
```typescript
{
  message: "Form validation failed",
  errors: [
    "Field \"Overall Experience\" (overall_experience) is required",
    "Field \"Area\" must be one of: Check-in, Security, Lounge, Gate"
  ]
}
```

---

### `POST /api/v1/submissions`

**Submits a form response when authenticated.** For authenticated staff who submit forms on behalf of passengers, or for internal testing. Links the submission to the authenticated user.

- **Auth Required:** ✅ Bearer Token (optional — same endpoint can work with or without auth)
- **Roles:** Any

#### Request Body

```typescript
interface CreateSubmissionDto {
  touchpointId: string;              // Required UUID. The touchpoint's database ID (not slug).
  formData: Record<string, any>;     // Required. Must match touchpoint's formConfig.
  submittedAt?: string;              // Optional ISO 8601.
}
```

#### Success Response — `201 Created`

Same shape as the public submission response, but with `userId` populated if authenticated.

---

### `GET /api/v1/submissions/my-submissions`

**Gets the current authenticated user's own submission history.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** Any authenticated user

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `page` | `number` | Page number |
| `limit` | `number` | Items per page |
| `sortBy` | `string` | Sort field |
| `sortOrder` | `ASC \| DESC` | Sort direction |

#### Success Response — `200 OK`

`PaginatedResponse<Submission>` with touchpoint location/department context.

---

### `GET /api/v1/submissions`

**Lists all submissions with advanced filtering.** Returns a simplified list view optimized for the submissions dashboard table.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

> **Scoping:** `LOCATION_ADMIN` → submissions from touchpoints in their location. `DEPARTMENT_ADMIN` → submissions assigned to their department.

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `status` | `SubmissionStatus` | Filter: OPEN, IN_PROGRESS, RESOLVED, ARCHIVED |
| `priority` | `Priority` | Filter: LOW, MEDIUM, HIGH, CRITICAL |
| `departmentId` | `UUID` | Filter by assigned department |
| `locationId` | `UUID` | Filter by location |
| `search` | `string` | Search by code (e.g. "SUB-8812") or form data content |
| `startDate` | `string` | ISO date filter: from |
| `endDate` | `string` | ISO date filter: to |
| + pagination params | — | See global pagination |

#### Success Response — `200 OK`

```typescript
PaginatedResponse<{
  id: string;         // The submission CODE, e.g. "SUB-8812"
  type: TouchpointType;
  location: string;   // Location name (not ID)
  status: SubmissionStatus;
  department: string; // Department name (not ID)
  priority: Priority;
  submittedAt: string;
}>
```

---

### `GET /api/v1/submissions/export`

**Exports submissions to a CSV file download.** Accepts the same filters as the list endpoint. The response is a file attachment, not JSON.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters
Same as `GET /api/v1/submissions`.

#### Success Response — `200 OK` (CSV File)

```
Content-Type: text/csv
Content-Disposition: attachment; filename="submissions-2026-04-16.csv"
```

CSV Columns: `Code, Type, Location, Airport Code, Department, Status, Priority, Submitted At, Created At, Submitted By, User Email`

---

### `GET /api/v1/submissions/:id`

**Gets full submission details.** The `:id` param accepts either a UUID or a submission code (`SUB-8812`).

- **Auth Required:** ✅ Bearer Token (optional — works anonymous but with reduced access)

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | `UUID \| string` | Submission UUID or code like `SUB-8812` |

#### Success Response — `200 OK`

```typescript
{
  id: string;           // The submission CODE, e.g. "SUB-8812"
  uuid: string;         // The actual UUID
  formData: Record<string, any>; // The raw form answers
  status: SubmissionStatus;
  priority: Priority;
  type: TouchpointType;
  location: string;     // Location name
  department: string;   // Assigned department name (or touchpoint's dept)
  submittedAt: string;
  createdAt: string;
  internalNotes: Array<{
    author: string;     // "System" or "FirstName LastName"
    content: string;
    time: string;       // ISO 8601
    isSystem: boolean;
  }>;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Submission not found` | ID/code doesn't match any submission |
| `403 Forbidden` | `You do not have access to this submission` | `DEPARTMENT_ADMIN` trying to view a submission outside their dept |

---

### `PATCH /api/v1/submissions/:id`

**Updates a submission's status, priority, or department assignment.** When status changes, a system note is automatically appended to the submission's audit trail.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `id` | `UUID \| string` | Submission UUID or code like `SUB-8812` |

#### Request Body

```typescript
interface UpdateSubmissionDto {
  status?: SubmissionStatus;   // OPEN | IN_PROGRESS | RESOLVED | ARCHIVED
  priority?: Priority;         // LOW | MEDIUM | HIGH | CRITICAL
  departmentId?: string | null; // Reassign to another dept; null = unassign
}
```

#### Success Response — `200 OK`

```typescript
{
  id: string;           // Submission CODE
  status: SubmissionStatus;
  priority: Priority;
  departmentId: string | null;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Submission not found` | ID/code invalid |
| `404 Not Found` | `Department not found` | Target `departmentId` invalid |
| `403 Forbidden` | `You do not have access to modify this submission` | DEPT_ADMIN scope violation |

---

### `POST /api/v1/submissions/:id/notes`

**Adds an internal note to a submission.** Notes are visible only to staff, not passengers. All notes include the author's name and timestamp.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface CreateNoteDto {
  content: string; // Required. Non-empty. e.g. "Checked CCTV — queue was indeed backed up."
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;         // Note UUID
  author: string;     // "FirstName LastName"
  content: string;
  time: string;       // ISO 8601
  isSystem: false;    // Always false for manual notes
}
```

---

## 11. Module: Reports & Issues — `/api/v1/reports`

> **The story:** Not everything is passenger-driven. An airport operations officer spots a broken escalator. A security supervisor notices a suspicious package. These don't wait for passenger feedback — staff raise them directly as **Issues**. Separately, after a major incident, a supervisor may escalate a passenger submission into a formal **Internal Report** for documentation and tracking. This module handles both.

---

### `POST /api/v1/reports`

**Creates a formal internal report from an existing passenger submission.** Turns a raw submission into a tracked document with title, content, and type classification.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface CreateInternalReportDto {
  submissionId: string;  // Required UUID. The submission to base this report on.
  title: string;         // Required. Max 255 chars. e.g. "Security Breach at Gate A1"
  content: string;       // Required. Detailed description.
  reportType: ReportType; // Required. INCIDENT | FEEDBACK | COMPLAINT | SUGGESTION
  priority?: Priority;   // Optional. Default: MEDIUM
}
```

#### Success Response — `201 Created`

Returns the created `InternalReport` object.

---

### `POST /api/v1/reports/submit`

**Submits a completed report from a report template.** Staff fill out a structured template (e.g., "Daily Shift Report") and submit it. The report gets an auto-generated code.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`, `USER`

#### Request Body

```typescript
interface SubmitReportDto {
  templateId: string;                    // Required UUID. The report template to use.
  title: string;                         // Required. e.g. "Daily Shift Report - Apr 16"
  date: string;                          // Required. ISO date. e.g. "2026-04-16"
  fieldValues: Record<string, unknown>;  // Required. Key-value answers matching template schema.
}

// Example fieldValues for a "Daily Shift Report" template:
{
  "staff_name": "John Adewale",
  "shift": "Morning",
  "incidents_count": 0,
  "remarks": "Smooth shift, all lanes operational."
}
```

#### Success Response — `201 Created`

Returns the created `InternalReport` object with a generated code.

---

### `GET /api/v1/reports/my-reports`

**Gets reports authored by the currently authenticated user.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`, `USER`

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `search` | `string` | Search in title |
| `status` | `InternalReportStatus` | Filter by status |
| `reportType` | `ReportType` | Filter by type |
| `priority` | `Priority` | Filter by priority |
| `startDate` | `string` | Date from filter |
| `endDate` | `string` | Date to filter |
| + pagination params | — | See global pagination |

---

### `GET /api/v1/reports/template-reports`

**Lists all reports submitted from templates, with pagination.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters
Same as `my-reports`.

---

### `GET /api/v1/reports/template-reports/export`

**Exports template reports as CSV.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — CSV file download

---

### `PATCH /api/v1/reports/template-reports/:id/status`

**Updates the status of a template-based report.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface UpdateReportStatusDto {
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
}
```

---

### `GET /api/v1/reports/kanban`

**Returns all open issues organized into Kanban columns.** Designed for the drag-and-drop issue board in the dashboard. Issues are grouped into four columns: `pending`, `inProgress`, `resolved`, `closed`.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  pending: IssueListItem[];
  inProgress: IssueListItem[];
  resolved: IssueListItem[];
  closed: IssueListItem[];
}

interface IssueListItem {
  id: string;             // Issue code
  title: string;
  priority: Priority;
  location: string;       // Location name
  department: string | null;
  assignee: string | null; // Assignee full name
  createdAt: string;
}
```

---

### `POST /api/v1/reports/issues`

**Creates a new issue manually.** Staff-initiated issues (not from passenger submissions). Useful for reporting infrastructure problems, safety hazards, or operational incidents observed directly.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface CreateIssueDto {
  title: string;           // Required. Max 255 chars.
  content: string;         // Required. Detailed description.
  reportType?: ReportType; // Optional. Default: INCIDENT
  priority?: Priority;     // Optional. Default: MEDIUM
  locationId: string;      // Required UUID. Where the issue is occurring.
  departmentId?: string;   // Optional UUID. Responsible department.
  submissionId?: string;   // Optional UUID. Links to a passenger submission if relevant.
}
```

#### Success Response — `201 Created`

Returns the created Issue (InternalReport) object.

---

### `GET /api/v1/reports/issues`

**Lists all issues with filtering and pagination.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `status` | `InternalReportStatus` | Filter by status |
| `priority` | `Priority` | Filter by priority |
| `locationId` | `UUID` | Filter by location |
| `departmentId` | `UUID` | Filter by department |
| `authorId` | `UUID` | Filter by who created it |
| `assignedTo` | `UUID` | Filter by assignee |
| `startDate` | `string` | Date from |
| `endDate` | `string` | Date to |
| + pagination params | — | See global pagination |

---

### `GET /api/v1/reports/issues/:id`

**Gets full issue details**, including notes thread. `:id` accepts UUID or issue code.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  id: string;             // Issue CODE (e.g. "ISS-1234")
  uuid: string;
  title: string;
  content: string;
  status: InternalReportStatus;
  priority: Priority;
  reportType: ReportType;
  location: string;       // Location name
  department: string | null;
  author: string;         // Author full name
  assignee: string | null;
  createdAt: string;
  notes: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
    isSystem: boolean;
  }>;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Issue/Report not found` | UUID/code doesn't exist |

---

### `PATCH /api/v1/reports/issues/:id`

**Updates an issue's details** (title, content, status, priority, assignment).

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface UpdateIssueDto {
  title?: string;
  content?: string;
  status?: InternalReportStatus;
  priority?: Priority;
  assignedTo?: string;    // UUID of user to assign
  departmentId?: string;  // UUID of department to assign
}
```

---

### `PATCH /api/v1/reports/issues/:id/status`

**Updates only an issue's status.** This is the lightweight endpoint called by drag-and-drop actions on the Kanban board.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface UpdateIssueStatusDto {
  status: InternalReportStatus;
}
```

---

### `POST /api/v1/reports/issues/:id/notes`

**Adds a note/comment to an issue.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface CreateIssueNoteDto {
  content: string; // Required. Non-empty.
}
```

#### Success Response — `201 Created`

```typescript
{
  id: string;
  author: string;     // Author's full name
  content: string;
  time: string;       // ISO 8601
  isSystem: false;
}
```

---

### `GET /api/v1/reports`

**Lists all internal reports (non-Kanban view) with pagination.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

---

### `GET /api/v1/reports/:id`

**Gets a report by UUID.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

---

### `PATCH /api/v1/reports/:id`

**Updates an internal report.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

---

## 12. Module: Report Templates — `/api/v1/report-templates`

> **The story:** The airport operations director at ABV airport needs department heads to submit a standardized **Daily Activity Report** every morning. Instead of emailing around a Word document, she creates a **Report Template** — a structured form schema. Now every morning, the `DEPARTMENT_ADMIN` opens their dashboard, picks "Daily Activity Report", fills in the fields, and submits. All submissions are tracked, filterable, and exportable.

---

### `POST /api/v1/report-templates`

**Creates a new report template with a field schema.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface CreateReportTemplateDto {
  name: string;           // Required. e.g. "Daily Shift Report"
  description?: string;   // Optional.
  locationId: string;     // Required UUID.
  departmentId?: string;  // Optional UUID. If set, template is dept-specific.
  schema: ReportFieldDto[]; // Required. Array of fields defining the form.
}

interface ReportFieldDto {
  id: number;             // Unique field identifier
  type: string;           // "text" | "textarea" | "select" | "number" | "date"
  label: string;          // Display label. e.g. "Staff Name"
  name?: string;          // Field key for fieldValues. Auto-generated if absent.
  required?: boolean;     // Default: false
  options?: string[];     // For "select" type.
}
```

**Example Schema:**
```json
[
  { "id": 1, "type": "text", "label": "Officer Name", "name": "officer_name", "required": true },
  { "id": 2, "type": "select", "label": "Shift", "name": "shift", "required": true, "options": ["Morning", "Afternoon", "Night"] },
  { "id": 3, "type": "number", "label": "Passengers Processed", "name": "passengers_count", "required": false },
  { "id": 4, "type": "textarea", "label": "Remarks", "name": "remarks", "required": false }
]
```

#### Success Response — `201 Created`

```typescript
{
  id: string;
  name: string;
  description: string | null;
  locationId: string;
  departmentId: string | null;
  schema: ReportFieldDto[];
  status: TemplateStatus;   // "ACTIVE" by default
  createdAt: string;
  updatedAt: string;
}
```

---

### `GET /api/v1/report-templates`

**Lists report templates with filtering.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `locationId` | `UUID` | Filter by location |
| `departmentId` | `UUID` | Filter by department |
| `status` | `TemplateStatus` | ACTIVE or INACTIVE |
| `search` | `string` | Search by template name |
| + pagination params | — | See global pagination |

---

### `GET /api/v1/report-templates/:id`

**Gets a single template by UUID.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `404 Not Found` | `Template not found` | UUID doesn't exist |

---

### `PATCH /api/v1/report-templates/:id`

**Updates a report template.** Can change schema fields, description, or activate/deactivate the template.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Request Body

```typescript
interface UpdateReportTemplateDto extends Partial<CreateReportTemplateDto> {
  status?: TemplateStatus; // ACTIVE | INACTIVE
}
```

---

### `DELETE /api/v1/report-templates/:id`

**Deletes a report template.** Reports already submitted using this template are preserved (the `templateId` is set to null via cascade rules).

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Success Response — `204 No Content`

---

## 13. Module: Analytics — `/api/v1/analytics`

> **The story:** By the end of each day, the Director of Airport Operations opens their dashboard. A row of KPI cards shows total submissions, open incidents, average passenger ratings. A line chart shows the trend of complaints over the past 30 days. A bar chart reveals which department has the worst resolution rate. This entire module feeds that experience.

All analytics endpoints are role-scoped:
- `SUPER_ADMIN` → system-wide data with optional location/department filters
- `LOCATION_ADMIN` → automatically scoped to their location
- `DEPARTMENT_ADMIN` → automatically scoped to their department

---

### Common Analytics Query Parameters

Most analytics endpoints support these base parameters (in addition to endpoint-specific ones):

```typescript
interface QueryAnalyticsDto {
  range?: TimeRange;      // See TimeRange enum below
  startDate?: string;     // ISO date (used when range is CUSTOM)
  endDate?: string;       // ISO date (used when range is CUSTOM)
  locationId?: string;    // UUID (SUPER_ADMIN only)
  departmentId?: string;  // UUID (SUPER_ADMIN and LOCATION_ADMIN only)
}
```

**`TimeRange` Enum:**
```
TODAY         – From start of today
LAST_7_DAYS   – Past 7 days
LAST_30_DAYS  – Past 30 days (default)
LAST_1_YEAR   – Past 365 days
CUSTOM        – Uses startDate and endDate
```

---

### `GET /api/v1/analytics/summary`

**Gets the KPI dashboard summary cards.** The primary numbers displayed at the top of any admin dashboard.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  totalSubmissions: number;
  openSubmissions: number;
  resolvedSubmissions: number;
  archivedSubmissions: number;
  incidents: number;
  complaints: number;
  feedbacks: number;
  totalIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  averageRating: number | null; // null if no rating data exists in the period
}
```

---

### `GET /api/v1/analytics/trends`

**Gets daily submission and issue counts over time** for trend line charts.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  submissions: Array<{ date: string; count: number; }>; // e.g. [{ date: "2026-04-01", count: 12 }]
  issues: Array<{ date: string; count: number; }>;
}
```

---

### `GET /api/v1/analytics/distribution`

**Gets breakdown by type, status, and priority** — for pie/doughnut charts.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  byType: Array<{ name: string; count: number; percentage: number; }>;    // FEEDBACK, COMPLAINT, INCIDENT
  byStatus: Array<{ name: string; count: number; percentage: number; }>; // OPEN, IN_PROGRESS, etc.
  byPriority: Array<{ name: string; count: number; percentage: number; }>; // LOW, MEDIUM, HIGH, CRITICAL
}
```

---

### `GET /api/v1/analytics/locations-performance`

**Compares submission and issue metrics across locations.** Used by the national operations director.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN` only

#### Query Parameters
Base analytics params + `limit` (number, default 10).

#### Success Response — `200 OK`

```typescript
{
  data: Array<{
    id: string;
    name: string;
    code: string;          // Airport IATA code
    submissions: number;
    openSubmissions: number;
    resolvedSubmissions: number;
    issues: number;
    averageRating: number | null;
  }>;
  total: number;
}
```

---

### `GET /api/v1/analytics/departments-performance`

**Compares metrics across departments within a location.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Query Parameters
Base analytics params + `limit` (number, default 10).

#### Success Response — `200 OK`

```typescript
{
  data: Array<{
    id: string;
    name: string;
    code: string;
    submissions: number;
    openSubmissions: number;
    resolvedSubmissions: number;
    issues: number;
    averageRating: number | null;
  }>;
  total: number;
}
```

---

### `GET /api/v1/analytics/touchpoints-top`

**Returns the most-interacted-with touchpoints, ranked by interaction count.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters
Base analytics params + `limit` (number, default 10).

#### Success Response — `200 OK`

```typescript
{
  data: Array<{
    id: string;
    title: string;
    location: string;       // Location name
    department: string;     // Department name
    submissions: number;    // Submissions in the date range
    interactions: number;   // Total all-time scans
    averageRating: number | null;
  }>;
}
```

---

### `GET /api/v1/analytics/charts/satisfaction-trend`

**Gets the average rating per day over the selected period.** Feeds the satisfaction trend line chart.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  data: Array<{
    name: string;   // Date string: "2026-04-01"
    score: number;  // Average rating for that day (0 if no ratings)
  }>;
}
```

---

### `GET /api/v1/analytics/charts/peak-activity`

**Gets hourly issue creation counts across 24 hours.** Reveals the busiest hours for incident reporting.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  data: Array<{
    hour: number;   // 0–23 (24-hour clock)
    issues: number; // Number of issues logged at this hour
  }>;  // Always 24 items
}
```

---

### `GET /api/v1/analytics/charts/hotspots`

**Returns locations ranked by issue count** — showing where the most problems cluster.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`, `DEPARTMENT_ADMIN`

#### Query Parameters
Base analytics params + `limit` (number, default 10).

#### Success Response — `200 OK`

```typescript
{
  data: Array<{
    name: string;   // Location name
    value: number;  // Issue count
  }>;
}
```

---

### `GET /api/v1/analytics/charts/dept-performance`

**Gets resolved vs. unresolved issue counts per department.** Feeds the stacked bar chart.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  data: Array<{
    name: string;      // Department name
    resolved: number;
    unresolved: number;
  }>;
}
```

---

### `GET /api/v1/analytics/export/csv`

**Exports raw submission data as CSV** (up to 1000 rows for the selected period).

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Success Response — CSV file download

```
Content-Type: text/csv
Content-Disposition: attachment; filename="analytics-export.csv"
```

CSV Columns: `ID, Location, Type, Status, Submitted At`

---

## 14. Module: Settings — `/api/v1/settings`

> **The story:** The IT administrator at FAAN needs to configure the organization's system preferences — toggle email alerts, set the data retention window, rotate the API key for webhook integrations, and occasionally purge old data to comply with NDPA data regulations. That's what this module handles.

All settings are organization-scoped. The `organizationId` is automatically derived from the authenticated user's context.

---

### `GET /api/v1/settings`

**Gets the organization's current settings.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN`, `LOCATION_ADMIN`

#### Success Response — `200 OK`

```typescript
{
  name: string;
  logo: string | null;
  supportUrl: string | null;
  emailAlerts: boolean;
  smsAlerts: boolean;
  retentionDays: number;
  apiKey: string | null;    // The current API key (masked or full depending on implementation)
  webhookUrl: string | null;
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `403 Forbidden` | `User is not associated with an organization` | User has no resolvable `organizationId` |

---

### `PATCH /api/v1/settings`

**Updates organization settings.**

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN` only

#### Request Body

```typescript
interface UpdateSettingsDto {
  name?: string;
  logo?: string | null;
  supportUrl?: string | null;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  retentionDays?: number;    // Days to keep submission data
  webhookUrl?: string | null;
}
```

#### Success Response — `200 OK`

Returns updated `SettingsResponseDto`.

---

### `POST /api/v1/settings/api-key/rotate`

**Generates a new API key for the organization**, invalidating the previous one. Used for webhook authentication.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN` only

#### Success Response — `200 OK`

```typescript
{
  apiKey: string; // The newly generated API key
}
```

---

### `DELETE /api/v1/settings/data/purge`

**Purges old submissions and reports** beyond the configured `retentionDays`. This is a destructive, irreversible operation protected by password confirmation.

- **Auth Required:** ✅ Bearer Token
- **Roles:** `SUPER_ADMIN` only

#### Request Body

```typescript
interface DataPurgeDto {
  password: string; // The admin's own account password (confirmation)
}
```

#### Success Response — `200 OK`

```typescript
{
  deletedSubmissions: number;
  deletedReports: number;
  message: string; // e.g. "Purged 142 submissions and 23 reports older than 90 days"
}
```

#### Error Cases

| Status | Message | Cause |
|---|---|---|
| `403 Forbidden` | `Invalid password` | Incorrect password confirmation |
| `403 Forbidden` | `User is not associated with an organization` | No org context |

---

## 15. Error Reference

The system uses a global HTTP exception filter that returns all errors in the standard error envelope. Below is a comprehensive reference of all errors you may encounter.

### HTTP Status Codes

| Code | Name | When It Happens |
|---|---|---|
| `400 Bad Request` | Validation Failed / Bad Request | Request body fails DTO validation (missing required fields, wrong types, min-length violations, invalid enum values) |
| `401 Unauthorized` | Unauthorized | Missing, expired, or invalid Bearer token; invalid login credentials; revoked refresh token |
| `403 Forbidden` | Forbidden | User's role does not have permission for the action; cross-location or cross-department access; password confirmation failure |
| `404 Not Found` | Not Found | Referenced UUID (user, department, location, touchpoint, submission, etc.) doesn't exist or has been soft-deleted |
| `409 Conflict` | Conflict | Unique constraint violation (duplicate email, duplicate organization code, duplicate location code within the same scope) |
| `422 Unprocessable Entity` | Unprocessable | Semantic errors — e.g., department doesn't belong to its claimed location |
| `500 Internal Server Error` | Internal Error | Unexpected server-side error |

### Common Error Messages Quick Reference

| Error Message | Module | HTTP |
|---|---|---|
| `Email already registered` | Auth, Users | 409 |
| `Account is inactive` | Auth | 401 |
| `Invalid credentials` | Auth | 401 |
| `Refresh token has been revoked` | Auth | 401 |
| `Current password is incorrect` | Auth | 400 |
| `Department not found` | Multiple | 404 |
| `Location not found` | Multiple | 404 |
| `Organization not found` | Multiple | 404 |
| `User not found` | Multiple | 404 |
| `Touchpoint not found` | Multiple | 404 |
| `Submission not found` | Submissions | 404 |
| `Touchpoint is not active` | Submissions | 403 |
| `Form validation failed` | Submissions | 400 |
| `Department does not belong to this location` | Touchpoints | 403/422 |
| `Location admins cannot assign higher roles` | Users | 403 |
| `Department admins cannot create users` | Users | 403 |
| `Department admins cannot activate/deactivate users` | Users | 403 |
| `Cannot update users outside your location` | Users | 403 |
| `You do not have access to this submission` | Submissions | 403 |
| `User is not associated with an organization` | Settings | 403 |
| `Invalid password` | Settings | 403 |

---

## Appendix A: Data Model Relationships

```
Organization
  └── Location (many)
        └── Department (many)
              └── User (many)
              └── Touchpoint (many)
                    └── Submission (many)
                          └── SubmissionNote (many)
              └── InternalReport (issues) (many)
                    └── InternalReportNote (many)
        └── ReportTemplate (many)
              └── InternalReport (many)
```

---

## Appendix B: Endpoint Summary Table

| Method | Path | Auth | Min Role |
|---|---|---|---|
| POST | `/api/v1/auth/register` | ❌ | — |
| POST | `/api/v1/auth/login` | ❌ | — |
| POST | `/api/v1/auth/refresh` | ❌ | — |
| POST | `/api/v1/auth/logout` | ✅ | USER |
| PATCH | `/api/v1/auth/change-password` | ✅ | USER |
| GET | `/api/v1/auth/profile` | ✅ | USER |
| PATCH | `/api/v1/auth/profile` | ✅ | USER |
| POST | `/api/v1/users` | ✅ | LOCATION_ADMIN |
| GET | `/api/v1/users` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/users/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/users/:id` | ✅ | DEPARTMENT_ADMIN |
| DELETE | `/api/v1/users/:id` | ✅ | LOCATION_ADMIN |
| POST | `/api/v1/organizations` | ✅ | SUPER_ADMIN |
| GET | `/api/v1/organizations` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/organizations/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/organizations/:id` | ✅ | SUPER_ADMIN |
| DELETE | `/api/v1/organizations/:id` | ✅ | SUPER_ADMIN |
| POST | `/api/v1/locations` | ✅ | LOCATION_ADMIN |
| GET | `/api/v1/locations` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/locations/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/locations/:id` | ✅ | LOCATION_ADMIN |
| DELETE | `/api/v1/locations/:id` | ✅ | SUPER_ADMIN |
| POST | `/api/v1/departments` | ✅ | LOCATION_ADMIN |
| GET | `/api/v1/departments` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/departments/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/departments/:id` | ✅ | DEPARTMENT_ADMIN |
| DELETE | `/api/v1/departments/:id` | ✅ | LOCATION_ADMIN |
| POST | `/api/v1/departments/:id/admins` | ✅ | LOCATION_ADMIN |
| POST | `/api/v1/touchpoints` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/touchpoints` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/touchpoints/public/lookup` | ❌ | — |
| GET | `/api/v1/touchpoints/public/:slug` | ❌ | — |
| GET | `/api/v1/touchpoints/:id` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/touchpoints/:id/qr-data` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/touchpoints/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/touchpoints/:id/status` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/touchpoints/:id/link` | ✅ | DEPARTMENT_ADMIN |
| DELETE | `/api/v1/touchpoints/:id` | ✅ | LOCATION_ADMIN |
| POST | `/api/v1/submissions/public` | ❌ | — |
| POST | `/api/v1/submissions` | ✅ | USER |
| GET | `/api/v1/submissions/my-submissions` | ✅ | USER |
| GET | `/api/v1/submissions` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/submissions/export` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/submissions/:id` | ✅ | USER |
| PATCH | `/api/v1/submissions/:id` | ✅ | DEPARTMENT_ADMIN |
| POST | `/api/v1/submissions/:id/notes` | ✅ | DEPARTMENT_ADMIN |
| POST | `/api/v1/reports` | ✅ | DEPARTMENT_ADMIN |
| POST | `/api/v1/reports/submit` | ✅ | USER |
| GET | `/api/v1/reports/my-reports` | ✅ | USER |
| GET | `/api/v1/reports/template-reports` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/reports/template-reports/export` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/reports/template-reports/:id/status` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/reports/kanban` | ✅ | DEPARTMENT_ADMIN |
| POST | `/api/v1/reports/issues` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/reports/issues` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/reports/issues/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/reports/issues/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/reports/issues/:id/status` | ✅ | DEPARTMENT_ADMIN |
| POST | `/api/v1/reports/issues/:id/notes` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/reports` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/reports/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/reports/:id` | ✅ | DEPARTMENT_ADMIN |
| POST | `/api/v1/report-templates` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/report-templates` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/report-templates/:id` | ✅ | DEPARTMENT_ADMIN |
| PATCH | `/api/v1/report-templates/:id` | ✅ | DEPARTMENT_ADMIN |
| DELETE | `/api/v1/report-templates/:id` | ✅ | LOCATION_ADMIN |
| GET | `/api/v1/analytics/summary` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/analytics/trends` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/analytics/distribution` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/analytics/locations-performance` | ✅ | SUPER_ADMIN |
| GET | `/api/v1/analytics/departments-performance` | ✅ | LOCATION_ADMIN |
| GET | `/api/v1/analytics/touchpoints-top` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/analytics/charts/satisfaction-trend` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/analytics/charts/peak-activity` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/analytics/charts/hotspots` | ✅ | DEPARTMENT_ADMIN |
| GET | `/api/v1/analytics/charts/dept-performance` | ✅ | LOCATION_ADMIN |
| GET | `/api/v1/analytics/export/csv` | ✅ | LOCATION_ADMIN |
| GET | `/api/v1/settings` | ✅ | LOCATION_ADMIN |
| PATCH | `/api/v1/settings` | ✅ | SUPER_ADMIN |
| POST | `/api/v1/settings/api-key/rotate` | ✅ | SUPER_ADMIN |
| DELETE | `/api/v1/settings/data/purge` | ✅ | SUPER_ADMIN |

---

*Generated: April 2026 — FAAN VemTap Enterprise System v1.0*
