const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

export function formatBytes(n) {
  const units = ["B", "kB", "MB", "GB"];
  let value = Number(n) || 0;
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export function renderAuditRatioChart(container, { totalUp, totalDown, auditRatio }) {
  const width = 400;
  const height = 140;
  const barHeight = 28;
  const labelWidth = 90;
  const maxBarWidth = width - labelWidth - 60;
  const max = Math.max(totalUp, totalDown, 1);

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "audit-chart",
  });

  const bars = [
    { label: "Done", value: totalUp, y: 20, className: "bar-done" },
    { label: "Received", value: totalDown, y: 70, className: "bar-received" },
  ];

  bars.forEach(({ label, value, y, className }) => {
    const barWidth = Math.max((value / max) * maxBarWidth, 2);

    svg.appendChild(
      svgEl("text", { x: 0, y: y + barHeight / 2 + 5, class: "chart-label" })
    ).textContent = label;

    svg.appendChild(
      svgEl("rect", {
        x: labelWidth,
        y,
        width: barWidth,
        height: barHeight,
        rx: 6,
        class: className,
      })
    );

    svg.appendChild(
      svgEl("text", {
        x: labelWidth + barWidth + 8,
        y: y + barHeight / 2 + 5,
        class: "chart-value",
      })
    ).textContent = formatBytes(value);
  });

  container.innerHTML = "";
  container.appendChild(svg);

  const ratioEl = document.createElement("p");
  ratioEl.className = "audit-ratio-value";
  ratioEl.textContent = `Ratio: ${auditRatio.toFixed(2)}`;
  container.appendChild(ratioEl);
}

export function renderXpTimelineChart(container, timelineEntries) {
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  container.innerHTML = "";

  if (!timelineEntries || timelineEntries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chart-empty";
    empty.textContent = "No XP data yet.";
    container.appendChild(empty);
    return;
  }

  const sorted = [...timelineEntries].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  let running = 0;
  const points = sorted.map((entry) => {
    running += entry.amount;
    return { date: new Date(entry.createdAt), value: running, amount: entry.amount };
  });

  const minDate = points[0].date;
  const maxDate = points[points.length - 1].date;
  const maxValue = points[points.length - 1].value;
  const dateSpan = Math.max(maxDate - minDate, 1);

  const xScale = (date) => margin.left + ((date - minDate) / dateSpan) * innerWidth;
  const yScale = (value) => margin.top + innerHeight - (value / maxValue) * innerHeight;

  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, class: "xp-chart" });

  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const value = (maxValue / gridLines) * i;
    const y = yScale(value);
    svg.appendChild(
      svgEl("line", {
        x1: margin.left,
        x2: width - margin.right,
        y1: y,
        y2: y,
        class: "grid-line",
      })
    );
    const label = svgEl("text", { x: 4, y: y + 4, class: "axis-label" });
    label.textContent = formatBytes(value);
    svg.appendChild(label);
  }

  const tickCount = Math.min(points.length, 5);
  for (let i = 0; i < tickCount; i++) {
    const idx = Math.round((i / Math.max(tickCount - 1, 1)) * (points.length - 1));
    const point = points[idx];
    const x = xScale(point.date);
    const label = svgEl("text", {
      x,
      y: height - margin.bottom + 20,
      class: "axis-label",
      "text-anchor": "middle",
    });
    label.textContent = point.date.toLocaleDateString();
    svg.appendChild(label);
  }

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.date)},${yScale(p.value)}`)
    .join(" ");
  svg.appendChild(svgEl("path", { d: pathData, class: "xp-line" }));

  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip hidden";
  container.appendChild(tooltip);

  points.forEach((p) => {
    const circle = svgEl("circle", {
      cx: xScale(p.date),
      cy: yScale(p.value),
      r: 4,
      class: "xp-point",
    });
    circle.addEventListener("mouseenter", () => {
      tooltip.textContent = `${p.date.toLocaleDateString()} — ${formatBytes(p.value)}`;
      tooltip.classList.remove("hidden");
    });
    circle.addEventListener("mousemove", (event) => {
      const rect = container.getBoundingClientRect();
      tooltip.style.left = `${event.clientX - rect.left + 12}px`;
      tooltip.style.top = `${event.clientY - rect.top + 12}px`;
    });
    circle.addEventListener("mouseleave", () => {
      tooltip.classList.add("hidden");
    });
    svg.appendChild(circle);
  });

  container.appendChild(svg);
}

export function renderSkillsChart(container, skills) {
  const best = new Map();
  for (const { type, amount } of skills) {
    const label = type.replace(/^skill_/, "");
    if (!best.has(label) || best.get(label) < amount) {
      best.set(label, amount);
    }
  }

  container.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "skills-grid";

  for (const [label, amount] of best) {
    const percent = Math.min(amount, 100);
    const circumference = 100;

    const item = document.createElement("div");
    item.className = "skill-item";

    const svg = svgEl("svg", { viewBox: "0 0 36 36", class: "skill-ring" });
    svg.appendChild(
      svgEl("path", {
        class: "skill-ring-bg",
        d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831",
      })
    );
    svg.appendChild(
      svgEl("path", {
        class: "skill-ring-fill",
        "stroke-dasharray": `${percent}, ${circumference}`,
        d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831",
      })
    );

    const percentText = svgEl("text", { x: 18, y: 20.35, class: "skill-ring-text" });
    percentText.textContent = `${Math.round(percent)}%`;
    svg.appendChild(percentText);

    item.appendChild(svg);

    const labelEl = document.createElement("span");
    labelEl.className = "skill-label";
    labelEl.textContent = label;
    item.appendChild(labelEl);

    wrapper.appendChild(item);
  }

  container.appendChild(wrapper);
}
