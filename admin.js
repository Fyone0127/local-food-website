setupHeader("admin");

let restaurants = [];
let source = "Restaurant database";
let adminSearch = "";
let adminSessionReady = false;
const PHOTO_BUCKET = "restaurant-photos";

const adminRows = document.querySelector("#adminRows");
const adminGuard = document.querySelector("#adminGuard");
const adminGuardLabel = document.querySelector("#adminGuardLabel");
const adminGuardTitle = document.querySelector("#adminGuardTitle");
const adminGuardText = document.querySelector("#adminGuardText");
const adminWorkspace = document.querySelector("#adminWorkspace");
const adminStatus = document.querySelector("#adminStatus");

const restaurantForm = document.querySelector("#restaurantForm");
const resetFormBtn = document.querySelector("#resetFormBtn");
const saveRestaurantBtn = document.querySelector("#saveRestaurantBtn");
const uploadFormPhotoBtn = document.querySelector("#uploadFormPhotoBtn");
const refreshButton = document.querySelector("#seedBtn");
const refreshText = refreshButton?.querySelector(".refresh-text");
const adminFormMessage = document.querySelector("#adminFormMessage");

const adminSearchInput = document.querySelector("#adminSearchInput");
const clearAdminSearchBtn = document.querySelector("#clearAdminSearchBtn");
const adminCountText = document.querySelector("#adminCountText");
const restaurantPhotoInput = document.querySelector("#restaurantPhoto");
const restaurantPhotoFile = document.querySelector("#restaurantPhotoFile");
const restaurantPhotoPreview = document.querySelector("#restaurantPhotoPreview");
const photoUploadPreview = document.querySelector("#photoUploadPreview");
const photoFileName = document.querySelector("#photoFileName");
const photoUploadText = document.querySelector("#photoUploadText");

function setAdminFormMessage(text, type = "info") {
  if (!adminFormMessage) return;

  adminFormMessage.textContent = text;
  adminFormMessage.dataset.type = type;
}

function setSaveLoading(isLoading) {
  if (!saveRestaurantBtn) return;

  saveRestaurantBtn.disabled = isLoading;
  saveRestaurantBtn.textContent = isLoading ? "Saving..." : "Save restaurant";
}

function setPhotoPreview(url, fileName = "") {
  if (!restaurantPhotoPreview || !photoUploadPreview) return;

  if (url) {
    restaurantPhotoPreview.src = url;
  } else {
    restaurantPhotoPreview.removeAttribute("src");
  }

  photoUploadPreview.classList.toggle("has-photo", Boolean(url));
  photoUploadPreview.classList.toggle("empty", !url);

  if (photoFileName) {
    photoFileName.textContent = fileName || "JPG, PNG, or WEBP";
  }

  if (photoUploadText) {
    photoUploadText.textContent = url ? "Photo selected. Save restaurant to upload it." : "No photo selected";
  }
}

function setUploadButtonState() {
  if (!uploadFormPhotoBtn) return;

  const hasRestaurant = Boolean(document.querySelector("#restaurantId")?.value);
  const hasFile = Boolean(restaurantPhotoFile?.files?.[0]);

  uploadFormPhotoBtn.disabled = !hasRestaurant || !hasFile;
}

function setRefreshLoading(isLoading) {
  if (!refreshButton) return;

  refreshButton.disabled = isLoading;
  refreshButton.classList.toggle("is-refreshing", isLoading);

  if (refreshText) {
    refreshText.textContent = isLoading ? "Refreshing..." : "Refresh list";
  }
}

function filteredAdminRestaurants() {
  const search = adminSearch.toLowerCase().trim();

  if (!search) return restaurants;

  return restaurants.filter((restaurant) => {
    const text = [
      restaurant.name,
      restaurant.phone,
      restaurant.description,
      restaurant.location,
      restaurant.hours,
      restaurant.review,
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search);
  });
}

