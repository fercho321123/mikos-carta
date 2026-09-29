const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const KEYS = Object.keys(MIKOS.groups);
const LBL = { prot: ["proteína", "proteínas"], veg: ["vegetal", "vegetales"], top: ["topping", "toppings"], esp: ["topping especial", "toppings especiales"], salsa: ["salsa", "salsas"] };
const money = (n) => "$" + (n || 0).toLocaleString("es-CO");

// Lista plana de todo lo que se puede pedir en adición: { key, n, price }
const ADDABLE = [];
KEYS.forEach((g) => MIKOS.groups[g].items.forEach((it) => ADDABLE.push({ key: g + "|" + it.n, n: it.n, price: it.addPrice || MIKOS.groups[g].addPrice || 0 })));
(MIKOS.extras || []).forEach((ex) => ADDABLE.push({ key: "extra|" + ex.n, n: ex.n, price: ex.price || 0 }));

let size = MIKOS.sizes[0];
let combo = false;
let pick = Object.fromEntries(KEYS.map((k) => [k, []]));
let addons = {}; // key -> cantidad
let cart = [];
try { cart = JSON.parse(localStorage.getItem("mikos-cart")) || []; } catch (e) {}
cart = cart.filter((b) => typeof b.price === "number" && typeof b.combo === "boolean" && b.addons && typeof b.addons === "object" && KEYS.every((g) => Array.isArray(b[g])));

const limit = (g) => size.rules[g];
const done = (g) => pick[g].length === limit(g);
const ready = () => KEYS.every(done);
const basePrice = () => (combo ? size.priceCombo : size.priceSolo);
const addonsTotal = () => Object.entries(addons).reduce((s, [k, q]) => s + q * (ADDABLE.find((a) => a.key === k)?.price || 0), 0);
const burritoPrice = () => basePrice() + addonsTotal();

function build() {
  $("#marquee").innerHTML = Array(10).fill("MIKOS · Territorio del sabor").join(" · ");
  $("#promo").textContent = MIKOS.promo || "";
  $("#promo").hidden = !MIKOS.promo;

  $("#sizes").innerHTML = MIKOS.sizes.map((s) => `<button type="button" role="radio" data-size="${s.id}"><span class="sn">${s.name}</span><span class="price">${money(s.priceSolo)}</span><span class="chips">${KEYS.map((g) => `<em>${s.rules[g]} ${LBL[g][s.rules[g] > 1 ? 1 : 0]}</em>`).join("")}</span>${s.includes ? `<span class="incl">Incluye: ${s.includes.join(", ")}</span>` : ""}</button>`).join("");

  $("#combo").innerHTML = `
    <button type="button" role="radio" data-combo="0"><span class="cn">Solo</span><span class="price"></span></button>
    <button type="button" role="radio" data-combo="1"><span class="cn">Combo</span><span class="price"></span><small>${MIKOS.comboNote || ""}</small></button>`;

  $("#groups").innerHTML = KEYS.map((g, i) => {
    const G = MIKOS.groups[g];
    return `<div class="group"><div class="ghead"><span class="step">${i + 2}</span><h3>${G.title}</h3><span class="cnt" data-cnt="${g}"></span></div><div class="grid">` +
      G.items.map((it) => `<button type="button" class="card" data-g="${g}" data-n="${it.n}" aria-pressed="false">
        <span class="ph"><i>${it.n[0]}</i><img src="img/items/${slug(it.n)}.jpg" alt="" loading="lazy" onerror="this.remove()"></span>
        <span class="lab"><span class="nm">${it.n}</span>${it.note ? `<span class="nt">${it.note}</span>` : ""}</span>
      </button>`).join("") + `</div></div>`;
  }).join("");

  $("#extras").innerHTML = `<div class="group"><div class="ghead"><span class="step">${KEYS.length + 2}</span><h3>Adiciones</h3><span class="cnt-label">Opcional</span></div><div class="grid addons">` +
    ADDABLE.map((a) => `<div class="addon" data-key="${a.key}">
      <span class="an">${a.n}</span><span class="ap">${money(a.price)} c/u</span>
      <span class="stepper"><button type="button" class="dec" aria-label="Quitar ${a.n}">−</button><b data-qty="${a.key}">0</b><button type="button" class="inc" aria-label="Agregar ${a.n}">+</button></span>
    </div>`).join("") + `</div></div>`;

  $("#pago").innerHTML = MIKOS.pagos.map((p) => `<option>${p}</option>`).join("");
  $("#foot").textContent = `MIKOS, territorio del sabor. Solo domicilios. WhatsApp ${MIKOS.whatsapp}`;
  selectSize(size.id);
}

function selectSize(id) {
  size = MIKOS.sizes.find((s) => s.id === id) || MIKOS.sizes[0];
  KEYS.forEach((g) => (pick[g] = []));
  $$("#sizes button").forEach((b) => b.setAttribute("aria-checked", b.dataset.size === size.id));
  paintCombo();
  paint();
}

function paintCombo() {
  $$("#combo button").forEach((b) => {
    const isCombo = b.dataset.combo === "1";
    b.setAttribute("aria-checked", isCombo === combo);
    b.querySelector(".price").textContent = money(isCombo ? size.priceCombo : size.priceSolo);
  });
}

