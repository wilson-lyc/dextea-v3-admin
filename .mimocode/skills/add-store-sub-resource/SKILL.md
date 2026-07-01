---
name: add-store-sub-resource
description: "Add a new editable sub-resource to the store module in dextea-admin. Covers the full-stack pattern: shared-types, backend error codes + Fastify route, frontend service + shadcn dialog. Use when the user asks to add a new field or editable section to store management (e.g. new PATCH endpoint, new edit dialog, new store attribute). Keywords: store, sub-resource, PATCH, dialog, edit, new field, 门店, 新增字段, 编辑弹窗."
---

# Add Store Sub-Resource

Full-stack pattern for adding a new editable attribute/section to the store module in dextea-admin.

## When to Use

- Adding a new PATCH endpoint for stores (e.g. `/stores/:id/<resource>`)
- Creating a new edit dialog for a store attribute
- Extending the store model with new fields that need CRUD in the admin UI
- Any request that follows the pattern: "add a new section to store management"

## Prerequisites

Read these files to understand the current state before starting:

1. `apps/api/src/db/schema.ts` — storesTable definition (know existing columns)
2. `packages/shared-types/src/types/store.ts` — Store interface and input types
3. `packages/shared-types/src/status/store.ts` — StoreStatus (if status-related)
4. `apps/api/src/errorcode/stores.ts` — existing error codes (1300-1399 range)
5. `apps/api/src/routes/stores.ts` — existing route handlers
6. `apps/web/src/services/store.ts` — frontend API service layer
7. `apps/web/src/pages/Stores/` — existing page components

## Step-by-Step Procedure

### Step 1: Database Schema

Add columns to `storesTable` in `apps/api/src/db/schema.ts`.

**Rule:** Status fields stay as plain `tinyint()` — no `$type<>()` binding to shared-types. Data validation is the code layer's responsibility.

```ts
// Example: adding account/password
account: varchar('account', { length: 50 }),
password: varchar('password', { length: 255 }),
```

Run schema push: `pnpm --filter dextea-admin-api db:push`

### Step 2: Shared Types

Edit `packages/shared-types/src/types/store.ts`:

1. Add fields to the `Store` interface
2. Create request/response types if needed:

```ts
export interface UpdateStoreXxxRequest {
  // fields...
}
export interface UpdateStoreXxxResponse {
  id: number;
}
```

Update barrel exports:
- `packages/shared-types/src/types/index.ts` — add new type exports
- `packages/shared-types/src/index.ts` — add re-exports

### Step 3: Backend Error Code

Add to `apps/api/src/errorcode/stores.ts`:

```ts
export const XXX_UPDATE_FAILED = new BizError({
  code: 1310, // next in sequence (check existing max first)
  message: '更新失败',
  httpStatus: 500,
});
```

Error code ranges: 1300-1399 for stores. Check `errorcode/index.ts` for the full registry.

### Step 4: Backend Route

Add PATCH handler in `apps/api/src/routes/stores.ts`:

```ts
fastify.patch<{ Params: { id: string }; Body: UpdateStoreXxxRequest }>(
  '/:id/xxx',
  { schema: { params: storeIdParamsSchema, body: updateStoreXxxSchema } },
  async (request, reply) => {
    const { id } = request.params;
    const body = request.body;
    // Update MySQL
    // Update Redis if needed (e.g. geoadd for location)
    // Return { code: 0, message: '...', data: { id } }
  }
);
```

### Step 5: Frontend Service

Add to `apps/web/src/services/store.ts`:

```ts
export async function updateStoreXxx(id: number, data: UpdateStoreXxxRequest) {
  return http.patch<UpdateStoreXxxResponse>(`/stores/${id}/xxx`, data);
}
```

Add re-export in `apps/web/src/services/index.ts`.

### Step 6: Frontend Dialog Component

Create `apps/web/src/pages/Stores/components/EditXxxDialog.tsx`.

Follow the established pattern (reference `EditBasicInfoDialog.tsx`):

```tsx
interface EditXxxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store;
  onUpdated: () => void;
}

export function EditXxxDialog({ open, onOpenChange, store, onUpdated }: EditXxxDialogProps) {
  // useState for form fields, initialized from store prop
  // useEffect to reset state when `open` changes
  // handleSubmit calls service, shows toast, calls onUpdated
  // Dialog > DialogContent > DialogHeader + form fields + DialogFooter
}
```

**shadcn rules:**
- Install new components with `npx shadcn@latest add <component>` — never hand-write
- Use `@base-ui/react` primitives (not radix) — this project uses shadcn base-nova style
- base-ui `SelectValue` needs children for display text: `<SelectValue>{label}</SelectValue>`
- Form labels: use `<span className="text-destructive">*</span>` for required fields

### Step 7: Wire to Page

Import and place the dialog in the parent page:

- For store detail sub-resources: `apps/web/src/pages/Stores/detail.tsx`
- For list-level actions: `apps/web/src/pages/Stores/index.tsx`

Pass `open`, `onOpenChange`, `store`, `onUpdated` props. The `onUpdated` callback should re-fetch store data.

### Step 8: Typecheck & Verify

```bash
pnpm typecheck  # from project root
```

If type errors appear, they're usually:
- Missing barrel exports (add to `types/index.ts` and `index.ts`)
- Import path needs `.js` extension (ESM convention in api)
- Status type mismatch — cast or widen as needed

## File Reference Map

| Layer | File | Purpose |
|-------|------|---------|
| DB schema | `apps/api/src/db/schema.ts` | Column definitions |
| Error codes | `apps/api/src/errorcode/stores.ts` | BizError objects (1300-1399) |
| Error registry | `apps/api/src/errorcode/index.ts` | Registers all error codes |
| Routes | `apps/api/src/routes/stores.ts` | Fastify PATCH handlers |
| Shared types | `packages/shared-types/src/types/store.ts` | Store interface + input types |
| Type barrel | `packages/shared-types/src/types/index.ts` | Type exports |
| Type re-export | `packages/shared-types/src/index.ts` | Top-level re-exports |
| Frontend service | `apps/web/src/services/store.ts` | API call functions |
| Service barrel | `apps/web/src/services/index.ts` | Service exports |
| Dialogs | `apps/web/src/pages/Stores/components/` | EditXxxDialog.tsx |
| Detail page | `apps/web/src/pages/Stores/detail.tsx` | Wires dialogs |
| List page | `apps/web/src/pages/Stores/index.tsx` | Store list + create |

## Conventions

- **API prefix:** `/api/v1/stores/:id/<resource>`
- **HTTP method:** PATCH for partial updates (not PUT)
- **Response shape:** `{ code: 0, message: '...', data: { id } }`
- **Error handling:** try/catch in service, `toast.error()` in dialog
- **Form reset:** `useEffect(() => { if (open) { /* reset all fields from store prop */ } }, [open])`
- **Password pattern:** create → API returns `initialPassword` → show Dialog with password + "此密码仅显示一次" → close. Same for reset.
- **Chinese UI labels:** all user-facing text in semantic Chinese
- **Git commits:** write in Simplified Chinese
