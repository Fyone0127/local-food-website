async function logout() {
  setCurrentUser(null);

  if (db) {
    await db.auth.signOut();
  }

  window.location.href = "index.html";
}

function setupHeader(activePage) {
  const nav = document.querySelector("#siteNav");
  const menuBtn = document.querySelector("#menuBtn");
  const logoutBtn = document.querySelector("#logoutBtn");
  const loginLink = document.querySelector("#loginLink");
  const registerLink = document.querySelector("#registerLink");
  const user = currentUser();

  // Remove existing admin link first to avoid duplicate Admin buttons
  const existingAdminLink = nav?.querySelector('a[data-page="admin"]');
  existingAdminLink?.remove();

  // Show Admin button only when logged in as admin
  if (user?.role === "admin" && nav) {
    const adminLink = document.createElement("a");
    adminLink.href = "admin.html";
    adminLink.dataset.page = "admin";
    adminLink.textContent = "Admin";

    nav.insertBefore(adminLink, logoutBtn || null);
  }

  // Highlight active page
  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === activePage);
  });

  // Show logout if logged in
  if (user) {
    loginLink?.classList.add("hidden");
    registerLink?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");
  } else {
    loginLink?.classList.remove("hidden");
    registerLink?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
  }

  // Mobile menu
  menuBtn?.addEventListener("click", () => {
    nav?.classList.toggle("open");
  });

  logoutBtn?.addEventListener("click", logout);
}
