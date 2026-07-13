import { signin, ApiError } from "./api.js";
import { setToken, clearToken } from "./state.js";

function mapError(err) {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Invalid username or password";
    if (err.status === 403) return "Forbidden access";
    if (err.status && err.status !== 0) return "Incorrect username or password";
  }
  return "Please try again later or check the internet connection.";
}

export function renderLoginForm(container) {
  container.innerHTML = `
    <div class="card login-card">
      <h1>Log in</h1>
      <form id="login-form" novalidate>
        <label for="identifier">Email or username</label>
        <input id="identifier" name="identifier" type="text" autocomplete="username" required />

        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />

        <p id="login-error" class="error-text hidden"></p>

        <button type="submit">Submit</button>
      </form>
    </div>
  `;

  const form = container.querySelector("#login-form");
  const errorEl = container.querySelector("#login-error");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.classList.add("hidden");
    errorEl.textContent = "";

    const identifier = form.identifier.value.trim();
    const password = form.password.value;

    try {
      const token = await signin(identifier, password);
      setToken(token);
      window.location.hash = "#profile";
    } catch (err) {
      errorEl.textContent = mapError(err);
      errorEl.classList.remove("hidden");
    }
  });
}

export function logout() {
  clearToken();
  window.location.hash = "";
}
