const ADMIN_EMAIL = "admin@localfood.test";

setupHeader(document.body.dataset.page);

function setMessage(id, text) {
  const element = document.querySelector(id);
  if (element) element.textContent = text;
}

async function login(event) {
  event.preventDefault();

  const email = document.querySelector("#loginEmail").value.trim().toLowerCase();
  const password = document.querySelector("#loginPassword").value;

  // Admin login uses Supabase Auth when the database is connected.
  if (email === ADMIN_EMAIL) {
    if (!db) {
      setMessage("#loginMessage", "Supabase is unavailable. Please try again.");
      return;
    }

    if (db) {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(
          "#loginMessage",
          `Admin login failed: ${error.message}`
        );
        return;
      }

      setCurrentUser({
        email: data.user.email,
        role: "admin",
      });

      window.location.href = "admin.html";
      return;
    }

  }

  // Normal user login using Supabase Auth
  if (db) {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("#loginMessage", error.message);
      return;
    }

    setCurrentUser({
      email: data.user.email,
      role: "user",
    });
  } else {
    // Local fallback if Supabase is not connected
    setCurrentUser({
      email,
      role: "user",
    });
  }

  window.location.href = "foods.html";
}

async function register(event) {
  event.preventDefault();

  const name = document.querySelector("#registerName").value.trim();
  const email = document.querySelector("#registerEmail").value.trim().toLowerCase();
  const password = document.querySelector("#registerPassword").value;

  // Do not allow normal users to register using the fixed admin email
  if (email === ADMIN_EMAIL) {
    setMessage("#registerMessage", "This admin email cannot be registered here.");
    return;
  }

  if (db) {
    const { error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setMessage("#registerMessage", error.message);
      return;
    }
  }

  setCurrentUser({
    name,
    email,
    role: "user",
  });

  window.location.href = "foods.html";
}

document.querySelector("#loginForm")?.addEventListener("submit", login);
document.querySelector("#registerForm")?.addEventListener("submit", register);
