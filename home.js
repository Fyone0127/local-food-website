setupHeader("home");

loadRestaurants().then(({ restaurants }) => {
  document.querySelector("#homeRestaurantCount").textContent = restaurants.length;
  renderFeatured(restaurants);
});

function renderFeatured(restaurants) {
  const featuredGrid = document.querySelector("#featuredGrid");
  const featured = [...restaurants]
    .sort((a, b) => ratingValue(b.rating) - ratingValue(a.rating))
    .slice(0, 3);

  featuredGrid.innerHTML = featured
    .map(
      (restaurant) => `
      <article class="feature-card">
        <img src="${restaurantPhoto(restaurant)}" alt="${restaurant.name}">
        <div>
          <span class="rating">${restaurant.rating}</span>
          <h3>${restaurant.name}</h3>
          <p>${restaurant.description}</p>
          <div class="feature-actions">
            ${
              phoneHref(restaurant.phone)
                ? `<a class="primary button-link" href="${phoneHref(restaurant.phone)}">Call</a>`
                : ""
            }
            <a class="secondary button-link" href="${mapsUrl(restaurant)}" target="_blank" rel="noreferrer">Directions</a>
          </div>
        </div>
      </article>`
    )
    .join("");
}
