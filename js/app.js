const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const KEYS = Object.keys(MIKOS.groups);
const LBL = { prot: ["proteína", "proteínas"], veg: ["vegetal", "vegetales"], top: ["topping", "toppings"], esp: ["topping especial", "toppings especiales"], salsa: ["salsa", "salsas"] };
let size = MIKOS.sizes[0];
let pick = Object.fromEntries(KEYS.map((k) => [k, []]));
let cart = [];
try { cart = JSON.parse(localStorage.getItem("mikos-cart")) || []; } catch (e) {}
cart = cart.filter((b) => typeof b.price === "number" && KEYS.every((g) => Array.isArray(b[g])));

const limit = (g) => size.rules[g];
const done = (g) => pick[g].length === limit(g);
const ready = () => KEYS.every(done);
const money = (n) => "$" + (n || 0).toLocaleString("es-CO");

function build() {
  $("#marquee").innerHTML = Array(8).fill("<span>MIKOS</span><span>Territorio del sabor</span>").join("");
  $("#promo").textContent = MIKOS.promo || "";
  $("#promo").hidden = !MIKOS.promo;
  $("#sizes").innerHTML = MIKOS.sizes.map((s) => `<button type="button" role="radio" data-size="${s.id}"><span class="sn">${s.name}</span>${s.price ? `<span class="price">${money(s.price)}</span>` : ""}<span class="chips">${KEYS.map((g) => `<em>${s.rules[g]} ${LBL[g][s.rules[g] > 1 ? 1 : 0]}</em>`).join("")}</span>${s.includes ? `<span class="incl">Incluye: ${s.includes.join(", ")}</span>` : ""}${s.combo ? `<span class="combo">${s.combo}</span>` : ""}</button>`).join("");
  $("#groups").innerHTML = KEYS.map((g, i) => {
    const G = MIKOS.groups[g];
    return `<div class="group"><div class="ghead"><span class="step">${i + 2}</span><h3>${G.title}</h3><span class="cnt" data-cnt="${g}"></span></div><div class="grid">` +
      G.items.map((it) => `<button type="button" class="card" data-g="${g}" data-n="${it.n}" aria-pressed="false">
        <span class="ph"><i>${it.n[0]}</i><img src="img/items/${slug(it.n)}.jpg" alt="" loading="lazy" onerror="this.remove()"></span>
        <span class="lab"><span class="nm">${it.n}</span>${it.note ? `<span class="nt">${it.note}${it.price ? ", " + money(it.price) : ""}</span>` : ""}</span></button>`).join("") +
      `</div></div>`;
  }).join("");
  $("#pago").innerHTML = MIKOS.pagos.map((p) => `<option>${p}</option>`).join("");
  $("#foot").textContent = "MIKOS, territorio del sabor. Solo domicilios.";
}

function paint() {
  $$("[data-size]").forEach((b) => b.setAttribute("aria-checked", b.dataset.size === size.id));
  $$(".card").forEach((c) => {
    const on = pick[c.dataset.g].includes(c.dataset.n);
    c.classList.toggle("on", on); c.setAttribute("aria-pressed", on);
  });
  KEYS.forEach((g) => {
    const el = $(`[data-cnt="${g}"]`);
    el.textContent = `${pick[g].length} de ${limit(g)}`;
    el.classList.toggle("full", done(g));
  });
  const n = KEYS.filter(done).length;
  $("#tsize").textContent = `${size.name} · ${money(size.price)}`;
  $("#tlines").innerHTML = KEYS.map((g) => `<li class="${done(g) ? "ok" : ""}"><span>${MIKOS.groups[g].title}</span><b>${pick[g].join(", ") || "Falta elegir " + limit(g)}</b></li>`).join("");
  $("#pbar").style.width = (n / KEYS.length) * 100 + "%";
  $("#add").disabled = !ready();
  $("#status").textContent = ready() ? "Burrito completo" : `Faltan ${KEYS.length - n} de ${KEYS.length} grupos`;
  $$(".count").forEach((c) => (c.textContent = cart.length));
  const total = cart.reduce((s, b) => s + (b.price || 0), 0);
  $("#cart").innerHTML = cart.length ? cart.map((b, i) => `<li><div><strong>Burrito ${b.size} · ${money(b.price)}</strong><p>${KEYS.map((g) => b[g].join(", ")).join(", ")}</p></div><button type="button" class="x" data-del="${i}" aria-label="Quitar burrito ${i + 1}">Quitar</button></li>`).join("") + `<li class="total"><span>Total (combo con papas y gaseosa)</span><strong>${money(total)}</strong></li>`
    : `<li class="empty">Aún no has agregado burritos. Arma el primero arriba.</li>`;
  $("#form button[type=submit]").disabled = !cart.length;
  try { localStorage.setItem("mikos-cart", JSON.stringify(cart)); } catch (e) {}
}

document.addEventListener("click", (e) => {
  const s = e.target.closest("[data-size]"), c = e.target.closest(".card"), d = e.target.closest("[data-del]");
  if (s) { size = MIKOS.sizes.find((x) => x.id === s.dataset.size); KEYS.forEach((g) => (pick[g] = pick[g].slice(0, limit(g)))); }
  if (c) {
    const g = c.dataset.g, n = c.dataset.n, a = pick[g], i = a.indexOf(n);
    if (i > -1) a.splice(i, 1);
    else if (limit(g) === 1) pick[g] = [n];
    else if (a.length < limit(g)) a.push(n);
    else { const k = $(`[data-cnt="${g}"]`); k.classList.remove("shake"); void k.offsetWidth; k.classList.add("shake"); }
  }
  if (d) cart.splice(+d.dataset.del, 1);
  if (e.target.id === "add" && ready()) { cart.push({ size: size.name, price: size.price, ...JSON.parse(JSON.stringify(pick)) }); KEYS.forEach((g) => (pick[g] = [])); $("#pedido").scrollIntoView({ behavior: "smooth" }); }
  paint();
});

$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const total = cart.reduce((s, b) => s + (b.price || 0), 0);
  const lines = cart.map((b, i) => `${i + 1}) Burrito ${b.size} (combo papas + gaseosa) - ${money(b.price)}\n` + KEYS.map((g) => `   ${MIKOS.groups[g].title}: ${b[g].join(", ")}`).join("\n"));
  const msg = `Hola MIKOS, quiero hacer un pedido a domicilio.\n\n${lines.join("\n\n")}\n\nTotal: ${money(total)}\n\nNombre: ${f.get("nombre")}\nDirección: ${f.get("dir")}\nPago: ${f.get("pago")}` + (f.get("notas") ? `\nNotas: ${f.get("notas")}` : "");
  const url = `https://wa.me/${MIKOS.whatsapp}?text=${encodeURIComponent(msg)}`;
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
});

build(); paint();