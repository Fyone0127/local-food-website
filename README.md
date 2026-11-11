# Local Food Finder KCH

Local Food Finder KCH is a public restaurant directory for Kuching.

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

Run `database.sql` in Supabase SQL Editor.

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
$env:CSV_FILE="C:\Users\Fyone\Downloads\Local Food Finder.csv"
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

Each CSV row becomes one row in Supabase.

When you run:

```powershell
npm run sync
```

the old imported rows are refreshed with the latest CSV or Google Sheet data. Existing matching `photo_url` values are kept, so restaurant photos do not disappear when the text data is refreshed.

## Photos

Real shop photos can be added with a `photo_url` column in the CSV, or kept in Supabase after the first import.