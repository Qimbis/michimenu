/* MichiMenú — lógica. Sin backend: todo el estado vive en localStorage. */
"use strict";

const WEEK = MICHI_DATA.weeks[MICHI_DATA.weeks.length - 1];
const RECIPES = MICHI_DATA.recipes;
const SLOTS = ["desayuno", "comida", "cena"];
const STORE_KEY = "michimenu_v1";

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
const state = loadState();
state.meals = state.meals || {};   // { "s1.0.comida": true }
state.shop  = state.shop  || {};   // { "s1.Proteínas 💪.Atún en lata": true }
state.antojos = state.antojos || []; // [ {t, d} ]

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

// Lunes = 0 … Domingo = 6
function todayIndex() { return (new Date().getDay() + 6) % 7; }

/* ---------- render: Hoy ---------- */
function mealRow(dayIdx, slot) {
  const rid = WEEK.days[dayIdx][slot];
  const r = RECIPES[rid];
  const key = `${WEEK.id}.${dayIdx}.${slot}`;
  const done = !!state.meals[key];
  return `<div class="meal ${done ? "done" : ""}" data-recipe="${esc(rid)}">
    <div class="emoji">${r.emoji}</div>
    <div class="info">
      <div class="slot">${slot}</div>
      <div class="title">${esc(r.t)}</div>
    </div>
    <button class="check" data-check="${esc(key)}" aria-label="marcar">✓</button>
  </div>`;
}

function renderHoy() {
  const i = todayIndex();
  const day = WEEK.days[i];
  return `
    <div class="card">
      <h2>${esc(day.name)} · ¿qué toca hoy?</h2>
      ${SLOTS.map(s => mealRow(i, s)).join("")}
    </div>
    <div class="card"><h2>Snack</h2><p class="snack-note">${esc(WEEK.snack)}</p></div>
    <div class="card"><h2>Reglas de la semana</h2>
      <ul class="rules">${WEEK.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
    </div>`;
}

/* ---------- render: Semana ---------- */
function renderSemana() {
  const t = todayIndex();
  const days = WEEK.days.map((d, i) => `
    <div class="day-block">
      <div class="day-name ${i === t ? "today" : ""}">${esc(d.name)}</div>
      ${SLOTS.map(s => {
        const r = RECIPES[d[s]];
        return `<div class="mini-meal" data-recipe="${esc(d[s])}">
          <span class="slot">${s}</span><span>${r.emoji} ${esc(r.t)}</span>
        </div>`;
      }).join("")}
    </div>`).join("");
  return `
    <div class="card">${days}</div>
    <div class="card"><h2>${esc(WEEK.prep.title)}</h2>
      <ul class="prep-list">${WEEK.prep.items.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>`;
}

/* ---------- render: Súper ---------- */
function walmartUrl(name) {
  return "https://super.walmart.com.mx/search?q=" + encodeURIComponent(name);
}
function renderSuper() {
  const cats = WEEK.shopping.map(cat => `
    <div class="shop-cat">${esc(cat.cat)}</div>
    ${cat.items.map(it => {
      const key = `${WEEK.id}.${cat.cat}.${it.n}`;
      const done = !!state.shop[key];
      return `<div class="shop-item ${done ? "done" : ""}">
        <label><input type="checkbox" data-shop="${esc(key)}" ${done ? "checked" : ""}>
          <span class="name">${esc(it.n)}</span></label>
        <span class="qty">${esc(it.q)}</span>
        <a class="wm-link" target="_blank" rel="noopener" href="${walmartUrl(it.n)}">Walmart ↗</a>
      </div>`;
    }).join("")}`).join("");
  return `
    <div class="card">${cats}</div>
    <button class="btn secondary" id="copy-list">📋 Copiar lista completa</button>
    <button class="btn" id="reset-shop" style="margin-top:8px">🧹 Desmarcar todo (súper nuevo)</button>`;
}
function shoppingText() {
  let out = `MichiMenú 😼 — ${WEEK.label} (${WEEK.dates})\n`;
  for (const cat of WEEK.shopping) {
    out += `\n${cat.cat}\n`;
    for (const it of cat.items) out += `  • ${it.n} — ${it.q}\n`;
  }
  return out;
}

