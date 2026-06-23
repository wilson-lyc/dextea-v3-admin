# Employee Management Module Spec

## Why
Provide a complete employee management interface for admin users to manage system staff accounts, replacing the placeholder sidebar entry.

## What Changes

### Shared Types (`packages/shared-types`)
- Add `UserStatus` type: `0` (disabled) | `1` (active)
- Add `User` interface matching the database `usersTable` schema
- Add `CreateUserInput` and `UpdateUserInput` interfaces

### Backend API (`apps/api`)
- **New route**: `users.ts` under `routes/` with CRUD endpoints
- Endpoints:
  - `GET /api/v1/users` — Paginated user list with search/filter support
  - `POST /api/v1/users` — Create user (auto-generate password, return initial password only once)
  - `PUT /api/v1/users/:id` — Update user (with email uniqueness check excluding self)
  - `PATCH /api/v1/users/:id/status` — Toggle user status (0/1)
- Auto-generate random password on user creation using `nanoid`
- Hash password with `argon2` before storing

### Frontend (`apps/web`)
- **New page**: `src/pages/Employees/index.tsx` — Employee management page
- Add route to `App.tsx` under `AppLayout`
- Re-pull shadcn components: `dialog`, `table`, `select`, `switch` via `npx shadcn add`
- Components:
  - Employee list table with columns: ID, Email, DisplayName, Status, Actions
  - Create/Edit user dialog (modal)
  - Initial password display dialog (shown once after creation)
- Add `apiPut` and `apiPatch` helper functions to `src/lib/api.ts`
- Update sidebar navigation to link to employee page

## Impact
- Affected specs: Shared types contract
- Affected code:
  - `packages/shared-types/src/index.ts` — Add User types
  - `apps/api/src/routes/index.ts` — Register users route
  - `apps/api/src/routes/users.ts` — New file
  - `apps/web/src/App.tsx` — Add route
  - `apps/web/src/lib/api.ts` — Add new helpers
  - `apps/web/src/components/layout/Sidebar.tsx` — Add navigation link
  - `apps/web/src/pages/Employees/index.tsx` — New page

## ADDED Requirements

### Requirement: Shared Types
The shared-types package SHALL define `UserStatus` as `0 | 1` and `User` interface.

### Requirement: User CRUD API
The system SHALL provide CRUD endpoints for user management.

#### Scenario: List users
- **WHEN** admin sends `GET /api/v1/users?page=1&pageSize=20`
- **THEN** return paginated user list (without password field)

#### Scenario: Create user
- **WHEN** admin sends `POST /api/v1/users` with `{ email, displayName }`
- **THEN** system generates a random password, hashes it, creates user with `status: 0`, returns `{ user, initialPassword }`

#### Scenario: Update user
- **WHEN** admin sends `PUT /api/v1/users/:id` with `{ email, displayName, status }`
- **THEN** system updates user, checking email uniqueness excluding the current user's ID

#### Scenario: Toggle status
- **WHEN** admin sends `PATCH /api/v1/users/:id/status`
- **THEN** system toggles user status between 0 and 1

### Requirement: Employee List Page
The admin web SHALL display a table of employees with actions.

#### Scenario: View employee list
- **WHEN** admin navigates to `/employees`
- **THEN** a table shows ID, Email, DisplayName, Status, and Action columns

#### Scenario: Create employee
- **WHEN** admin clicks "创建用户" button
- **THEN** a dialog opens in create mode (ID and Status hidden), admin fills email and displayName
- **AFTER** successful creation, a second dialog shows the initial password with warning "此密码仅显示一次，关闭后将不再显示"

#### Scenario: Edit employee
- **WHEN** admin clicks edit button on a user row
- **THEN** dialog opens in edit mode with ID field (read-only), email, displayName, and status editable

#### Scenario: Toggle employee status
- **WHEN** admin clicks disable/activate button
- **THEN** user status toggles immediately

## REMOVED Requirements
None.
