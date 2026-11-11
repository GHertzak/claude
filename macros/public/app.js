const $ = (id) => document.getElementById(id);

// ---------- helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const round1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => Math.round(n).toLocaleString();

function getPassword() {
  try { return localStorage.getItem("macro-pw") || ""; } catch { return ""; }
}
function setPassword(v) {
  try { localStorage.setItem("macro-pw", v); } catch { /* ignore */ }
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "content-type": "application/json", "x-app-password": getPassword(), ...(opts.headers || {}) },
  });
  if (res.status === 401) {
    const pw = prompt("App password:");
    if (pw !== null) {
      setPassword(pw);
      return api(path, opts);
    }
    throw new Error("Password required");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.status === 204 ? null : res;
}

/** Resize to ~1568px on the long edge (Claude's sweet spot) and re-encode as JPEG. */
async function loadImage(file, maxEdge, quality) {
  const bitmap = await createImageBitmap(file).catch(async () => {
    // Fallback for browsers without createImageBitmap support for this type
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    URL.revokeObjectURL(url);
    return img;
  });
  const w = bitmap.width, h = bitmap.height;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function makeThumb(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const s = 120;
  const canvas = document.createElement("canvas");
  canvas.width = s; canvas.height = s;
  const side = Math.min(img.width, img.height);
  canvas.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, s, s);
  return canvas.toDataURL("image/jpeg", 0.7);
}

function computeItem(it) {
  const g = Math.max(0, Number(it.grams) || 0) / 100;
  const p = it.per_100g;
  return {
    calories: Math.round((+p.calories || 0) * g),
    protein_g: round1((+p.protein_g || 0) * g),
    carbs_g: round1((+p.carbs_g || 0) * g),
    fat_g: round1((+p.fat_g || 0) * g),
  };
}

// ---------- day view ----------
let currentDate = new Date();

