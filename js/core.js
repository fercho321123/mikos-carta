// Núcleo: catálogo derivado de MIKOS (config.js), precios, validaciones y carrito. Sin DOM.
const MK = {};
MK.slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
MK.money = (n) => "$" + (n || 0).toLocaleString("es-CO");
MK.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
MK.KEYS = Object.keys(MIKOS.groups);
MK.LBL = { prot: ["proteína", "proteínas"], veg: ["vegetal", "vegetales"], top: ["topping", "toppings"], esp: ["topping especial", "toppings especiales"], salsa: ["salsa", "salsas"] };
MK.lbl = (g, n) => (MK.LBL[g] || [MIKOS.groups[g].title.toLowerCase(), MIKOS.groups[g].title.toLowerCase()])[n > 1 ? 1 : 0];

// Extras disponibles = lo que ya tenía la carta: ítems con precio de adición + extras sueltos
MK.ADDABLE = [];
MK.KEYS.forEach((g) => MIKOS.groups[g].items.forEach((it) => {
  const price = it.addPrice ?? MIKOS.groups[g].addPrice;
  if (price > 0) MK.ADDABLE.push({ key: g + "|" + it.n, n: it.n, g, price });
}));
(MIKOS.extras || []).forEach((e) => MK.ADDABLE.push({ key: "extra|" + e.n, n: e.n, g: "extra", price: e.price || 0 }));

MK.size = (id) => MIKOS.sizes.find((s) => s.id === id) || MIKOS.sizes[0];
MK.limit = (l, g) => MK.size(l.size).rules[g];
MK.blank = () => ({ size: MIKOS.sizes[0].id, combo: false, drink: null, qty: 1, note: "", picks: Object.fromEntries(MK.KEYS.map((k) => [k, []])), addons: {} });
MK.clone = (o) => JSON.parse(JSON.stringify(o));
MK.addonList = (l) => Object.entries(l.addons).filter(([, q]) => q > 0).map(([k, q]) => { const a = MK.ADDABLE.find((x) => x.key === k); return a ? { n: a.n, g: a.g, q, price: a.price * q } : null; }).filter(Boolean);

// Precios: se calculan SIEMPRE desde la config (nada de precios guardados que queden viejos)
MK.price = (l) => {
  const s = MK.size(l.size), base = l.combo ? s.priceCombo : s.priceSolo;
  const extras = MK.addonList(l).reduce((t, a) => t + a.price, 0);
  return { base, extras, unit: base + extras, total: (base + extras) * l.qty };
};
MK.totals = (lines) => {
  const t = lines.reduce((a, l) => { const p = MK.price(l); a.base += p.base * l.qty; a.extras += p.extras * l.qty; return a; }, { base: 0, extras: 0 });
  const fee = MIKOS.delivery?.fee ?? null;
  return { ...t, delivery: fee, total: t.base + t.extras + (fee || 0) };
};

// Validaciones: mensajes en lenguaje de cliente
MK.checkLine = (l) => {
  const e = [];
  MK.KEYS.forEach((g) => { const n = MK.limit(l, g), have = l.picks[g].length; if (have !== n) e.push({ g, msg: `Selecciona ${n} ${MK.lbl(g, n)} para continuar${have ? ` (llevas ${have})` : ""}.` }); });
  if (l.combo && MIKOS.drinks?.length && !l.drink) e.push({ g: "drink", msg: "Elige la gaseosa de tu combo." });
  if ((l.note || "").length > (MIKOS.maxNote || 200)) e.push({ g: "note", msg: `Las indicaciones son muy largas (máx. ${MIKOS.maxNote || 200} caracteres).` });
  return e;
};
MK.isCash = (m) => MK.slug(m || "") === "efectivo";
MK.digits = (s) => String(s || "").replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "");
MK.checkCustomer = (c, total) => {
  const e = {};
  if (!c.nombre?.trim()) e.nombre = "Escribe tu nombre.";
  if (!/^3\d{9}$/.test(MK.digits(c.tel))) e.tel = "Escribe un celular de 10 dígitos, por ejemplo 300 123 4567.";
  if (!c.dir?.trim()) e.dir = "Escribe la dirección de entrega.";
  if (!c.barrio?.trim()) e.barrio = "Indica tu barrio o vereda.";
  if (!MIKOS.pagos.includes(c.pago)) e.pago = "Elige cómo vas a pagar.";
  else if (MK.isCash(c.pago)) { const v = +MK.digits(c.pagaCon); if (!v || v < total) e.pagaCon = `Indica con cuánto vas a pagar (mínimo ${MK.money(total)}).`; }
  return e;
};

// Carrito: cada línea es independiente y lleva sus propias selecciones
MK.cart = {
  lines: [], KEY: "mikos-cart-v2",
  load() { try { const d = JSON.parse(localStorage.getItem(this.KEY)); this.lines = (d || []).filter((l) => l.id && l.picks && MK.KEYS.every((g) => Array.isArray(l.picks[g]))); } catch (e) { this.lines = []; } },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.lines)); } catch (e) {} },
  upsert(l, id) { const line = { ...MK.clone(l), id: id || "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }; const i = this.lines.findIndex((x) => x.id === id); i > -1 ? (this.lines[i] = line) : this.lines.push(line); this.save(); return line; },
  remove(id) { const i = this.lines.findIndex((l) => l.id === id); if (i < 0) return null; const [l] = this.lines.splice(i, 1); this.save(); return { l, i }; },
  restore(r) { this.lines.splice(r.i, 0, r.l); this.save(); },
  setQty(id, q) { const l = this.lines.find((x) => x.id === id); if (l) { l.qty = Math.max(1, Math.min(MIKOS.maxQty || 10, q)); this.save(); } },
  clear() { this.lines = []; this.save(); },
  count() { return this.lines.reduce((s, l) => s + l.qty, 0); }
};
