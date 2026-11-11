const SUPABASE_URL = "https://yfzwqlvmrabtduffyolc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_i4OYd7xF11irhJTl_T33eQ_j5LqgvDk";
const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1AanrQC4evCEhnk8VO1ynCLu4VCe51TUaEUcj46eoq7o/export?format=csv";

const fallbackRestaurants = [
  {
    id: 1,
    name: "Madras Cafe",
    phone: "014-8899971",
    description: "South Indian cuisine (crispy dosas, idlis, sambar, filter coffee)",
    location: "51, India Street Pedestrian Mall",
    hours: "Mon-Sun 6am-9pm",
    rating: "5 Star",
    review: "Affordable",
    priceRange: "RM8-18",
    halalStatus: "halal",
    photoUrl:
      "https://images.unsplash.com/photo-1630409346824-4f0e7b080087?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Jubilee Restaurant",
    phone: "082-245626",
    description: "Indian Muslim eatery (authentic Biryani, Roti Canai, Signature Rojak)",
    location: "49, India Street Pedestrian Mall",
    hours: "Mon-Sat 5am-6pm",
    rating: "4.1 star",
    review: "Affordable",
    priceRange: "RM10-25",
    halalStatus: "halal",
    photoUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "We Drink",
    phone: "011-69669886",
    description: "Dessert (ice cream, fruit tea, coffee)",
    location: "India Street Pedestrian Mall",
    hours: "Mon-Sun 10.30am-11pm",
    rating: "2.3 star",
    review: "Low cost",
    priceRange: "RM4-12",
    halalStatus: "halal",
    photoUrl:
      "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Lava",
    phone: "016-8657179",
    description: "Fast food (pizza, fries, chicken wings, local cafe-style meals)",
    location: "Lot 90 Section 24 ktld,65, India Street Pedestrian Mall",
    hours: "Daily 8.30am-8pm",
    rating: "5 star",
    review: "Moderate",
    priceRange: "RM12-25",
    halalStatus: "halal",
    photoUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    name: "8 Minit Kopi",
    phone: "011-57568596",
    description: "Cafe (local kopi, toast, croissants, oden tom yum, roti kahwin)",
    location: "41, jalan gambier",
    hours: "Daily 8am-8pm",
    rating: "5 star",
    review: "Affordable",
    priceRange: "RM5-18",
    halalStatus: "halal",
    photoUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    name: "Nam joo",
    phone: "014-6994493",
    description: "Hipster cafe (balado rice, korean chicken wings, spicy ramen)",
    location: "21, jalan gambier",
    hours: "Mon-Sun 12pm-10pm (Tue closed)",
    rating: "4.7 star",
    review: "Moderate",
    priceRange: "RM10-28",
    halalStatus: "halal",
    photoUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  },
];

const supabaseEnabled =
  window.supabase &&
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_ANON_KEY.includes("PASTE_");

const db = supabaseEnabled ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function currentUser() {
  return JSON.parse(localStorage.getItem("lff_user") || "null");
}

function setCurrentUser(user) {
  if (user) localStorage.setItem("lff_user", JSON.stringify(user));
  else localStorage.removeItem("lff_user");
}

function isAdmin() {
  return currentUser()?.role === "admin";
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
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
}

function sheetRowToRestaurant(row, index) {
  return {
    id: index + 1,
    name: row[0]?.trim() || "Unnamed Restaurant",
    phone: row[1]?.trim() || "-",
    description: row[2]?.trim() || "No description provided",
    location: row[3]?.trim() || "Location not provided",
    hours: row[4]?.trim() || "Operation hour not provided",
    rating: row[5]?.trim() || "-",
    review: row[6]?.trim() || "",
    priceRange: row[7]?.trim() || "",
    halalStatus: row[8]?.trim() || "",
    photoUrl: "",
  };
}

function ratingValue(review) {
  const match = String(review || "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function mapEmbedUrl(restaurant) {
  return `https://www.google.com/maps?q=${encodeURIComponent(
    `${restaurant.name} ${restaurant.location} Kuching Sarawak`
  )}&output=embed`;
}

function toDbRow(restaurant) {
  return {
    restaurant_name: restaurant.name,
    phone_number: restaurant.phone,
    description: restaurant.description,
    location: restaurant.location,
    operation_hour: restaurant.hours,
    rating: restaurant.rating || restaurant.review,
    review: restaurant.review || "",
    price_range: restaurant.priceRange || "",
    halal_status: restaurant.halalStatus || "",
    photo_url: restaurant.photoUrl || "",
  };
}

function fromDbRow(row) {
  return {
    id: row.id,
    name: row.restaurant_name,
    phone: row.phone_number || "-",
    description: row.description || "No description provided",
    location: row.location || "Location not provided",
    hours: row.operation_hour || "Operation hour not provided",
    rating: row.rating || row.review || "-",
    review: row.review || "",
    priceRange: row.price_range || "",
    halalStatus: row.halal_status || "",
    photoUrl: row.photo_url || "",
  };
}

function restaurantPhoto(restaurant) {
  if (restaurant.photoUrl) return restaurant.photoUrl;
  const text = `${restaurant.name} ${restaurant.description}`.toLowerCase();
  if (text.includes("coffee") || text.includes("kopi") || text.includes("cafe")) {
    return "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80";
  }
  if (text.includes("dessert") || text.includes("cake") || text.includes("bakery")) {
    return "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80";
  }
  if (text.includes("western") || text.includes("burger") || text.includes("pizza")) {
    return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80";
  }
  if (text.includes("laksa") || text.includes("noodle") || text.includes("mee")) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80";
  }
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80";
}

function mapsUrl(restaurant) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.name} ${restaurant.location} Kuching Sarawak`
  )}`;
}

function phoneHref(phone) {
  const clean = String(phone || "").replace(/[^\d+]/g, "");
  return clean ? `tel:${clean}` : "";
}

function getSavedRestaurants() {
  return JSON.parse(localStorage.getItem("lff_restaurants") || "null");
}

function saveRestaurants(restaurants) {
  localStorage.setItem("lff_restaurants", JSON.stringify(restaurants));
}

async function loadRestaurants() {
  if (db) {
    const { data, error } = await db.from("restaurants").select("*").order("id", { ascending: true });
    if (!error && data?.length >= 20) return { restaurants: data.map(fromDbRow), source: "Restaurant database" };
  }

  const saved = getSavedRestaurants();
  if (saved?.length > fallbackRestaurants.length) return { restaurants: saved, source: "Restaurant database" };

  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    const csv = await response.text();
    const rows = parseCsv(csv).slice(1);
    const restaurants = rows
      .map(sheetRowToRestaurant)
      .filter((item) => item.name !== "Unnamed Restaurant");
    saveRestaurants(restaurants);
    return { restaurants, source: "Restaurant database" };
  } catch {
    saveRestaurants(fallbackRestaurants);
    return { restaurants: fallbackRestaurants, source: "Restaurant database" };
  }
}
