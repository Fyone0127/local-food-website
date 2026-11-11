# Local Food Finder KCH

Local Food Finder KCH is a restaurant directory for Kuching. Browse by stall name, food type, mood, or rating, then call a restaurant or get directions. Mark visited restaurants to earn Foodie Points in your browser.

The site uses HTML, CSS, and JavaScript. Supabase provides the restaurant database, account sign-in, and photo storage.

## Pages

- `index.html` - Home
- `foods.html` - Restaurant listings
- `login.html` - Login
- `register.html` - Register
- `admin.html` - Manage restaurant listings
- `about.html` - About

## Run Locally

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/index.html
```

## Supabase Database

Run [database.sql](database.sql) in Supabase SQL Editor for a new project. For an existing project, use [supabase-csv-migration.sql](supabase-csv-migration.sql) to add the CSV fields or [supabase-profiles-trigger.sql](supabase-profiles-trigger.sql) to create profiles for Auth users.

The main table is `restaurants`.

Columns:

- `restaurant_name`
- `phone_number`
- `description`
- `location`
- `operation_hour`
- `rating`
- `review`
- `price_range`
- `halal_status`
- `photo_url`
- `google_sheet_row`
- `import_source`
- `import_row`
- `synced_at`

## Frontend Supabase Keys

In `shared.js`, use:

```js
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-publishable-key";
```

Use the publishable key only. Do not put the service role key in frontend files.

## CSV or Google Sheet to Supabase Import

The import script can read either your exported CSV file or the live Google Sheet CSV.

File:

```text
sync-google-sheet.js
```

PowerShell:

```powershell
$env:SUPABASE_URL="https://your-project-id.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:CSV_FILE="C:\path\to\Local Food Finder.csv"
npm run sync
```

The service role key is in Supabase Settings > API Keys > Secret keys.

Keep it private. Do not paste it into `shared.js`.

To import from the live Google Sheet instead, remove `CSV_FILE` first:

```powershell
Remove-Item Env:\CSV_FILE
npm run sync
```

## How The Import Works

The sync deduplicates the input, deletes all current restaurant rows, and inserts the new list. Back up the table before importing. If insertion fails after deletion, restore from the backup or rerun the import after fixing the error. The importer carries over photo URLs for matching restaurant names and phone numbers when the input has no photo URL.

## Photos

1. Run [supabase-storage-photos.sql](supabase-storage-photos.sql) to create the `restaurant-photos` bucket.
2. Create the admin account configured in [auth.js](auth.js) in Supabase Authentication and sign in with its Supabase password.
3. In [admin.html](admin.html), choose a restaurant, click **Edit**, select a picture, and click **Upload selected photo**.
4. Check the restaurant row in Supabase for the saved `photo_url`. CSV imports also accept a `photo_url` column.

Before deploying publicly, restrict restaurant and Storage writes to authorized admins. The relaxed policy script grants write access to anonymous visitors.
