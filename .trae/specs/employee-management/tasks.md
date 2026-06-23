# Tasks

- [x] Task 1: Update shared-types with User-related types
  - Add `UserStatus` type (`0 | 1`)
  - Add `User` interface (id, email, displayName, status, createdAt, updatedAt)
  - Add `CreateUserInput`, `UpdateUserInput` interfaces

- [x] Task 2: Add shadcn components
  - Run `npx shadcn add dialog table select switch` to add required UI components

- [x] Task 3: Create backend users API route
  - Create `apps/api/src/routes/users.ts` with CRUD endpoints
  - Register route in `apps/api/src/routes/index.ts`
  - Endpoints: GET (list), POST (create), PUT (update), PATCH (status toggle)

- [x] Task 4: Update frontend API client
  - Add `apiPut` and `apiPatch` helper functions to `apps/web/src/lib/api.ts`

- [x] Task 5: Create Employee Management page
  - Create `apps/web/src/pages/Employees/index.tsx` with table, dialog, and full logic
  - Add route in `apps/web/src/App.tsx`
  - Update sidebar navigation

# Task Dependencies
- [Task 1] must be completed before [Task 3] and [Task 5]
- [Task 2] must be completed before [Task 5]
- [Task 3] and [Task 4] are independent of each other
- [Task 4] must be completed before [Task 5]