function renderAdmin() {
  const allowed = isAdmin() && (!db || adminSessionReady);

  adminGuard.classList.toggle("hidden", allowed);
  adminWorkspace.classList.toggle("hidden", !allowed);
  adminStatus.textContent = source;

  if (!allowed) return;

  const data = filteredAdminRestaurants();

  if (adminCountText) {
    adminCountText.textContent = adminSearch
      ? `Showing ${data.length} of ${restaurants.length} restaurants for "${adminSearch}"`
      : `Showing all ${restaurants.length} restaurants`;
  }

  if (!data.length) {
    adminRows.innerHTML = `
      <tr>
        <td colspan="7" class="empty-admin-row">
          No restaurant found. Try another search keyword.
        </td>
      </tr>
    `;
    return;
  }

  adminRows.innerHTML = data
    .map(
      (restaurant) => `
        <tr>
          <td>${restaurant.name}</td>
          <td>
            <img
              class="table-thumb"
              src="${restaurantPhoto(restaurant)}"
              alt="${restaurant.name}"
            >
          </td>
          <td>${restaurant.phone}</td>
          <td>${restaurant.location}</td>
          <td>${restaurant.hours}</td>
          <td>${restaurant.review}</td>
          <td>
            <div class="row-actions">
              <button class="mini" data-edit="${restaurant.id}" type="button">Edit</button>
              <button class="mini" data-upload-photo="${restaurant.id}" type="button">Upload photo</button>
              <button class="mini danger" data-delete="${restaurant.id}" type="button">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function fillRestaurantForm(restaurant) {
  document.querySelector("#formTitle").textContent = restaurant
    ? "Edit restaurant"
    : "Add new restaurant";

  document.querySelector("#restaurantId").value = restaurant?.id || "";
  document.querySelector("#restaurantName").value = restaurant?.name || "";
  document.querySelector("#restaurantPhone").value = restaurant?.phone || "";
  document.querySelector("#restaurantDescription").value = restaurant?.description || "";
  document.querySelector("#restaurantLocation").value = restaurant?.location || "";
  document.querySelector("#restaurantHours").value = restaurant?.hours || "";
  document.querySelector("#restaurantReview").value = restaurant?.review || "";
  document.querySelector("#restaurantPhoto").value = restaurant?.photoUrl || "";
  if (restaurantPhotoFile) restaurantPhotoFile.value = "";
  setAdminFormMessage("");
  setUploadButtonState();
  setPhotoPreview(
    restaurant?.photoUrl || "",
    restaurant?.photoUrl ? "Current restaurant photo" : ""
  );
}

function readRestaurantForm() {
  const id = document.querySelector("#restaurantId").value;

  return {
    id: id ? Number(id) : Date.now(),
    name: document.querySelector("#restaurantName").value.trim(),
    phone: document.querySelector("#restaurantPhone").value.trim() || "-",
    description: document.querySelector("#restaurantDescription").value.trim(),
    location: document.querySelector("#restaurantLocation").value.trim(),
    hours: document.querySelector("#restaurantHours").value.trim(),
    review: document.querySelector("#restaurantReview").value.trim(),
    photoUrl: document.querySelector("#restaurantPhoto").value.trim(),
  };
}

function safeFileName(name) {
  return String(name || "restaurant-photo")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireSupabaseSession() {
  if (!db) {
    throw new Error("Supabase is not connected.");
  }

  return null;
}

async function prepareAdminSession() {
  if (!db || !isAdmin()) {
    adminSessionReady = !db && isAdmin();
    return;
  }

  adminSessionReady = true;
}

async function uploadRestaurantPhoto(restaurant) {
  const file = restaurantPhotoFile?.files?.[0];
  if (!file || !db) return restaurant.photoUrl;

  return uploadPhotoFile(file, restaurant);
}

async function uploadPhotoFile(file, restaurant) {
  await requireSupabaseSession();

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const folder = safeFileName(restaurant.name) || "restaurant";
  const filePath = `${folder}/${Date.now()}-${safeFileName(file.name) || `photo.${extension}`}`;

  const { error } = await db.storage.from(PHOTO_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) throw error;

  const { data } = db.storage.from(PHOTO_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function updateRestaurantPhoto(restaurant, publicUrl) {
  const { error } = await db
    .from("restaurants")
    .update({ photo_url: publicUrl })
    .eq("id", restaurant.id);

  if (error) throw error;
}

async function uploadSelectedFormPhoto() {
  const file = restaurantPhotoFile?.files?.[0];
  const id = Number(document.querySelector("#restaurantId").value);

  if (!id) {
    setAdminFormMessage("Click Edit on a restaurant first, then choose a photo.", "error");
    return;
  }

  if (!file) {
    setAdminFormMessage("Choose a photo file first.", "error");
    return;
  }

  const restaurant = restaurants.find((item) => item.id === id) || readRestaurantForm();

  try {
    uploadFormPhotoBtn.disabled = true;
    setAdminFormMessage("Uploading photo...", "info");
    const publicUrl = await uploadPhotoFile(file, restaurant);
    await updateRestaurantPhoto(restaurant, publicUrl);

    if (restaurantPhotoInput) restaurantPhotoInput.value = publicUrl;
    setPhotoPreview(publicUrl, file.name);

    const loaded = await loadRestaurants();
    restaurants = loaded.restaurants;
    source = loaded.source;
    renderAdmin();

    setAdminFormMessage("Photo uploaded and saved to Supabase.", "success");
  } catch (error) {
    console.error(error);
    setAdminFormMessage(error.message || "Could not upload the photo.", "error");
  } finally {
    setUploadButtonState();
  }
}

async function chooseAndUploadRowPhoto(restaurant) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await uploadPhotoFile(file, restaurant);
      console.log("Uploaded restaurant photo:", publicUrl);
      await updateRestaurantPhoto(restaurant, publicUrl);
      console.log("Saved photo_url for restaurant:", restaurant.id);

      const loaded = await loadRestaurants();
      restaurants = loaded.restaurants;
      source = loaded.source;
      renderAdmin();
      alert("Photo uploaded successfully.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Could not upload the photo.");
    }
  });

  input.click();
}

async function refreshRestaurants() {
  setRefreshLoading(true);

  try {
    localStorage.removeItem("lff_restaurants");

    const loaded = await loadRestaurants();
    restaurants = loaded.restaurants;
    source = loaded.source;

    fillRestaurantForm(null);
    renderAdmin();
  } catch (error) {
    console.error(error);
    alert("Could not refresh the restaurant list. Please try again.");
  } finally {
    setRefreshLoading(false);
  }
}

async function saveRestaurant(event) {
  event.preventDefault();

  const restaurant = readRestaurantForm();
  const editing = restaurants.some((item) => item.id === restaurant.id);

  try {
    setSaveLoading(true);
    setAdminFormMessage("Saving restaurant...", "info");

    if (db) await requireSupabaseSession();

    restaurant.photoUrl = await uploadRestaurantPhoto(restaurant);
    if (restaurantPhotoInput) restaurantPhotoInput.value = restaurant.photoUrl || "";

    if (db) {
      if (editing) {
        const { error } = await db
          .from("restaurants")
          .update(toDbRow(restaurant))
          .eq("id", restaurant.id);

        if (error) throw error;
      } else {
        const { error } = await db.from("restaurants").insert(toDbRow(restaurant));

        if (error) throw error;
      }

      const loaded = await loadRestaurants();
      restaurants = loaded.restaurants;
      source = loaded.source;
    } else {
      restaurants = editing
        ? restaurants.map((item) => (item.id === restaurant.id ? restaurant : item))
        : [restaurant, ...restaurants];

      saveRestaurants(restaurants);
    }

    fillRestaurantForm(null);
    renderAdmin();
    setAdminFormMessage("Restaurant saved.", "success");
  } catch (error) {
    console.error(error);
    setAdminFormMessage(
      error.message || "Could not save the restaurant. Please check for duplicate data or missing fields.",
      "error"
    );
  } finally {
    setSaveLoading(false);
  }
}

async function deleteRestaurant(id) {
  if (!confirm("Delete this restaurant?")) return;

  try {
    if (db) {
      const { error } = await db.from("restaurants").delete().eq("id", id);

      if (error) throw error;

      const loaded = await loadRestaurants();
      restaurants = loaded.restaurants;
      source = loaded.source;
    } else {
      restaurants = restaurants.filter((restaurant) => restaurant.id !== Number(id));
      saveRestaurants(restaurants);
    }

    renderAdmin();
  } catch (error) {
    console.error(error);
    alert("Could not delete the restaurant. Please try again.");
  }
}

restaurantForm?.addEventListener("submit", saveRestaurant);

resetFormBtn?.addEventListener("click", () => {
  fillRestaurantForm(null);
});

refreshButton?.addEventListener("click", refreshRestaurants);

adminSearchInput?.addEventListener("input", (event) => {
  adminSearch = event.target.value;
  renderAdmin();
});

clearAdminSearchBtn?.addEventListener("click", () => {
  adminSearch = "";
  adminSearchInput.value = "";
  renderAdmin();
});

restaurantPhotoFile?.addEventListener("change", () => {
  const file = restaurantPhotoFile.files?.[0];

  if (!file) {
    setPhotoPreview(restaurantPhotoInput?.value || "");
    setUploadButtonState();
    return;
  }

  setPhotoPreview(URL.createObjectURL(file), file.name);
  setUploadButtonState();
  setAdminFormMessage("Photo selected. Click Upload selected photo.", "info");
});

uploadFormPhotoBtn?.addEventListener("click", uploadSelectedFormPhoto);

document.body.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const uploadPhotoButton = event.target.closest("[data-upload-photo]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const restaurant = restaurants.find(
      (item) => item.id === Number(editButton.dataset.edit)
    );

    fillRestaurantForm(restaurant);
  }

  if (uploadPhotoButton) {
    const restaurant = restaurants.find(
      (item) => item.id === Number(uploadPhotoButton.dataset.uploadPhoto)
    );

    if (restaurant) chooseAndUploadRowPhoto(restaurant);
  }

  if (deleteButton) {
    deleteRestaurant(deleteButton.dataset.delete);
  }
});

prepareAdminSession().then(() => loadRestaurants()).then((loaded) => {
  restaurants = loaded.restaurants;
  source = loaded.source;
  renderAdmin();
});
