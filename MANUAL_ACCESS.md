# How to Manually Grant Access

If a user sends a payment receipt manually (e.g. via WhatsApp) and you need to give them access, follow these steps in your Supabase Dashboard.

## 1. Open Supabase Table Editor
Go to your Supabase project -> **Table Editor** -> **`payments`** table.

## 2. Insert a New Row
Click **"Insert details"** (or "Add row") and fill in the following fields:

| Column | Value | Notes |
| :--- | :--- | :--- |
| **`user_email`** | The user's email address | Must match exactly what they use to log in. |
| **`plan_name`** | (Choose one below) | **Exact spelling is critical.** |
| **`status`** | `approved` | **CRITICAL**: Must be lowercase `approved`. |
| **`screenshot_url`**| `manual_verified` | Can be anything (e.g. `whatsapp`, `manual`). **Cannot be empty.**|
| **`amount`** | (e.g. `Rs 499`) | Optional, for your records. |
| **`created_at`** | (Leave as default) | Current time. Access starts from now. |

### Valid Plan Names (Copy Exact Text)
- `Crammer's Pass` (24 Hours access)
- `Preparation Pack` (30 Days access)
- `Consultancy Killer` (Lifetime access)

## 3. Save
Click **Save**.

## 4. Notify User
Tell the user to:
1.  Go to the website.
2.  Click **"Upgrade"**.
3.  Scroll down to **"Already Paid? Retrieve Your Access"**.
4.  Enter their email and click **Check**.

They will instantly get access!
