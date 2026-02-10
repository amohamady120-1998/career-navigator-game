

# Set Up Test Account for All Roles

Create a single test account (`uniex@admin.com` / `123456`) with access to all dashboards: Admin, Institution, Parent, and Student.

## What Will Be Done

1. **Create the Auth User** -- Sign up `uniex@admin.com` with password `123456` via the authentication system.

2. **Create a Profile** -- Insert a profile row with `user_type = 'student'` (the default landing). The admin role check happens separately via the `user_roles` table.

3. **Grant Admin Role** -- Insert a row in `user_roles` with `role = 'admin'` so the account can access `/admin`.

4. **Add a Role Switcher** -- Update `Auth.tsx` redirect logic so this account can navigate to any dashboard. Add a simple role-switcher UI or direct links on the admin dashboard to `/parent`, `/institution`, and `/dashboard`.

5. **Bypass Layout Guards for Admin** -- Update `ParentLayout.tsx` and `InstitutionLayout.tsx` to also allow users with the `admin` role to access those dashboards (currently they check `user_type` strictly).

## Technical Details

### Database Operations (no migrations needed, data only)
- After signing up via the app or edge function, insert into `user_roles`:
  ```sql
  INSERT INTO user_roles (user_id, role) VALUES ('<user_id>', 'admin');
  ```

### Code Changes

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | After login, check `user_roles` for admin -- if admin, redirect to `/admin` instead of role-based redirect |
| `src/layouts/ParentLayout.tsx` | Allow admin users to bypass the `user_type = 'parent'` check |
| `src/layouts/InstitutionLayout.tsx` | Allow admin users to bypass the `user_type = 'institution'` check |
| `src/pages/admin/SuperAdminDashboard.tsx` | Add quick-nav links to `/parent`, `/institution`, `/dashboard` for testing all views |

### Auth Redirect Logic Update
```text
Login -> Check user_roles for 'admin'
  -> If admin: redirect to /admin
  -> Else: redirect by profile.user_type (existing logic)
```

### Layout Guard Update
```text
ParentLayout / InstitutionLayout:
  -> If user_type matches: allow
  -> Else if has_role('admin'): allow (for testing)
  -> Else: redirect away
```