function paint() {
  KEYS.forEach((g) => {
    $$(`.card[data-g="${g}"]`).forEach((c) => {
      const on = pick[g].includes(c.dataset.n);
      c.classList.toggle("on", on);
      c.setAttribute("aria-pressed", on);
    });
    $(`[data-cnt="${g}"]`).textContent = `${pick[g].length}/${limit(g)}`;
    $(`[data-cnt="${g}"]`).classList.toggle("full", done(g));
  });
  ADDABLE.forEach((a) => { const el = $(`[data-qty="${CSS.escape(a.key)}"]`); if (el) el.textContent = addons[a.key] || 0; });

  const n = KEYS.filter(done).length;
  $("#tsize").textContent = `${size.name} (${combo ? "Combo" : "Solo"}) · ${money(burritoPrice())}`;
  const addonLines = Object.entries(addons).filter(([, q]) => q > 0).map(([k, q]) => {
    const a = ADDABLE.find((x) => x.key === k);
    return `<li class="ok"><span>+ ${a.n} x${q}</span><b>${money(a.price * q)}</b></li>`;
  });
  $("#tlines").innerHTML = KEYS.map((g) => `<li class="${done(g) ? "ok" : ""}"><span>${MIKOS.groups[g].title}</span><b>${pick[g].join(", ") || "Falta elegir " + limit(g)}</b></li>`).join("") + addonLines.join("");
  $("#pbar").style.width = (n / KEYS.length) * 100 + "%";
  $("#add").disabled = !ready();
  $("#status").textContent = ready() ? "Burrito completo" : `Faltan ${KEYS.length - n} de ${KEYS.length} grupos`;
  $$(".count").forEach((c) => (c.textContent = cart.length));

  const total = cart.reduce((s, b) => s + (b.price || 0), 0);
  $("#cart").innerHTML = cart.length ? cart.map((b, i) => {
    const extraLines = Object.entries(b.addons || {}).filter(([, q]) => q > 0).map(([k, q]) => {
      const a = ADDABLE.find((x) => x.key === k);
      return `+ ${a ? a.n : k} x${q}`;
    });
    return `<li><div><strong>Burrito ${b.size} (${b.combo ? "Combo" : "Solo"}) · ${money(b.price)}</strong><p>${KEYS.map((g) => b[g].join(", ")).join(", ")}${extraLines.length ? " · " + extraLines.join(", ") : ""}</p></div><button type="button" class="x" data-del="${i}" aria-label="Quitar burrito ${i + 1}">Quitar</button></li>`;
  }).join("") + `<li class="total"><span>Total</span><strong>${money(total)}</strong></li>`
    : `<li class="empty">Aún no has agregado burritos. Arma el primero arriba.</li>`;
  $("#form button[type=submit]").disabled = !cart.length;
  localStorage.setItem("mikos-cart", JSON.stringify(cart));
}

document.addEventListener("click", (e) => {
  const sizeBtn = e.target.closest("#sizes button");
  if (sizeBtn) { selectSize(sizeBtn.dataset.size); return; }

  const comboBtn = e.target.closest("#combo button");
  if (comboBtn) { combo = comboBtn.dataset.combo === "1"; paintCombo(); paint(); return; }

  const card = e.target.closest(".card");
  if (card) {
    const g = card.dataset.g, n = card.dataset.n;
    const i = pick[g].indexOf(n);
    if (i > -1) pick[g].splice(i, 1);
    else if (pick[g].length < limit(g)) pick[g].push(n);
    paint();
    return;
  }

  const stepBtn = e.target.closest(".addon .inc, .addon .dec");
  if (stepBtn) {
    const key = stepBtn.closest(".addon").dataset.key;
    const cur = addons[key] || 0;
    if (stepBtn.classList.contains("inc")) addons[key] = cur + 1;
    else if (cur > 0) addons[key] = cur - 1;
    if (!addons[key]) delete addons[key];
    paint();
    return;
  }

  if (e.target.id === "add" && ready()) {
    cart.push({ size: size.name, combo, price: burritoPrice(), addons: { ...addons }, ...JSON.parse(JSON.stringify(pick)) });
    KEYS.forEach((g) => (pick[g] = []));
    addons = {};
    paint();
    $("#pedido").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const del = e.target.closest("[data-del]");
  if (del) { cart.splice(+del.dataset.del, 1); paint(); }
});

document.addEventListener("submit", (e) => {
  if (e.target.id !== "form") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const total = cart.reduce((s, b) => s + (b.price || 0), 0);
  const lines = cart.map((b, i) => {
    const extraLines = Object.entries(b.addons || {}).filter(([, q]) => q > 0).map(([k, q]) => {
      const a = ADDABLE.find((x) => x.key === k);
      return `   + ${a ? a.n : k} x${q} (${money((a ? a.price : 0) * q)})`;
    });
    return `${i + 1}) Burrito ${b.size} (${b.combo ? "Combo: papas + gaseosa" : "Solo"}) - ${money(b.price)}\n` +
      KEYS.map((g) => `   ${MIKOS.groups[g].title}: ${b[g].join(", ")}`).join("\n") +
      (extraLines.length ? "\n" + extraLines.join("\n") : "");
  });
  const msg = `Hola MIKOS, quiero hacer un pedido a domicilio.\n\n${lines.join("\n\n")}\n\nTotal: ${money(total)}\n\nNombre: ${f.get("nombre")}\nDirección: ${f.get("dir")}\nPago: ${f.get("pago")}` + (f.get("notas") ? `\nNotas: ${f.get("notas")}` : "");
  const url = `https://wa.me/${MIKOS.whatsapp}?text=${encodeURIComponent(msg)}`;
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
});

build();