/* ---------- render: Antojos ---------- */
function renderAntojos() {
  const list = state.antojos.length
    ? state.antojos.map((a, i) => `<div class="antojo">
        <span class="txt">${esc(a.t)}</span>
        <span class="date">${esc(a.d)}</span>
        <button class="del" data-del="${i}" aria-label="borrar">✕</button>
      </div>`).join("")
    : `<div class="empty">Nada por ahora.<br>¿Se antoja algo para la próxima semana? 😼</div>`;
  return `
    <div class="antojo-form">
      <input id="antojo-input" type="text" maxlength="80" placeholder="Se me antojan unos camarones…">
      <button id="antojo-add" aria-label="agregar">＋</button>
    </div>
    <div class="card">${list}</div>
    <p class="snack-note" style="padding:0 6px">Estas ideas entran al menú de la próxima semana — el antojo agendado no asalta la alacena. 🐾</p>`;
}

/* ---------- recipe modal ---------- */
function openRecipe(rid) {
  const r = RECIPES[rid];
  if (!r) return;
  const ings = r.ing.map(i => {
    const same = i.e === i.u;
    const amt = same ? `<b>${esc(i.e)}</b>`
      : `<b>${esc(i.e)}</b> ella<br><b>${esc(i.u)}</b> tú`;
    return `<div class="ing"><span>${esc(i.n)}</span><span class="amt">${amt}</span></div>`;
  }).join("");
  document.getElementById("sheet").innerHTML = `
    <div class="handle"></div>
    <h3>${r.emoji} ${esc(r.t)}</h3>
    <div class="time">⏱ ${esc(r.time)}</div>
    <h4>Ingredientes</h4>${ings}
    <h4>Preparación</h4>
    <ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    <details class="nutri"><summary>Info nutricional</summary>
      <p>Ella: ${esc(r.nutri.e)}<br>Tú: ${esc(r.nutri.u)}</p>
    </details>`;
  document.getElementById("modal").classList.add("open");
}
document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") e.target.classList.remove("open");
});

/* ---------- tabs + events ---------- */
let tab = "hoy";
const RENDERERS = { hoy: renderHoy, semana: renderSemana, super: renderSuper, antojos: renderAntojos };

function render() {
  document.getElementById("view").innerHTML = RENDERERS[tab]();
  document.querySelectorAll("#nav button").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === tab));
}

document.getElementById("nav").addEventListener("click", e => {
  const b = e.target.closest("button[data-tab]");
  if (!b) return;
  tab = b.dataset.tab;
  render();
});

document.getElementById("view").addEventListener("click", e => {
  const check = e.target.closest("[data-check]");
  if (check) {
    const k = check.dataset.check;
    state.meals[k] = !state.meals[k];
    saveState(); render(); return;
  }
  const shop = e.target.closest("[data-shop]");
  if (shop) {
    state.shop[shop.dataset.shop] = shop.checked;
    saveState(); render(); return;
  }
  if (e.target.closest(".wm-link")) return; // dejar pasar el link
  const del = e.target.closest("[data-del]");
  if (del) {
    state.antojos.splice(Number(del.dataset.del), 1);
    saveState(); render(); return;
  }
  if (e.target.id === "antojo-add") { addAntojo(); return; }
  if (e.target.id === "copy-list") {
    navigator.clipboard.writeText(shoppingText()).then(() => {
      e.target.textContent = "✅ ¡Copiada!";
      setTimeout(() => { if (tab === "super") render(); }, 1500);
    });
    return;
  }
  if (e.target.id === "reset-shop") {
    if (confirm("¿Desmarcar toda la lista del súper?")) {
      state.shop = {}; saveState(); render();
    }
    return;
  }
  const meal = e.target.closest("[data-recipe]");
  if (meal) openRecipe(meal.dataset.recipe);
});

document.getElementById("view").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.id === "antojo-input") addAntojo();
});

function addAntojo() {
  const inp = document.getElementById("antojo-input");
  const t = inp.value.trim();
  if (!t) return;
  const d = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  state.antojos.push({ t, d });
  saveState(); render();
}

/* ---------- init ---------- */
document.getElementById("week-label").innerHTML =
  `${esc(WEEK.label)}<br>${esc(WEEK.dates)}`;
render();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js");
}
