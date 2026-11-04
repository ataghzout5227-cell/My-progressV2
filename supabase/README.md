# Ascend private database

The app currently saves data **only on the Android device** under `ascend-v1`.
The database schema is provided as the secure foundation for a future opt-in private Supabase cloud sync.

## What to provision
1. Create a Supabase project owned by you.
2. Run `supabase/schema.sql` in its SQL Editor and verify RLS policies are enabled.
3. Create a private user through Supabase Authentication.
4. Supply the **project URL and publishable/anon key**, not a service-role or secret key.
5. Add optional login, sync conflict resolution, secure token storage, and data migration before enabling cloud sync in Ascend.

**Privacy:** RLS prevents one signed-in account from querying another account's records. It does not guarantee a database administrator/provider cannot access data. Journal content requires client-side encryption before cloud syncing. No user data is uploaded from the current app.

Never delete existing local data during an app upgrade. Back up before installing or migrating.
