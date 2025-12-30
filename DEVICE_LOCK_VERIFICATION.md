# Verification: Device Locking Mechanism

## Changes Implemented
- Modified `App.jsx` to include device fingerprinting during the access verification process.
- Logic added to `verifyAccess`:
    - **Bind on First Use**: If a payment record has no `device_id`, the current device's fingerprint is saved to it.
    - **Enforce Lock**: If a payment record has a `device_id`, it compares it against the current device. Mismatches deny access.

## How to Verify (Manual Test Required)

Since this feature relies on the Supabase backend and persistent storage, you will need to perform a manual test.

### Prerequisites
1.  Ensure you have added the `device_id` (text) column to your `payments` table in Supabase.
2.   Ensure your RLS policies allow the `anon` role to `UPDATE` the `payments` table (specifically the `device_id` column).

### Test Steps

#### 1. Simulate a New User (Binding)
1.  Go to your Supabase Dashboard -> Table Editor -> `payments`.
2.  Find a valid, approved payment record.
3.  Ensure `device_id` is `NULL`.
4.  Open your local app (`npm run dev`).
5.  Click **"The Wizard"** or **"Upgrade"** -> **"Already Paid? Verify Here"**.
6.  Enter the email associated with the record above.
7.  **Expect**: Success message ("Access Unlocked...").
8.  **Check Supabase**: Refresh the table. The `device_id` column should now equal a long hash string (e.g., `a1b2c3...`).

#### 2. Simulate an Intruder (Sharing Prevention)
1.  Open a **Incognito/Private** window (this usually generates a different canvas fingerprint or at least simulates a fresh session) OR use a different browser (Chrome vs Firefox).
2.  Go to the app URL.
3.  Try to verify with the **same email**.
4.  **Expect**: An alert popup saying: **"Security Alert: This account is locked to another device. Access denied."**

#### 3. Reset (Customer Support Scenario)
1.  If a user buys a new laptop, they will be locked out.
2.  **Fix**: Manually clear the `device_id` (set to `NULL`) in Supabase.
3.  Ask them to log in again. It will bind to the new machine.
