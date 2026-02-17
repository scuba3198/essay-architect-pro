# Supabase Manual Payment Approval Cheatsheet

If you are manually adding or updating a user's subscription in the `public.payments` table within Supabase, follow these rules to ensure the webapp recognizes the status correctly.

## 1. Required Status

The webapp specifically filters for the following status:

- **`approved`** (Recommended)

> [!IMPORTANT]
> Do **NOT** use `active`, `paid`, or `success`. The code logic currently looks for `approved` (case-insensitive).

## 2. Valid Plan Names

Ensure the `plan_name` matches exactly (case-sensitive) one of the following:

| Plan Name            | Access Level | Duration                |
| :------------------- | :----------- | :---------------------- |
| `Preparation Pack`   | Pro          | 30 Days                 |
| `Crammer's Pass`     | Pro          | 24 Hours                |
| `Lifetime Pack`      | PRO          | Unlimited               |
| `Consultancy Killer` | PRO          | Unlimited (Legacy name) |

## 3. How to Update in Supabase

1. Go to your **Supabase Dashboard**.
2. Navigate to **Table Editor** > `public.payments`.
3. Find the row for the user's email.
4. Set the `status` column to `approved`.
5. Ensure the `plan_name` is exactly `Lifetime Pack` (or another valid name from the table above).
6. Refresh the webapp and log in.

## 4. Troubleshooting

If the user is still seeing the "Upgrade" button:

- Double-check the **spelling** of `approved`.
- Ensure there are no **trailing spaces** in the email or status fields.
- Check the `created_at` timestamp; the app picks the _latest_ approved record.
