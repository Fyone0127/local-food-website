const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fs = require("node:fs/promises");
const path = require("node:path");

const GOOGLE_SHEET_CSV_URL =
  process.env.GOOGLE_SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/1AanrQC4evCEhnk8VO1ynCLu4VCe51TUaEUcj46eoq7o/export?format=csv";

const CSV_FILE = process.env.CSV_FILE || process.argv[2] || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("PowerShell example:");
  console.error("$env:SUPABASE_URL='https://your-project.supabase.co'");
  console.error("$env:SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'");
  process.exit(1);
}

function normalizeSupabaseUrl(url) {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\(rm\)/g, "rm")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);

      if (row.some((cell) => cell.trim())) {
        rows.push(row);
      }

      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);

    if (row.some((cell) => cell.trim())) {
      rows.push(row);
    }
  }

  return rows;
}

function cell(record, ...names) {
  for (const name of names) {
    const value = record[normalizeHeader(name)];
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }

  return "";
}

function restaurantKey(restaurant) {
  return [
    String(restaurant.restaurant_name || "").trim().toLowerCase(),
    String(restaurant.phone_number || "").replace(/\D/g, ""),
    String(restaurant.location || "").trim().toLowerCase(),
  ].join("|");
}

function toRestaurant(record, index, existingPhotoByKey, sourceLabel) {
  const restaurantName = cell(record, "restaurant_name", "Restaurant Name");
  const phoneNumber = cell(record, "phone_number", "Number", "Phone Number");
  const key = `${restaurantName.toLowerCase()}|${phoneNumber.replace(/\D/g, "")}`;

  return {
    google_sheet_row: CSV_FILE ? null : index + 2,
    import_source: sourceLabel,
    import_row: index + 2,
    restaurant_name: restaurantName || null,
    phone_number: phoneNumber || null,
    description: cell(record, "description"),
    location: cell(record, "location"),
    operation_hour: cell(record, "operation_hour", "Operation Hour"),
    rating: cell(record, "rating", "Rating"),
    review: cell(record, "review", "Review"),
    price_range: cell(record, "price_range_rm", "Price range (RM)", "Price range"),
    halal_status: cell(record, "halal_non_halal", "Halal/non halal", "Halal"),
    photo_url: cell(record, "photo_url", "Photo URL") || existingPhotoByKey.get(key) || null,
    synced_at: new Date().toISOString(),
  };
}

async function main() {
  const supabaseBaseUrl = normalizeSupabaseUrl(SUPABASE_URL);

  let csv;
  let sourceLabel;

  if (CSV_FILE) {
    csv = await fs.readFile(CSV_FILE, "utf8");
    sourceLabel = path.basename(CSV_FILE);
  } else {
    const sheetResponse = await fetch(GOOGLE_SHEET_CSV_URL);

    if (!sheetResponse.ok) {
      throw new Error(`Could not read Google Sheet CSV: ${sheetResponse.status}`);
    }

    csv = await sheetResponse.text();
    sourceLabel = "Google Sheet";
  }

  const [headerRow, ...rows] = parseCsv(csv);
  const headers = headerRow.map(normalizeHeader);
  const records = rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))
  );

  const requestHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  const existingResponse = await fetch(
    `${supabaseBaseUrl}/rest/v1/restaurants?select=restaurant_name,phone_number,photo_url`,
    { headers: requestHeaders }
  );

  if (!existingResponse.ok) {
    const body = await existingResponse.text();
    throw new Error(`Could not read existing restaurants: ${existingResponse.status} ${body}`);
  }

  const existingRows = await existingResponse.json();
  const existingPhotoByKey = new Map(
    existingRows
      .filter((row) => row.photo_url)
      .map((row) => [
        `${String(row.restaurant_name || "").toLowerCase()}|${String(
          row.phone_number || ""
        ).replace(/\D/g, "")}`,
        row.photo_url,
      ])
  );

  const restaurants = records
    .map((record, index) => toRestaurant(record, index, existingPhotoByKey, sourceLabel))
    .filter((restaurant) => restaurant.restaurant_name);

  const uniqueRestaurants = [];
  const seenKeys = new Set();

  for (const restaurant of restaurants) {
    const key = restaurantKey(restaurant);

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueRestaurants.push(restaurant);
    }
  }

  const deleteResponse = await fetch(
    `${supabaseBaseUrl}/rest/v1/restaurants?id=not.is.null`,
    {
      method: "DELETE",
      headers: requestHeaders,
    }
  );

  if (!deleteResponse.ok) {
    const body = await deleteResponse.text();
    throw new Error(`Could not clear old imported restaurants: ${deleteResponse.status} ${body}`);
  }

  const insertResponse = await fetch(
    `${supabaseBaseUrl}/rest/v1/restaurants`,
    {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(uniqueRestaurants),
    }
  );

  if (!insertResponse.ok) {
    const body = await insertResponse.text();
    throw new Error(`Supabase import failed: ${insertResponse.status} ${body}`);
  }

  const skipped = restaurants.length - uniqueRestaurants.length;
  const skippedText = skipped ? ` Skipped ${skipped} duplicate CSV row(s).` : "";

  console.log(
    `Imported ${uniqueRestaurants.length} restaurants from ${sourceLabel} to Supabase.${skippedText}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
