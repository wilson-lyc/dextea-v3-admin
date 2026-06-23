# Checklist

- [x] `packages/shared-types/src/index.ts` contains `UserStatus`, `User`, `CreateUserInput`, `UpdateUserInput` types
- [x] shadcn components `dialog`, `table`, `select`, `switch` are properly installed
- [x] Backend `GET /api/v1/users` returns paginated user list without password field
- [x] Backend `POST /api/v1/users` creates user with auto-generated password, returns initial password
- [x] Backend `PUT /api/v1/users/:id` updates user with email uniqueness check (excluding self)
- [x] Backend `PATCH /api/v1/users/:id/status` toggles user status
- [x] Frontend `apiPut` and `apiPatch` helpers work correctly
- [x] Employee list page renders with table columns: ID, Email, DisplayName, Status, Actions
- [x] Create mode dialog hides ID and Status fields, requires email and displayName
- [x] After creation, initial password dialog shows with warning message
- [x] Edit mode dialog shows ID (read-only), allows editing email, displayName, status
- [x] Toggle disable/activate button works correctly
- [x] Sidebar "员工管理" navigates to the employee page
