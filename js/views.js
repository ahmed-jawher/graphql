import { renderLoginForm, logout } from "./auth.js";
import {
  fetchUserProfile,
  fetchSkills,
  fetchLevel,
  fetchTotalXp,
} from "./api.js";
import { getToken, profileState } from "./state.js";
import {
  renderAuditRatioChart,
  renderXpTimelineChart,
  renderSkillsChart,
  formatBytes,
} from "./charts.js";

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function renderLogin(root) {
  root.innerHTML = `<div class="app-shell centered"></div>`;
  renderLoginForm(root.querySelector(".app-shell"));
}

export function renderNotFound(root) {
  root.innerHTML = `
    <div class="app-shell centered">
      <div class="card">
        <h1>Page Not Found</h1>
        <a href="#">Back to login</a>
      </div>
    </div>
  `;
}

function attrsRows(attrs) {
  const map = {
    Gender: attrs?.gender,
    "Country of birth": attrs?.countryOfBirth,
    "Phone Number": attrs?.Phone,
    "CPR Number": attrs?.CPRnumber,
    Qualification: attrs?.qualification,
    Degree: attrs?.Degree,
    Job: attrs?.jobtitle,
  };
  return Object.entries(map)
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <div class="detail-row">
          <span class="detail-label">${escapeHtml(label)}</span>
          <span class="detail-value">${escapeHtml(value)}</span>
        </div>
      `
    )
    .join("");
}

function renderProfileMarkup(root) {
  const { user, level, totalXp } = profileState;

  root.innerHTML = `
    <div class="app-shell">
      <nav class="nav">
        <span class="brand">GraphQL Profile</span>
        <button id="logout-btn" class="logout-btn">Log out</button>
      </nav>

      <div class="grid">
        <section class="card user-details">
          <h2>User Details</h2>
          <div class="detail-row">
            <span class="detail-label">Username</span>
            <span class="detail-value">${escapeHtml(user.login)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">${escapeHtml(user.email)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">First Name</span>
            <span class="detail-value">${escapeHtml(user.firstName)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Last Name</span>
            <span class="detail-value">${escapeHtml(user.lastName)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Campus</span>
            <span class="detail-value">${escapeHtml(user.campus)}</span>
          </div>
          ${attrsRows(user.attrs)}
        </section>

        <section class="card stats">
          <h2>Stats</h2>
          <div class="stat-badges">
            <div class="badge">
              <span class="badge-value">${level ?? "—"}</span>
              <span class="badge-label">Level</span>
            </div>
            <div class="badge">
              <span class="badge-value">${formatBytes(totalXp ?? 0)}</span>
              <span class="badge-label">Total XP</span>
            </div>
          </div>
        </section>

        <section class="card skills">
          <h2>Skills</h2>
          <div id="skills-chart"></div>
        </section>

        <section class="card audit">
          <h2>Audit Ratio</h2>
          <div id="audit-chart"></div>
        </section>

        <section class="card timeline">
          <h2>XP Over Time</h2>
          <div id="xp-chart" class="chart-container"></div>
        </section>
      </div>
    </div>
  `;

  root.querySelector("#logout-btn").addEventListener("click", logout);

  renderSkillsChart(root.querySelector("#skills-chart"), profileState.skills);
  renderAuditRatioChart(root.querySelector("#audit-chart"), {
    totalUp: user.totalUp,
    totalDown: user.totalDown,
    auditRatio: user.auditRatio,
  });
  renderXpTimelineChart(root.querySelector("#xp-chart"), profileState.timeline);
}

function renderLoadingState(root) {
  root.innerHTML = `
    <div class="app-shell centered">
      <p class="loading">Loading...</p>
    </div>
  `;
}

function renderErrorState(root) {
  root.innerHTML = `
    <div class="app-shell centered">
      <div class="card">
        <p class="error-text">Something went wrong loading your profile.</p>
        <button id="retry-btn">Retry</button>
      </div>
    </div>
  `;
  root.querySelector("#retry-btn").addEventListener("click", () => renderProfile(root));
}

export async function renderProfile(root) {
  profileState.loading = true;
  profileState.error = null;
  renderLoadingState(root);

  const token = getToken();

  try {
    const user = await fetchUserProfile(token);
    const [skills, level, totalXp] = await Promise.all([
      fetchSkills(token),
      fetchLevel(token, user.login),
      fetchTotalXp(token),
    ]);

    profileState.user = user;
    profileState.timeline = user.timeline;
    profileState.skills = skills;
    profileState.level = level;
    profileState.totalXp = totalXp;
    profileState.loading = false;

    renderProfileMarkup(root);
  } catch (err) {
    profileState.loading = false;
    profileState.error = err;
    renderErrorState(root);
  }
}