function dayLabel(d) {
  const today = toISODate(new Date());
  const yest = toISODate(new Date(Date.now() - 864e5));
  const iso = toISODate(d);
  if (iso === today) return "Today";
  if (iso === yest) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function setBar(el, value, goal) {
  const pct = goal > 0 ? (value / goal) * 100 : 0;
  el.style.width = `${Math.min(100, pct)}%`;
  el.classList.toggle("over", pct > 105);
}

async function loadDay() {
  $("dayLabel").textContent = dayLabel(currentDate);
  $("nextDay").disabled = toISODate(currentDate) >= toISODate(new Date());
  let data;
  try {
    data = await (await api(`/api/day/${toISODate(currentDate)}`)).json();
  } catch (err) {
    $("emptyMsg").textContent = err.message;
    $("emptyMsg").hidden = false;
    return;
  }
  const { totals: t, goals: g, entries } = data;

  $("calEaten").textContent = fmt(t.calories);
  $("calGoal").textContent = fmt(g.calories);
  const left = g.calories - t.calories;
  $("calLeft").textContent = fmt(Math.abs(left));
  $("calLeft").nextElementSibling.textContent = left >= 0 ? "left" : "over";
  $("calLeft").parentElement.classList.toggle("over", left < 0);
  setBar($("calBar"), t.calories, g.calories);

  for (const [k, key] of [["p", "protein_g"], ["c", "carbs_g"], ["f", "fat_g"]]) {
    $(`${k}Eaten`).textContent = Math.round(t[key]);
    $(`${k}Goal`).textContent = Math.round(g[key]);
    setBar($(`${k}Bar`), t[key], g[key]);
  }

  const list = $("entries");
  list.innerHTML = "";
  $("emptyMsg").textContent = "Nothing logged yet.";
  $("emptyMsg").hidden = entries.length > 0;
  for (const e of entries.slice().reverse()) {
    const li = document.createElement("li");
    li.className = "entry";
    const time = new Date(e.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    li.innerHTML = `
      ${e.thumb ? `<img alt="" />` : `<div class="ph">🍽</div>`}
      <div>
        <div class="entry-name"></div>
        <div class="entry-macros">P ${Math.round(e.totals.protein_g)}g · C ${Math.round(e.totals.carbs_g)}g · F ${Math.round(e.totals.fat_g)}g · ${time}</div>
      </div>
      <div>
        <div class="entry-cal">${fmt(e.totals.calories)}</div>
        <button class="entry-del">Delete</button>
      </div>`;
    if (e.thumb) li.querySelector("img").src = e.thumb;
    li.querySelector(".entry-name").textContent = e.meal_name;
    li.querySelector(".entry-name").title = e.items.map((i) => `${i.name} (${i.grams}g)`).join(", ");
    li.querySelector(".entry-del").onclick = async () => {
      if (!confirm(`Delete "${e.meal_name}"?`)) return;
      await api(`/api/entries/${e.id}`, { method: "DELETE" });
      loadDay();
    };
    list.appendChild(li);
  }
}

$("prevDay").onclick = () => { currentDate = new Date(currentDate.getTime() - 864e5); loadDay(); };
$("nextDay").onclick = () => { currentDate = new Date(currentDate.getTime() + 864e5); loadDay(); };

// ---------- review sheet ----------
let draft = null; // { image, thumb, meal_name, items: [...], analyzed }

// Before the first analysis, Analyze is the primary button; afterwards it's a secondary Re-analyze.
function syncReviewButtons() {
  const hasPhoto = !!draft?.image, first = !draft?.analyzed;
  const b = $("analyzeBtn");
  b.textContent = first ? (hasPhoto ? "Analyze photo" : "Analyze") : (hasPhoto ? "Re-analyze with comment" : "Re-analyze");
  b.classList.toggle("primary", first);
  $("retakeBtn").hidden = !hasPhoto;
}

// A photo opens the review sheet and waits for the user to add an optional comment and tap
// Analyze photo. Nothing is sent for analysis until then.
function openReview(image, { keepNote = false } = {}) {
  draft = { image, thumb: null, meal_name: "", items: [], analyzed: false };
  $("preview").hidden = !image;
  if (image) $("preview").src = image;
  if (!keepNote) $("note").value = "";
  $("noteLabel").textContent = image ? "Add a comment (optional, helps accuracy)" : "What did you eat?";
  $("result").hidden = true;
  $("status").hidden = true;
  $("question").hidden = true;
  syncReviewButtons();
  if (!$("review").open) $("review").showModal();
  if (!image) $("note").focus();
}

function setStatus(html, isError = false) {
  const s = $("status");
  s.hidden = false;
  s.className = `status${isError ? " error" : ""}`;
  s.innerHTML = html;
}

async function analyze() {
  const note = $("note").value.trim();
  if (!draft.image && !note) {
    setStatus("Describe what you ate, e.g. “2 scrambled eggs, 1 slice sourdough with butter”.", true);
    return;
  }
  const d = draft;
  $("analyzeBtn").disabled = true;
  $("logBtn").disabled = true;
  $("retakeBtn").hidden = true;
  setStatus(`<span class="spinner"></span>Analyzing… this takes 10–30 seconds`);
  try {
    const res = await api("/api/analyze", { method: "POST", body: JSON.stringify({ image: d.image, note }) });
    const data = await res.json();
    if (draft !== d) return; // photo was retaken meanwhile
    draft.analyzed = true;
    draft.meal_name = data.meal_name;
    draft.items = data.items;
    $("status").hidden = true;
    $("question").hidden = !data.clarifying_question;
    $("question").textContent = data.clarifying_question
      ? `❓ ${data.clarifying_question} Answer in the comment above and tap Re-analyze for a better estimate.`
      : "";
    $("aiNotes").textContent = data.notes || "";
    $("mealName").value = draft.meal_name;
    $("result").hidden = false;
    renderItems();
  } catch (err) {
    if (draft === d) setStatus(`Couldn't analyze: ${err.message}`, true);
  } finally {
    if (draft === d) {
      $("analyzeBtn").disabled = false;
      $("logBtn").disabled = false;
      syncReviewButtons();
    }
  }
}

function renderTotals() {
  const t = draft.items.map(computeItem).reduce(
    (a, m) => ({ calories: a.calories + m.calories, protein_g: a.protein_g + m.protein_g, carbs_g: a.carbs_g + m.carbs_g, fat_g: a.fat_g + m.fat_g }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  $("totals").innerHTML = `
    <div><b>${fmt(t.calories)}</b><span>kcal</span></div>
    <div><b>${Math.round(t.protein_g)}g</b><span>protein</span></div>
    <div><b>${Math.round(t.carbs_g)}g</b><span>carbs</span></div>
    <div><b>${Math.round(t.fat_g)}g</b><span>fat</span></div>`;
}

function renderItems() {
  const ul = $("items");
  ul.innerHTML = "";
  draft.items.forEach((it, idx) => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="item-top">
        <input class="name" aria-label="Food name" />
        <button type="button" class="item-del" aria-label="Remove">×</button>
      </div>
      <div class="item-mid">
        <div class="grams">
          <button type="button" data-step="-1" aria-label="Less">−</button>
          <input type="number" inputmode="decimal" min="0" aria-label="Grams" />
          <span class="muted">g</span>
          <button type="button" data-step="1" aria-label="More">+</button>
        </div>
        <div class="item-macros"></div>
      </div>
      <div class="item-portion"></div>
      <details>
        <summary class="muted small">Per 100 g values</summary>
        <div class="per100">
          <label>kcal<input type="number" inputmode="decimal" data-k="calories" /></label>
          <label>Protein<input type="number" inputmode="decimal" data-k="protein_g" /></label>
          <label>Carbs<input type="number" inputmode="decimal" data-k="carbs_g" /></label>
          <label>Fat<input type="number" inputmode="decimal" data-k="fat_g" /></label>
        </div>
      </details>`;

    const nameIn = li.querySelector(".name");
    const gramsIn = li.querySelector(".grams input");
    const macrosEl = li.querySelector(".item-macros");
    nameIn.value = it.name;
    gramsIn.value = Math.round(it.grams);

    const portion = [it.portion_description, it.confidence === "low" ? "low confidence" : ""].filter(Boolean).join(" · ");
    li.querySelector(".item-portion").textContent = portion;
    if (it.confidence === "low") li.querySelector(".item-portion").classList.add("conf-low");
    if (it._manual) li.querySelector("details").open = true;

    const refresh = () => {
      const m = computeItem(it);
      macrosEl.innerHTML = `<b>${m.calories}</b> kcal · P ${m.protein_g} · C ${m.carbs_g} · F ${m.fat_g}`;
      renderTotals();
    };

    nameIn.oninput = () => { it.name = nameIn.value; };
    gramsIn.oninput = () => { it.grams = Number(gramsIn.value) || 0; refresh(); };
    li.querySelectorAll(".grams button").forEach((b) => {
      b.onclick = () => {
        const step = Math.max(5, Math.round(it.grams * 0.1 / 5) * 5); // ~10% steps
        it.grams = Math.max(0, Math.round(it.grams + Number(b.dataset.step) * step));
        gramsIn.value = it.grams;
        refresh();
      };
    });
    li.querySelectorAll(".per100 input").forEach((inp) => {
      inp.value = it.per_100g[inp.dataset.k];
      inp.oninput = () => { it.per_100g[inp.dataset.k] = Number(inp.value) || 0; refresh(); };
    });
    li.querySelector(".item-del").onclick = () => { draft.items.splice(idx, 1); renderItems(); };

    refresh();
    ul.appendChild(li);
  });
  renderTotals();
}

$("addItem").onclick = () => {
  draft.items.push({ name: "", grams: 100, per_100g: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }, _manual: true });
  renderItems();
};

$("analyzeBtn").onclick = analyze;

$("logBtn").onclick = async () => {
  if (!draft.items.length) { alert("No items to log."); return; }
  $("logBtn").disabled = true;
  try {
    if (draft.image && !draft.thumb) draft.thumb = await makeThumb(draft.image);
    await api("/api/entries", {
      method: "POST",
      body: JSON.stringify({
        date: toISODate(currentDate),
        meal_name: $("mealName").value || draft.meal_name,
        note: $("note").value,
        thumb: draft.thumb,
        items: draft.items.map(({ name, grams, per_100g }) => ({ name, grams, per_100g })),
      }),
    });
    $("review").close();
    loadDay();
  } catch (err) {
    alert(`Couldn't save: ${err.message}`);
  } finally {
    $("logBtn").disabled = false;
  }
};

async function onPick(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  // Retaking from the review sheet keeps whatever comment was already typed.
  const retake = e.target.id === "retakeInput";
  try {
    openReview(await loadImage(file, 1568, 0.85), { keepNote: retake });
  } catch {
    alert("Couldn't read that photo. Try a JPEG or PNG.");
  }
}
$("cameraInput").onchange = onPick;
$("libraryInput").onchange = onPick;
$("retakeInput").onchange = onPick;
$("describeBtn").onclick = () => openReview(null);

// ---------- settings ----------
$("openSettings").onclick = async () => {
  $("pw").value = getPassword();
  try {
    const g = await (await api("/api/goals")).json();
    $("gCal").value = g.calories; $("gP").value = g.protein_g; $("gC").value = g.carbs_g; $("gF").value = g.fat_g;
  } catch { /* still let them set the password */ }
  $("settings").showModal();
};

$("settings").addEventListener("close", async () => {
  if ($("settings").returnValue !== "save") return;
  setPassword($("pw").value);
  try {
    await api("/api/goals", {
      method: "PUT",
      body: JSON.stringify({ calories: $("gCal").value, protein_g: $("gP").value, carbs_g: $("gC").value, fat_g: $("gF").value }),
    });
  } catch (err) {
    alert(`Couldn't save goals: ${err.message}`);
  }
  loadDay();
});

$("exportBtn").onclick = async () => {
  try {
    const blob = await (await api("/api/export.csv")).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "macros.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    alert(err.message);
  }
};

// Refresh "Today" when the app comes back to the foreground on a new day.
document.addEventListener("visibilitychange", () => { if (!document.hidden) loadDay(); });

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

loadDay();

// Pressing Enter in a text field would otherwise "submit" the dialog form and close it.
for (const form of [$("reviewForm"), $("settingsForm")]) {
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
  });
}
