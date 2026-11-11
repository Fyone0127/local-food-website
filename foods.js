setupHeader("foods");

const GUEST_RESTAURANT_LIMIT = 9;

const state = {
  restaurants: [],
  search: "",
  review: "all",
  sort: "rating",
  mood: "",
};

const foodGrid = document.querySelector("#foodGrid");
const reviewFilter = document.querySelector("#reviewFilter");
const searchInput = document.querySelector("#searchInput");
const sortFilter = document.querySelector("#sortFilter");
const resultCount = document.querySelector("#resultCount");
const activeFilters = document.querySelector("#activeFilters");
const totalRestaurants = document.querySelector("#totalRestaurants");
const topRatedCount = document.querySelector("#topRatedCount");
const foodiePoints = document.querySelector("#foodiePoints");
const moodRow = document.querySelector("#moodRow");

const moodKeywords = {
  hungry: ["rice", "biryani", "nasi", "chicken", "meal", "roti", "pizza", "burger"],
  comfort: ["kopi", "coffee", "toast", "laksa", "noodle", "mee", "soup", "dessert"],
  adventure: ["signature", "spicy", "korean", "western", "seafood", "cuisine", "ramen"],
  quick: ["fast", "cafe", "drink", "tea", "toast", "snack", "fries", "dessert"],
};

function renderReviewOptions() {
  reviewFilter.value = state.review;
}

function isLoggedIn() {
  return Boolean(currentUser());
}

function visitedIds() {
  return JSON.parse(localStorage.getItem("lff_visited_restaurants") || "[]");
}

function saveVisitedIds(ids) {
  localStorage.setItem("lff_visited_restaurants", JSON.stringify(ids));
}

function isVisited(restaurant) {
  return visitedIds().includes(String(restaurant.id));
}

function updateFoodiePoints() {
  foodiePoints.textContent = visitedIds().length * 10;
}

function matchesMood(restaurant) {
  if (!state.mood) return true;

  const words = moodKeywords[state.mood] || [];
  const text = [
    restaurant.name,
    restaurant.description,
    restaurant.location,
    restaurant.review,
    restaurant.priceRange,
    restaurant.halalStatus,
  ]
    .join(" ")
    .toLowerCase();

  return words.some((word) => text.includes(word));
}

function filteredRestaurants() {
  const search = state.search.toLowerCase().trim();

  return [...state.restaurants]
    .filter((restaurant) => {
      const haystack = [
        restaurant.name,
        restaurant.phone,
        restaurant.description,
        restaurant.location,
        restaurant.hours,
        restaurant.rating,
        restaurant.review,
        restaurant.priceRange,
        restaurant.halalStatus,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!search || haystack.includes(search)) &&
        (state.review === "all" || ratingValue(restaurant.rating) >= Number(state.review)) &&
        matchesMood(restaurant)
      );
    })
    .sort((a, b) =>
      state.sort === "name"
        ? a.name.localeCompare(b.name)
        : ratingValue(b.rating) - ratingValue(a.rating)
    );
}

function restaurantCard(restaurant) {
  const visited = isVisited(restaurant);

  return `
    <article class="food-card">
      <div class="food-image">
        <img src="${restaurantPhoto(restaurant)}" alt="${restaurant.name}">
        <span class="rating image-rating">${restaurant.rating}</span>
      </div>

      <div class="food-body">
        <div class="food-title">
          <h3>${restaurant.name}</h3>
        </div>

        <p>${restaurant.description}</p>

        <div class="food-tags">
          ${restaurant.priceRange ? `<span>${restaurant.priceRange}</span>` : ""}
          ${restaurant.halalStatus ? `<span>${restaurant.halalStatus}</span>` : ""}
          ${restaurant.review ? `<span>${restaurant.review}</span>` : ""}
        </div>

        <div class="detail-list">
          <div><strong>Phone</strong><span>${restaurant.phone}</span></div>
          <div><strong>Hours</strong><span>${restaurant.hours}</span></div>
          <div><strong>Location</strong><span>${restaurant.location}</span></div>
        </div>

        <div class="card-actions">
          ${
            phoneHref(restaurant.phone)
              ? `<a class="primary button-link" href="${phoneHref(restaurant.phone)}">Call</a>`
              : `<span class="secondary unavailable">No phone</span>`
          }
          <a class="secondary button-link" href="${mapsUrl(restaurant)}" target="_blank" rel="noreferrer">
            Directions
          </a>
        </div>

        <div class="map-preview">
          <iframe
            title="Map to ${restaurant.name}"
            loading="lazy"
            src="${mapEmbedUrl(restaurant)}"
          ></iframe>
        </div>

        <button
          class="points-btn ${visited ? "saved" : ""}"
          type="button"
          data-visit="${restaurant.id}"
        >
          ${visited ? "Visited +10 points" : "Mark visited"}
        </button>
      </div>
    </article>
  `;
}

