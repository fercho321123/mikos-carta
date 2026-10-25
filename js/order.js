// Pedido: código único, estados, historial local y mensaje de WhatsApp para cocina.
MK.STATUS = { NUEVO: "Pendiente de confirmación", CONFIRMADO: "Confirmado", EN_PREPARACION: "En preparación", LISTO: "Listo", DESPACHADO: "Despachado", ENTREGADO: "Entregado", CANCELADO: "Cancelado" };

// Código: MKS- + segundos desde 2026-01-01 en base 31 (sin 0,1,I,L,O para no confundir). Crece con el tiempo,
// nunca se repite en un mismo dispositivo. Para unicidad global garantizada, conecta un backend (ver README).
MK.newId = () => {
  const A = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let t = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 1000), last = 0;
  try { last = +localStorage.getItem("mikos-last-id") || 0; if (t <= last) t = last + 1; localStorage.setItem("mikos-last-id", t); } catch (e) {}
  let s = ""; for (let i = 0; i < 6; i++) { s = A[t % A.length] + s; t = Math.floor(t / A.length); }
  return "MKS-" + s;
};
MK.draftId = { get() { try { return localStorage.getItem("mikos-draft-id"); } catch (e) { return null; } }, ensure() { let id = this.get(); if (!id) { id = MK.newId(); try { localStorage.setItem("mikos-draft-id", id); } catch (e) {} } return id; }, reset() { try { localStorage.removeItem("mikos-draft-id"); } catch (e) {} } };
MK.orders = { KEY: "mikos-orders-v1", list() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (e) { return []; } }, save(o) { const all = this.list().filter((x) => x.id !== o.id); all.push(o); try { localStorage.setItem(this.KEY, JSON.stringify(all.slice(-200))); } catch (e) {} }, setStatus(id, st) { const all = this.list(); const o = all.find((x) => x.id === id); if (o && MK.STATUS[st]) { o.status = st; localStorage.setItem(this.KEY, JSON.stringify(all)); } } };

// Foto fija del pedido: nombres y precios ya resueltos, listo para guardar/enviar a un panel futuro
MK.buildOrder = (id, lines, cust) => {
  let nb = 0, nt = 0; const tag = (k) => String(k).padStart(2, "0");
  const items = lines.map((l) => {
    const p = MK.price(l);
    if (l.kind === "tenders") {
      const pk = MK.tenders.pkg(l.pkg), from = nt + 1; nt += l.qty;
      return { kind: "tenders", label: `TENDERS ${tag(from)}${l.qty > 1 ? "-" + tag(nt) : ""}`, qty: l.qty, pkgName: pk.name, pieces: pk.pieces, fries: pk.fries, sauces: l.sauces.slice(), cups: MK.tenders.cupList(l), note: l.note || "", unitPrice: p.unit, total: p.total };
    }
    const from = nb + 1; nb += l.qty;
    return { kind: "burrito", label: `BURRITO ${tag(from)}${l.qty > 1 ? "-" + tag(nb) : ""}`, qty: l.qty, size: MK.size(l.size).name, combo: l.combo, drink: l.drink, picks: MK.clone(l.picks), extras: MK.addonList(l), note: l.note || "", unitPrice: p.unit, total: p.total };
  });
  return { id, status: "NUEVO", createdAt: new Date().toISOString(), type: "DOMICILIO", customer: { ...cust }, items, totals: MK.totals(lines) };
};

MK.clean = (s) => String(s || "").replace(/[━*_~`\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
MK.whatsapp = (o) => {
  const L = "━━━━━━━━━━━━━━━━━━", c = o.customer, t = o.totals, out = [];
  const d = new Date(o.createdAt), pad = (x) => String(x).padStart(2, "0");
  out.push(L, "*MIKOS*", `*PEDIDO ${o.id}*`, L, `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    "", "*CLIENTE*", MK.clean(c.nombre), "", "*TELÉFONO*", MK.digits(c.tel).replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"), "", "*TIPO*", o.type, "",
    "*DIRECCIÓN*", MK.clean(c.dir), `Barrio/Vereda: ${MK.clean(c.barrio)}`, ...(c.ref ? [`Ref: ${MK.clean(c.ref)}`] : []));
  const totalB = o.items.filter((i) => i.kind !== "tenders").reduce((s, i) => s + i.qty, 0);
  const totalT = o.items.filter((i) => i.kind === "tenders").reduce((s, i) => s + i.qty, 0);
  if (totalB) out.push("", `*TOTAL BURRITOS: ${totalB}*`);
  if (totalT) out.push("", `*TOTAL TENDERS: ${totalT}*`);
  o.items.forEach((i) => {
    if (i.kind === "tenders") {
      out.push("", L, `*${i.label}*${i.qty > 1 ? ` (${i.qty} IGUALES)` : ""}`, L, "", "*Paquete:*", i.pkgName.toUpperCase(), "", `*Piezas:* ${i.pieces}`, "", "*Papas incluidas:*", i.fries, "", "*Salsas incluidas:*", ...i.sauces.map((x) => "✓ " + x));
      if (i.cups.length) out.push("", "*Salsa adicional (vaso 9 oz):*", ...i.cups.map((c) => `✓ ${c.n} x${c.q}`));
      if (i.note) out.push("", "*Observaciones:*", MK.clean(i.note));
      out.push("", `*Precio:* ${MK.money(i.unitPrice)}${i.qty > 1 ? ` c/u · ${MK.money(i.total)}` : ""}`);
      return;
    }
    out.push("", L, `*${i.label}*${i.qty > 1 ? ` (${i.qty} IGUALES)` : ""}`, L, "", "*Tamaño:*", i.size.toUpperCase(), "", "*Modalidad:*", i.combo ? "COMBO (papas a la francesa + gaseosa)" : "SOLO");
    MK.KEYS.forEach((g) => out.push("", `*${MIKOS.groups[g].title}:*`, ...i.picks[g].map((x) => "✓ " + x)));
    if (i.extras.length) out.push("", "*Extras:*", ...i.extras.map((e) => `✓ EXTRA: ${e.n}${e.q > 1 ? " x" + e.q : ""}`));
    if (i.combo) out.push("", "*Bebida:*", "✓ " + (i.drink || "Gaseosa (sin sabor elegido)"));
    if (i.note) out.push("", "*Observaciones:*", MK.clean(i.note));
    out.push("", `*Precio:* ${MK.money(i.unitPrice)}${i.qty > 1 ? ` c/u · ${MK.money(i.total)}` : ""}`);
  });
  out.push("", L, `SUBTOTAL: ${MK.money(t.base)}`, ...(t.extras ? [`EXTRAS: ${MK.money(t.extras)}`] : []), `DOMICILIO: ${t.delivery == null ? "POR CONFIRMAR" : MK.money(t.delivery)}`, `*TOTAL: ${MK.money(t.total)}*${t.delivery == null ? " (+ domicilio)" : ""}`,
    "", "MÉTODO DE PAGO:", MK.clean(c.pago).toUpperCase(), ...(MK.isCash(c.pago) ? ["", "PAGA CON:", MK.money(+MK.digits(c.pagaCon))] : []),
    ...(c.notas ? ["", "NOTA DEL PEDIDO:", MK.clean(c.notas)] : []), L, `*PEDIDO ${o.id}*`, L);
  return out.join("\n");
};
MK.waUrl = (o) => `https://wa.me/${MIKOS.whatsapp}?text=${encodeURIComponent(MK.whatsapp(o))}`;
