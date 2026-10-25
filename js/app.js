//* Interfaz: flujo Armar → Resumen → Datos → Enviar. Usa MK (core.js / order.js) y MIKOS (config.js).*

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const { money, esc, KEYS, slug } = MK;

let draft = MK.blank();
let editing = null;
let view = "armar";
let order = null;
let sent = false;
let undo = null;

let tdraft = MK.tenders.blank();
let tediting = null;

let currentProduct = "armar";

MK.cart.load();

let cust = {};
try {
  cust = JSON.parse(localStorage.getItem("mikos-customer")) || {};
} catch (e) {}

const incl = (g) => MK.limit(draft, g);

const STEPS = [
  "Producto",
  "Tamaño",
  "Ingredientes",
  "Extras",
  "Resumen",
  "Datos",
  "Enviar"
];

// ======================================================
// MENÚ LATERAL: BURRITOS Y TENDERS
// ======================================================

function setProduct(name) {
  currentProduct = name;

  $("#armar").hidden = name !== "armar";
  $("#tenders").hidden = name !== "tenders";

  $$("[data-product]").forEach((b) => {
    b.setAttribute(
      "aria-current",
      String(b.dataset.product === name)
    );
  });
}

function showProduct(name) {
  setProduct(name);
  closeMenu();

  $("#" + name).scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function openMenu() {
  $("#menuPanel").hidden = false;
  $("#menuVeil").hidden = false;

  $("#menuToggle").setAttribute("aria-expanded", "true");
}

function closeMenu() {
  $("#menuPanel").hidden = true;
  $("#menuVeil").hidden = true;

  $("#menuToggle").setAttribute("aria-expanded", "false");
}

// ======================================================
// CONSTRUIR INTERFAZ DE BURRITOS
// ======================================================

function build() {
  $("#info").innerHTML = [
    "Solo domicilios",
    MIKOS.schedule && "Horario: " + esc(MIKOS.schedule),
    `<a href="https://wa.me/${MIKOS.whatsapp}">WhatsApp</a>`
  ]
    .filter(Boolean)
    .map((x) => `<li>${x}</li>`)
    .join("");

  $("#marquee").innerHTML = Array(10)
    .fill("MIKOS · Territorio del sabor")
    .join(" · ");

  $("#promo").textContent = MIKOS.promo || "";
  $("#promo").hidden = !MIKOS.promo;

  $("#sizes").innerHTML = MIKOS.sizes
    .map(
      (s) => `
        <button type="button" role="radio" data-size="${s.id}">
          <span class="sn">${esc(s.name)}</span>

          <span class="price">
            ${money(s.priceSolo)} <small>solo</small> ·
            ${money(s.priceCombo)} <small>combo</small>
          </span>

          <span class="chips">
            ${KEYS.map(
              (g) =>
                `<em>${s.rules[g]} ${MK.lbl(g, s.rules[g])}</em>`
            ).join("")}
          </span>

          ${
            s.includes
              ? `<span class="incl">Incluye: ${esc(
                  s.includes.join(", ")
                )}</span>`
              : ""
          }
        </button>
      `
    )
    .join("");

  $("#combo").innerHTML = `
    <button type="button" role="radio" data-combo="0">
      <span class="cn">Solo</span>
      <span class="price"></span>
    </button>

    <button type="button" role="radio" data-combo="1">
      <span class="cn">Combo</span>
      <span class="price"></span>
      <small>${esc(MIKOS.comboNote || "")}</small>
    </button>

    <div id="drink" class="drinks" hidden></div>
  `;

  $("#groups").innerHTML = KEYS.map((g, i) => {
    const G = MIKOS.groups[g];

    return `
      <div class="group" data-grp="${g}">
        <div class="ghead">
          <span class="step">${i + 3}</span>
          <h3>${esc(G.title)}</h3>
          <span class="cnt" data-cnt="${g}"></span>
        </div>

        <p class="rule" data-rule="${g}"></p>

        <div class="grid">
          ${G.items
            .map(
              (it) => `
                <button
                  type="button"
                  class="card"
                  data-g="${g}"
                  data-n="${esc(it.n)}"
                  aria-pressed="false"
                >
                  <span class="ph">
                    <i>${esc(it.n[0])}</i>
                    <img
                      src="img/items/${slug(it.n)}.jpg"
                      alt=""
                      loading="lazy"
                      onerror="this.remove()"
                    >
                  </span>

                  <span class="lab">
                    <span class="nm">${esc(it.n)}</span>
                    ${
                      it.note
                        ? `<span class="nt">${esc(it.note)}</span>`
                        : ""
                    }
                    <span class="tag">INCLUIDO</span>
                  </span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }).join("");

  const sec = [...KEYS, "extra"]
    .map((g) => ({
      g,
      t: g === "extra" ? "Otros" : MIKOS.groups[g].title,
      a: MK.ADDABLE.filter((x) => x.g === g)
    }))
    .filter((x) => x.a.length);

  $("#extras").innerHTML = `
    <div class="group">
      <div class="ghead">
        <span class="step">${KEYS.length + 3}</span>
        <h3>¿QUIERES AGREGAR ALGO MÁS?</h3>
        <span class="cnt-label">Opcional · se cobra aparte</span>
      </div>

      ${sec
        .map(
          (x) => `
            <h4 class="subhead">
              Extra ${esc(x.t.toLowerCase())}
            </h4>

            <div class="grid addons">
              ${x.a
                .map(
                  (a) => `
                    <div class="addon" data-key="${esc(a.key)}">
                      <span class="an">${esc(a.n)}</span>
                      <span class="ap">EXTRA +${money(a.price)}</span>

                      <span class="stepper">
                        <button
                          type="button"
                          class="dec"
                          aria-label="Quitar ${esc(a.n)}"
                        >−</button>

                        <b data-qty="${esc(a.key)}">0</b>

                        <button
                          type="button"
                          class="inc"
                          aria-label="Agregar ${esc(a.n)}"
                        >+</button>
                      </span>
                    </div>
                  `
                )
                .join("")}
            </div>
          `
        )
        .join("")}
    </div>
  `;

  $("#nstep").textContent = KEYS.length + 4;
  $("#note").maxLength = MIKOS.maxNote || 200;

  $("#pago").innerHTML =
    `<option value="">Elige…</option>` +
    MIKOS.pagos
      .map((p) => `<option>${esc(p)}</option>`)
      .join("");

  Object.entries(cust).forEach(([k, v]) => {
    const f = $(`#form [name="${k}"]`);

    if (f && k !== "pagaCon") {
      f.value = v;
    }
  });

  $("#foot").textContent =
    `MIKOS, territorio del sabor. Solo domicilios. WhatsApp ${MIKOS.whatsapp}`;

  paint();
}

// ======================================================
// CONSTRUIR INTERFAZ DE TENDERS
// ======================================================

function buildTenders() {
  $("#tpkgs").innerHTML = MIKOS.tenders.packages
    .map(
      (p) => `
        <button type="button" role="radio" data-pkg="${p.id}">
          <span class="sn">${esc(p.name)}</span>
          <span class="price">${money(p.price)}</span>
          <span class="chips"><em>${p.pieces} piezas</em></span>
          <span class="incl">Incluye: ${esc(p.fries)}</span>
        </button>
      `
    )
    .join("");

  $("#tsauces").innerHTML = MIKOS.tenders.sauces
    .map(
      (s) => `
        <button
          type="button"
          class="card"
          data-sauce="${esc(s)}"
          aria-pressed="false"
        >
          <span class="ph">
            <i>${esc(s[0])}</i>
            <img
              src="img/items/${slug(s)}.jpg"
              alt=""
              loading="lazy"
              onerror="this.remove()"
            >
          </span>

          <span class="lab">
            <span class="nm">${esc(s)}</span>
            <span class="tag">INCLUIDA</span>
          </span>
        </button>
      `
    )
    .join("");

  $("#tcups").innerHTML = MIKOS.tenders.sauces
    .map(
      (s) => `
        <div class="addon" data-cup="${esc(s)}">
          <span class="an">
            ${esc(s)}<br>
            <small>Vaso 9 oz</small>
          </span>

          <span class="ap">
            ${
              MIKOS.tenders.sauceCupPrice
                ? "EXTRA +" + money(MIKOS.tenders.sauceCupPrice)
                : "Precio por confirmar"
            }
          </span>

          <span class="stepper">
            <button
              type="button"
              class="dec"
              aria-label="Quitar ${esc(s)}"
            >−</button>

            <b data-cupqty="${esc(s)}">0</b>

            <button
              type="button"
              class="inc"
              aria-label="Agregar ${esc(s)}"
            >+</button>
          </span>
        </div>
      `
    )
    .join("");

  $("#tnote").maxLength = MIKOS.maxNote || 200;

  paintTenders();
}

// ======================================================
// ACTUALIZAR INTERFAZ DE TENDERS
// ======================================================

function paintTenders() {
  const pk = MK.tenders.pkg(tdraft.pkg);
  const p = MK.price(tdraft);
  const errs = MK.checkLine(tdraft);
  const bad = new Set(errs.map((e) => e.g));

  $$("#tpkgs button").forEach((b) => {
    b.setAttribute("aria-checked", b.dataset.pkg === tdraft.pkg);
  });

  $$("#tsauces .card").forEach((c) => {
    const on = tdraft.sauces.includes(c.dataset.sauce);

    c.classList.toggle("on", on);
    c.setAttribute("aria-pressed", on);
  });

  $("#tcnt").textContent = `${tdraft.sauces.length}/2`;
  $("#tcnt").classList.toggle("full", tdraft.sauces.length === 2);

  MIKOS.tenders.sauces.forEach((s) => {
    const q = tdraft.cups[s] || 0;

    $(`[data-cupqty="${CSS.escape(s)}"]`).textContent = q;
    $(`[data-cup="${CSS.escape(s)}"]`).classList.toggle(
      "has-qty",
      q > 0
    );
  });

  $("#tncount").textContent =
    `${tdraft.note.length}/${MIKOS.maxNote || 200}`;

  $("#ttlines").innerHTML = `
    <li class="ok">
      <span>Paquete</span>
      <b>${esc(pk.name)} · ${money(p.unit)}</b>
    </li>

    <li class="ok">
      <span>Piezas</span>
      <b>${pk.pieces}</b>
    </li>

    <li class="ok">
      <span>Papas incluidas</span>
      <b>${esc(pk.fries)}</b>
    </li>

    <li class="${bad.has("sauces") ? "" : "ok"}">
      <span>Salsas incluidas</span>
      <b>${esc(tdraft.sauces.join(", ")) || "Falta elegir 2"}</b>
    </li>
  ` +
    MK.tenders
      .cupList(tdraft)
      .map(
        (c) => `
          <li class="ok">
            <span>EXTRA</span>
            <b>Vaso ${esc(c.n)} x${c.q} · ${money(c.price)}</b>
          </li>
        `
      )
      .join("");

  $("#tadd").textContent = tediting
    ? "Guardar cambios"
    : "Agregar al pedido";

  $$(".count").forEach((c) => {
    c.textContent = MK.cart.count();
  });
}

// ======================================================
// ACTUALIZAR INTERFAZ DE BURRITOS
// ======================================================

function paint() {
  const s = MK.size(draft.size);
  const p = MK.price(draft);
  const errs = MK.checkLine(draft);
  const bad = new Set(errs.map((e) => e.g));

  $$("#sizes button").forEach((b) => {
    b.setAttribute("aria-checked", b.dataset.size === draft.size);
  });

  $$("#combo button[data-combo]").forEach((b) => {
    const c = b.dataset.combo === "1";

    b.setAttribute("aria-checked", c === draft.combo);
    b.querySelector(".price").textContent = money(
      c ? s.priceCombo : s.priceSolo
    );
  });

  const dr = $("#drink");
  dr.hidden = !(draft.combo && MIKOS.drinks?.length);

  if (!dr.hidden) {
    dr.innerHTML =
      `<p class="rule">Elige tu gaseosa (incluida en el combo)</p>` +
      MIKOS.drinks
        .map(
          (d) => `
            <button
              type="button"
              role="radio"
              data-drink="${esc(d)}"
              aria-checked="${draft.drink === d}"
            >${esc(d)}</button>
          `
        )
        .join("");
  }

  KEYS.forEach((g) => {
    const n = incl(g);
    const have = draft.picks[g].length;
    const ex = MK.ADDABLE.find((a) => a.g === g);

    $$(`.card[data-g="${g}"]`).forEach((c) => {
      const on = draft.picks[g].includes(c.dataset.n);

      c.classList.toggle("on", on);
      c.setAttribute("aria-pressed", on);
    });

    $(`[data-cnt="${g}"]`).textContent = `${have}/${n}`;
    $(`[data-cnt="${g}"]`).classList.toggle("full", have === n);

    $(`[data-rule="${g}"]`).textContent =
      `Elige exactamente ${n} ${MK.lbl(g, n)} · incluid${
        n > 1 ? "as" : "a"
      } en el precio${
        ex ? ". Más en “extras” (se cobra aparte)." : "."
      }`;
  });

  MK.ADDABLE.forEach((a) => {
    const q = draft.addons[a.key] || 0;

    $(`[data-qty="${CSS.escape(a.key)}"]`).textContent = q;
    $(`[data-key="${CSS.escape(a.key)}"]`).classList.toggle(
      "has-qty",
      q > 0
    );
  });

  $("#ncount").textContent =
    `${draft.note.length}/${MIKOS.maxNote || 200}`;

  $("#tsize").textContent =
    `${s.name} (${draft.combo ? "Combo" : "Solo"}) · ${money(p.unit)}`;

  $("#tlines").innerHTML =
    KEYS.map(
      (g) => `
        <li class="${bad.has(g) ? "" : "ok"}">
          <span>${esc(MIKOS.groups[g].title)}</span>
          <b>
            ${
              esc(draft.picks[g].join(", ")) ||
              "Falta elegir " + incl(g)
            }
          </b>
        </li>
      `
    ).join("") +
    MK.addonList(draft)
      .map(
        (a) => `
          <li class="ok">
            <span>EXTRA</span>
            <b>${esc(a.n)} x${a.q} · ${money(a.price)}</b>
          </li>
        `
      )
      .join("");

  const done = KEYS.filter((g) => !bad.has(g)).length;

  $("#pbar").style.width = (done / KEYS.length) * 100 + "%";

  $("#status").textContent = errs.length
    ? `Faltan ${KEYS.length - done} de ${KEYS.length} grupos`
    : "Burrito completo";

  $("#add").textContent = editing
    ? "Guardar cambios"
    : "Agregar al pedido";

  $$(".count").forEach((c) => {
    c.textContent = MK.cart.count();
  });

  const cur =
    view === "armar"
      ? !errs.length
        ? 4
        : KEYS.some((g) => draft.picks[g].length)
          ? 3
          : 2
      : { resumen: 5, datos: 6, enviar: 7 }[view];

  $("#steps").innerHTML = STEPS
    .map(
      (t, i) => `
        <li class="${
          i + 1 < cur ? "done" : i + 1 === cur ? "now" : ""
        }">
          <b>${i + 1}</b>
          <span>${t}</span>
        </li>
      `
    )
    .join("");
}

// ======================================================
// NAVEGACIÓN ENTRE VISTAS
// ======================================================

function go(v, scroll = true) {
  if (v !== "armar" && !MK.cart.lines.length) {
    v = "armar";
  }

  view = v;

  ["armar", "resumen", "datos", "enviar"].forEach((x) => {
    $(`#v-${x}`).hidden = x !== v;
  });

  $("#steps").hidden = false;

  if (v !== "armar") {
    $$(".oid").forEach((e) => {
      e.textContent = MK.draftId.ensure();
    });
  }

  if (v === "resumen") renderCart();
  if (v === "enviar") renderSend();

  paint();

  if (scroll) {
    $(v === "armar" ? "#armar" : "#pedido").scrollIntoView({
      behavior: "smooth"
    });
  }
}

// ======================================================
// DETALLES DEL PEDIDO
// ======================================================

const detail = (l) => {
  const p = MK.price(l);

  if (l.kind === "tenders") {
    const pk = MK.tenders.pkg(l.pkg);

    return `
      <strong>${esc(l.label)} · ${esc(pk.name)}</strong>

      <p>
        <b>Piezas:</b> ${pk.pieces}<br>
        <b>Papas incluidas:</b> ${esc(pk.fries)}<br>
        <b>Salsas incluidas:</b> ${esc(l.sauces.join(", "))}

        ${
          MK.tenders.cupList(l).length
            ? "<br><b>Salsa adicional:</b> " +
              esc(
                MK.tenders
                  .cupList(l)
                  .map((c) => `${c.n} x${c.q}`)
                  .join(", ")
              )
            : ""
        }

        ${
          l.note
            ? "<br><b>Observaciones:</b> " + esc(l.note)
            : ""
        }
      </p>
    `;
  }

  return `
    <strong>
      ${esc(l.label)} · ${esc(MK.size(l.size).name)} ·
      ${l.combo ? "Combo" : "Solo"}
    </strong>

    <p>
      ${KEYS.map(
        (g) => `
          <b>${esc(MIKOS.groups[g].title)}:</b>
          ${esc(l.picks[g].join(", "))}
        `
      ).join("<br>")}

      ${
        MK.addonList(l).length
          ? "<br><b>Extras:</b> " +
            esc(
              MK.addonList(l)
                .map((a) => `${a.n} x${a.q}`)
                .join(", ")
            )
          : ""
      }

      ${
        l.combo
          ? "<br><b>Bebida:</b> " + esc(l.drink || "Gaseosa")
          : ""
      }

      ${
        l.note
          ? "<br><b>Observaciones:</b> " + esc(l.note)
          : ""
      }
    </p>
  `;
};

function labelled() {
  let nb = 0;
  let nt = 0;

  const t = (k) => String(k).padStart(2, "0");

  return MK.cart.lines.map((l) => {
    if (l.kind === "tenders") {
      const a = nt + 1;
      nt += l.qty;

      return {
        ...l,
        label: `TENDERS ${t(a)}${
          l.qty > 1 ? "-" + t(nt) : ""
        }`
      };
    }

    const a = nb + 1;
    nb += l.qty;

    return {
      ...l,
      label: `BURRITO ${t(a)}${
        l.qty > 1 ? "-" + t(nb) : ""
      }`
    };
  });
}

function totalsHtml() {
  const t = MK.totals(MK.cart.lines);

  return `
    <div>
      <span>SUBTOTAL</span>
      <b>${money(t.base)}</b>
    </div>

    ${
      t.extras
        ? `
          <div>
            <span>EXTRAS</span>
            <b>${money(t.extras)}</b>
          </div>
        `
        : ""
    }

    <div>
      <span>DOMICILIO</span>
      <b>
        ${t.delivery == null ? "Por confirmar" : money(t.delivery)}
      </b>
    </div>

    <div class="tt">
      <span>TOTAL</span>
      <b>${money(t.total)}</b>
    </div>
  `;
}

// ======================================================
// MOSTRAR CARRITO
// ======================================================

function renderCart() {
  $("#cart").innerHTML = labelled()
    .map(
      (l) => `
        <li data-id="${l.id}">
          <div>
            ${detail(l)}

            <span class="lp">
              ${money(MK.price(l).unit)}
              ${
                l.qty > 1
                  ? ` c/u · ${money(MK.price(l).total)}`
                  : ""
              }
            </span>
          </div>

          <div class="rowbtn">
            <span class="stepper q">
              <button
                type="button"
                data-q="-1"
                aria-label="Menos"
              >−</button>

              <b>${l.qty}</b>

              <button
                type="button"
                data-q="1"
                aria-label="Más"
              >+</button>
            </span>

            <button type="button" class="x" data-edit>
              Editar
            </button>

            <button type="button" class="x" data-del>
              Quitar
            </button>
          </div>
        </li>
      `
    )
    .join("");

  $("#totals").innerHTML = totalsHtml();
}

// ======================================================
// PREPARAR ENVÍO DEL PEDIDO
// ======================================================

function renderSend() {
  const id = MK.draftId.ensure();

  order = MK.buildOrder(id, MK.cart.lines, cust);

  $("#recap").innerHTML = `
    <ul>
      ${order.items
        .map(
          (i) => `
            <li>
              <strong>${esc(i.label)}</strong> ·
              ${
                i.kind === "tenders"
                  ? esc(i.pkgName)
                  : `${esc(i.size)} · ${i.combo ? "Combo" : "Solo"}`
              }
              <b>${money(i.total)}</b>
            </li>
          `
        )
        .join("")}
    </ul>

    <div class="totals">
      ${totalsHtml()}
    </div>

    <p class="who">
      ${esc(cust.nombre)} · ${esc(MK.digits(cust.tel))}<br>
      ${esc(cust.dir)}, ${esc(cust.barrio)}
      ${cust.ref ? " (" + esc(cust.ref) + ")" : ""}<br>
      Pago: ${esc(cust.pago)}
      ${
        MK.isCash(cust.pago)
          ? " · paga con " + money(+MK.digits(cust.pagaCon))
          : ""
      }
    </p>
  `;

  $("#wa").href = MK.waUrl(order);
  $("#fresh").hidden = !sent;
}

function toast(msg, undoFn) {
  const t = $("#toast");

  t.hidden = false;

  t.innerHTML =
    esc(msg) +
    (undoFn
      ? ` <button type="button">Deshacer</button>`
      : "");

  t.onclick = (e) => {
    if (e.target.tagName === "BUTTON") {
      undoFn();
      t.hidden = true;
    }
  };

  clearTimeout(toast.t);

  toast.t = setTimeout(() => {
    t.hidden = true;
  }, 6000);
}

const invalidate = () => {
  if (sent) {
    sent = false;
  }

  MK.draftId.reset();
};

// ======================================================
// EVENTOS GENERALES Y MENÚ LATERAL
// ======================================================

document.addEventListener("click", (e) => {
  const t = e.target;
  const q = (s) => t.closest(s);

  // Abrir o cerrar el menú lateral.
  if (q("#menuToggle")) {
    const opening = $("#menuPanel").hidden;

    return opening ? openMenu() : closeMenu();
  }

  // Cerrar con el fondo oscuro o con el botón de cierre.
  if (q("#menuVeil") || q("#menuClose")) {
    return closeMenu();
  }

  // Cambiar entre burritos y tenders.
  const prodBtn = q("[data-product]");

  if (prodBtn) {
    e.preventDefault();
    return showProduct(prodBtn.dataset.product);
  }

  // Navegación.
  if (q("[data-go]")) {
    return go(q("[data-go]").dataset.go);
  }

  // Seleccionar tamaño.
  if (q("#sizes button")) {
    draft.size = q("#sizes button").dataset.size;

    KEYS.forEach((g) => {
      draft.picks[g] = draft.picks[g].slice(0, incl(g));
    });

    return paint();
  }

  // Seleccionar solo o combo.
  if (q("#combo button[data-combo]")) {
    draft.combo =
      q("#combo button[data-combo]").dataset.combo === "1";

    if (!draft.combo) {
      draft.drink = null;
    }

    return paint();
  }

  // Seleccionar bebida.
  if (q("[data-drink]")) {
    draft.drink = q("[data-drink]").dataset.drink;
    return paint();
  }

  // Seleccionar ingredientes.
  const card = q(".card[data-g]");

  if (card) {
    const g = card.dataset.g;
    const n = card.dataset.n;
    const a = draft.picks[g];
    const i = a.indexOf(n);

    if (i > -1) {
      a.splice(i, 1);
    } else if (a.length < incl(g)) {
      a.push(n);
    } else {
      toast(
        `Ya elegiste ${incl(g)} ${MK.lbl(g, incl(g))}. Quita una para cambiar, o agrégala como extra.`
      );
    }

    $("#errs").textContent = "";

    return paint();
  }

  // Agregar o quitar extras de burritos.
  const st = q(".addon[data-key] .inc, .addon[data-key] .dec");

  if (st) {
    const k = st.closest(".addon").dataset.key;
    const c = draft.addons[k] || 0;

    draft.addons[k] = st.classList.contains("inc")
      ? c + 1
      : Math.max(0, c - 1);

    if (!draft.addons[k]) {
      delete draft.addons[k];
    }

    return paint();
  }

  // Agregar burrito al pedido.
  if (t.id === "add") {
    const errs = MK.checkLine(draft);

    if (errs.length) {
      $("#errs").innerHTML = errs
        .map((x) => esc(x.msg))
        .join("<br>");

      const g = $(`[data-grp="${errs[0].g}"]`);

      g?.scrollIntoView({ behavior: "smooth" });
      g?.classList.add("shake");

      setTimeout(() => g?.classList.remove("shake"), 400);

      return;
    }

    invalidate();

    MK.cart.upsert(draft, editing);

    editing = null;
    draft = MK.blank();

    $("#note").value = "";
    $("#errs").textContent = "";

    return go("resumen");
  }

  // Agregar otro producto.
  if (t.id === "another") {
    editing = null;
    draft = MK.blank();

    $("#note").value = "";

    tediting = null;
    tdraft = MK.tenders.blank();

    $("#tnote").value = "";

    go("armar", false);

    return showProduct(currentProduct);
  }

  if (t.id === "toDatos") {
    return go("datos");
  }

  // Acciones sobre los productos del carrito.
  const li = q("#cart li");

  if (li) {
    const id = li.dataset.id;

    // Cambiar cantidad.
    if (q("[data-q]")) {
      const l = MK.cart.lines.find((x) => x.id === id);

      MK.cart.setQty(
        id,
        l.qty + +q("[data-q]").dataset.q
      );

      invalidate();

      return go("resumen", false);
    }

    // Editar producto.
    if (q("[data-edit]")) {
      const l = MK.cart.lines.find((x) => x.id === id);

      if (l.kind === "tenders") {
        tdraft = MK.clone(l);
        tediting = id;

        $("#tnote").value = tdraft.note;

        paintTenders();

        return showProduct("tenders");
      }

      draft = MK.clone(l);
      editing = id;

      $("#note").value = draft.note;

      go("armar", false);

      return showProduct("armar");
    }

    // Eliminar producto.
    if (q("[data-del]")) {
      const l = MK.cart.lines.find((x) => x.id === id);

      const was =
        l && l.kind === "tenders" ? "tenders" : "burrito";

      const r = MK.cart.remove(id);

      invalidate();

      toast(
        `Quitaste ${
          was === "tenders" ? "unos tenders" : "un burrito"
        } del pedido.`,
        () => {
          MK.cart.restore(r);
          invalidate();
          go("resumen", false);
        }
      );

      return go("resumen", false);
    }
  }

  // Registrar el envío por WhatsApp.
  if (t.id === "wa" || q("#wa")) {
    sent = true;

    MK.orders.save(order);

    $("#fresh").hidden = false;

    return;
  }

  // Copiar el pedido.
  if (t.id === "copy") {
    navigator.clipboard
      ?.writeText(MK.whatsapp(order))
      .then(() => {
        toast("Pedido copiado. Pégalo en el chat de MIKOS.");
      });

    return;
  }

  // Crear un nuevo pedido.
  if (t.id === "fresh") {
    MK.cart.clear();
    MK.draftId.reset();

    sent = false;

    draft = MK.blank();
    tdraft = MK.tenders.blank();

    return go("armar");
  }
});

// ======================================================
// EVENTOS DE TENDERS
// ======================================================

document.addEventListener("click", (e) => {
  const t = e.target;
  const q = (s) => t.closest(s);

  // Seleccionar paquete de tenders.
  const pkgBtn = q("#tpkgs button");

  if (pkgBtn) {
    tdraft.pkg = pkgBtn.dataset.pkg;

    return paintTenders();
  }

  // Seleccionar hasta dos salsas incluidas.
  const sauceBtn = q("#tsauces .card");

  if (sauceBtn) {
    const s = sauceBtn.dataset.sauce;
    const a = tdraft.sauces;
    const i = a.indexOf(s);

    if (i > -1) {
      a.splice(i, 1);
    } else if (a.length < 2) {
      a.push(s);
    } else {
      return toast(
        "Ya elegiste 2 salsas incluidas. Quita una para cambiar."
      );
    }

    return paintTenders();
  }

  // Agregar o quitar vasos de salsa.
  const cupBtn = q("#tcups .inc, #tcups .dec");

  if (cupBtn) {
    const s = cupBtn.closest(".addon").dataset.cup;
    const cur = tdraft.cups[s] || 0;

    const n = cupBtn.classList.contains("inc")
      ? cur + 1
      : Math.max(0, cur - 1);

    if (n) {
      tdraft.cups[s] = n;
    } else {
      delete tdraft.cups[s];
    }

    return paintTenders();
  }

  // Agregar tenders al carrito.
  if (t.id === "tadd") {
    const errs = MK.checkLine(tdraft);

    if (errs.length) {
      $("#terrs").innerHTML = errs
        .map((x) => esc(x.msg))
        .join("<br>");

      return;
    }

    invalidate();

    MK.cart.upsert(tdraft, tediting);

    tediting = null;
    tdraft = MK.tenders.blank();

    $("#tnote").value = "";
    $("#terrs").textContent = "";

    return go("resumen");
  }
});

// ======================================================
// CAMPOS DE TEXTO Y PAGO
// ======================================================

document.addEventListener("input", (e) => {
  if (e.target.id === "note") {
    draft.note = e.target.value;

    $("#ncount").textContent =
      `${draft.note.length}/${MIKOS.maxNote || 200}`;
  }

  if (e.target.id === "tnote") {
    tdraft.note = e.target.value;

    $("#tncount").textContent =
      `${tdraft.note.length}/${MIKOS.maxNote || 200}`;
  }

  if (e.target.name === "pago") {
    $("#cashbox").hidden = !MK.isCash(e.target.value);
  }

  if (
    e.target.name === "pago" ||
    e.target.name === "pagaCon"
  ) {
    chips();
  }
});

// ======================================================
// OPCIONES DE DINERO EN EFECTIVO
// ======================================================

function chips() {
  const tot = MK.totals(MK.cart.lines).total;

  const opts = [tot, 20000, 50000, 100000].filter(
    (v, i) => i === 0 || v >= tot
  );

  $("#chips").innerHTML = [...new Set(opts)]
    .map(
      (v, i) => `
        <button type="button" data-cash="${v}">
          ${
            i === 0 && v === tot
              ? "Exacto "
              : ""
          }${money(v)}
        </button>
      `
    )
    .join("");
}

document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-cash]");

  if (c) {
    $("#form [name=pagaCon]").value = money(+c.dataset.cash);
  }
});