function loginUnlockCard(hiddenCount) {
  return `
    <article class="food-card">
      <div class="food-body">
        <span class="rating">Login required</span>

        <h3 style="margin-top: 14px;">Unlock ${hiddenCount} more restaurants</h3>

        <p>
          Login or create an account to view the full Kuching restaurant list with more food places,
          contact numbers, opening hours, reviews, and directions.
        </p>

        <div class="card-actions">
          <a class="primary button-link" href="login.html">Login</a>
          <a class="secondary button-link" href="register.html">Register</a>
        </div>
      </div>
    </article>
  `;
}

function renderFoods() {
  const data = filteredRestaurants();
  const loggedIn = isLoggedIn();

  // Guest only sees 9 restaurant cards
  const visibleData = loggedIn ? data : data.slice(0, GUEST_RESTAURANT_LIMIT);
  const hiddenCount = Math.max(data.length - visibleData.length, 0);

  // Keep the text/count like before
  resultCount.textContent = `${data.length} restaurant${data.length === 1 ? "" : "s"}`;

  activeFilters.textContent = [
    state.review === "all" ? "Explore restaurants in Kuching" : `Rating ${state.review}+`,
    state.mood ? `${state.mood.charAt(0).toUpperCase()}${state.mood.slice(1)} mood` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  // Keep hero stats showing the real full number
  totalRestaurants.textContent = state.restaurants.length;

  topRatedCount.textContent = state.restaurants.filter(
    (restaurant) => ratingValue(restaurant.rating) >= 4.5
  ).length;

  updateFoodiePoints();

  // Only limit the cards shown
  foodGrid.innerHTML =
    visibleData.map(restaurantCard).join("") +
    (!loggedIn && hiddenCount > 0 ? loginUnlockCard(hiddenCount) : "");
}

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderFoods();
});

reviewFilter.addEventListener("change", (event) => {
  state.review = event.target.value;
  renderFoods();
});

sortFilter.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderFoods();
});

moodRow?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mood]");
  if (!button) return;

  state.mood = button.dataset.mood;

  moodRow
    .querySelectorAll("[data-mood]")
    .forEach((item) => item.classList.toggle("active", item === button));

  renderFoods();
});

document.querySelectorAll(".food-quick-links [data-query]").forEach((button) => {
  button.addEventListener("click", () => {
    state.search = button.dataset.query;
    searchInput.value = button.dataset.query;

    document
      .querySelectorAll(".food-quick-links button")
      .forEach((item) => item.classList.remove("active"));

    button.classList.add("active");
    renderFoods();
  });
});

document.body.addEventListener("click", (event) => {
  const visitButton = event.target.closest("[data-visit]");
  if (!visitButton) return;

  const id = String(visitButton.dataset.visit);
  const ids = visitedIds();
  const nextIds = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

  saveVisitedIds(nextIds);
  renderFoods();
});

loadRestaurants().then(({ restaurants }) => {
  state.restaurants = restaurants;

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");

  if (query) {
    state.search = query;
    searchInput.value = query;
  }

  renderReviewOptions();
  renderFoods();
});