// ======================================================
// VALIDAR DATOS DEL CLIENTE Y CONTINUAR
// ======================================================

document.addEventListener("submit", (e) => {
  if (e.target.id !== "form") {
    return;
  }

  e.preventDefault();

  const f = Object.fromEntries(new FormData(e.target));
  const tot = MK.totals(MK.cart.lines).total;
  const errs = MK.checkCustomer(f, tot);

  $$("#form .fe").forEach((s) => {
    s.textContent = "";
  });

  Object.entries(errs).forEach(([k, m]) => {
    const el = $(`#form [name="${k}"]`);

    if (el) {
      el.closest("label").querySelector(".fe").textContent = m;
    }
  });

  if (Object.keys(errs).length) {
    $(`#form [name="${Object.keys(errs)[0]}"]`).focus();

    return;
  }

  cust = {
    ...f,
    tel: MK.digits(f.tel),
    pagaCon: MK.isCash(f.pago)
      ? String(+MK.digits(f.pagaCon))
      : ""
  };

  try {
    localStorage.setItem(
      "mikos-customer",
      JSON.stringify({
        ...cust,
        pagaCon: ""
      })
    );
  } catch (x) {}

  go("enviar");
});

// ======================================================
// INICIALIZAR APLICACIÓN
// ======================================================

build();
buildTenders();
chips();
setProduct("armar");

if (MK.cart.lines.length) {
  paint();
}