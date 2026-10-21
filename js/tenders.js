// ============================================================
// MIKOS — CHICKEN TENDERS
// Gestión de combos, salsas, datos del cliente y WhatsApp.
// No modifica el carrito ni los precios de los burritos.
// ============================================================

(() => {
  "use strict";

  // ----------------------------------------------------------
  // FUNCIONES BÁSICAS
  // ----------------------------------------------------------

  const $ = (id) => document.getElementById(id);

  const money = (value) =>
    "$" + Number(value).toLocaleString("es-CO");

  const packs = {
    "5": {
      price: 22000,
      fries: "1 porción de papas a la francesa"
    },
    "10": {
      price: 32000,
      fries: "2 porciones de papas a la francesa"
    },
    "15": {
      price: 45000,
      fries: "2 porciones de papas a la francesa"
    },
    "20": {
      price: 55000,
      fries: "3 porciones de papas a la francesa de 150 g cada una"
    }
  };

  const getElement = (id) => {
    const element = $(id);

    if (!element) {
      console.error(`MIKOS: No se encontró el elemento #${id}`);
    }

    return element;
  };

  // ----------------------------------------------------------
  // ELEMENTOS DEL MENÚ
  // ----------------------------------------------------------

  const tenderPack = getElement("tenderPack");
  const tenderQty = getElement("tenderQty");
  const tenderExtraQty = getElement("tenderExtraQty");
  const tenderSauce1 = getElement("tenderSauce1");
  const tenderSauce2 = getElement("tenderSauce2");
  const tenderExtraSauce = getElement("tenderExtraSauce");

  const tenderFries = getElement("tenderFries");
  const tenderSummary = getElement("tenderSummary");
  const tenderTotal = getElement("tenderTotal");

  const tenderWhatsApp = getElement("tenderWhatsApp");
  const customerForm = getElement("tenderCustomerForm");

  const paymentMethod = getElement("tenderPaymentMethod");
  const cashField = getElement("tenderCashField");
  const cashAmount = getElement("tenderCashAmount");
  const formError = getElement("tenderFormError");

  const customerName = getElement("tenderCustomerName");
  const customerAddress = getElement("tenderCustomerAddress");

  // Evitar errores si el HTML no contiene alguno de los elementos.
  const requiredElements = [
    tenderPack,
    tenderQty,
    tenderExtraQty,
    tenderSauce1,
    tenderSauce2,
    tenderExtraSauce,
    tenderFries,
    tenderSummary,
    tenderTotal,
    tenderWhatsApp,
    customerForm,
    paymentMethod,
    cashField,
    cashAmount,
    formError,
    customerName,
    customerAddress
  ];

  if (requiredElements.some((element) => !element)) {
    console.error(
      "MIKOS: No se pudo iniciar el módulo de Tenders. " +
      "Verifica que los identificadores del HTML coincidan con los de tenders.js."
    );

    return;
  }

  // ----------------------------------------------------------
  // CANTIDADES Y PRECIOS
  // ----------------------------------------------------------

  function normalizeQuantity(value, min, max) {
    const number = Number.parseInt(value, 10);

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.max(min, Math.min(max, number));
  }

  function updateOrder() {
    const selectedPack = packs[tenderPack.value];

    if (!selectedPack) {
      return {
        pack: packs["5"],
        qty: 1,
        extraQty: 0,
        total: 22000
      };
    }

    const qty = normalizeQuantity(tenderQty.value, 1, 10);
    const extraQty = normalizeQuantity(tenderExtraQty.value, 0, 10);

    tenderQty.value = qty;
    tenderExtraQty.value = extraQty;

    const combosSubtotal = selectedPack.price * qty;
    const extraSaucesSubtotal = extraQty * 5000;
    const total = combosSubtotal + extraSaucesSubtotal;

    tenderFries.textContent = selectedPack.fries;

    tenderSummary.textContent =
      `Chicken Tenders x${tenderPack.value} · ` +
      `${qty} ${qty === 1 ? "combo" : "combos"} · ` +
      selectedPack.fries;

    tenderTotal.textContent = money(total);

    return {
      pack: selectedPack,
      qty,
      extraQty,
      combosSubtotal,
      extraSaucesSubtotal,
      total
    };
  }

  [
    tenderPack,
    tenderQty,
    tenderExtraQty,
    tenderSauce1,
    tenderSauce2,
    tenderExtraSauce
  ].forEach((element) => {
    element.addEventListener("input", updateOrder);
    element.addEventListener("change", updateOrder);
  });

  // ----------------------------------------------------------
  // FORMULARIO DEL CLIENTE
  // ----------------------------------------------------------

  function updatePaymentFields() {
    const isCash = paymentMethod.value === "Efectivo";

    cashField.hidden = !isCash;
    cashAmount.required = isCash;

    if (!isCash) {
      cashAmount.value = "";
    }
  }

  paymentMethod.addEventListener("change", updatePaymentFields);

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;

    formError.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function clearError() {
    formError.textContent = "";
    formError.hidden = true;
  }

  // Primero se muestra el formulario.
  // El pedido NO se envía a WhatsApp en este paso.
  tenderWhatsApp.addEventListener("click", (event) => {
    event.preventDefault();

    customerForm.hidden = false;
    tenderWhatsApp.hidden = true;

    updatePaymentFields();
    clearError();

    customerForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    window.setTimeout(() => {
      customerName.focus({ preventScroll: true });
    }, 350);
  });

  // ----------------------------------------------------------
  // VALIDACIÓN DEL CLIENTE
  // ----------------------------------------------------------

  function validateCustomer(total) {
    const name = customerName.value.trim();
    const address = customerAddress.value.trim();
    const payment = paymentMethod.value;

    if (name.length < 2) {
      showError("Escribe tu nombre para continuar.");
      customerName.focus();
      return false;
    }

    if (address.length < 5) {
      showError("Escribe tu dirección completa y barrio.");
      customerAddress.focus();
      return false;
    }

    if (!payment) {
      showError("Selecciona un método de pago.");
      paymentMethod.focus();
      return false;
    }

    if (payment === "Efectivo") {
      const cash = Number(cashAmount.value);

      if (
        cashAmount.value.trim() === "" ||
        !Number.isFinite(cash) ||
        cash < total
      ) {
        showError(
          `El valor con el que pagas debe ser igual o superior a ` +
          `${money(total)}. El domicilio se confirma por separado.`
        );

        cashAmount.focus();
        return false;
      }
    }

    return true;
  }

  // ----------------------------------------------------------
  // CREAR MENSAJE PARA WHATSAPP
  // ----------------------------------------------------------

  function buildWhatsAppMessage(order) {
    const {
      pack,
      qty,
      extraQty,
      combosSubtotal,
      extraSaucesSubtotal,
      total
    } = order;

    const name = customerName.value.trim();
    const address = customerAddress.value.trim();
    const payment = paymentMethod.value;
    const cash = Number(cashAmount.value);

    const packNumber = tenderPack.value;
    const sauce1 = tenderSauce1.value;
    const sauce2 = tenderSauce2.value;
    const extraSauce = tenderExtraSauce.value;

    const lines = [
      "🍗 *PEDIDO MIKOS | CHICKEN TENDERS*",
      "━━━━━━━━━━━━━━━━━━",
      "",
      "*DATOS DEL CLIENTE*",
      `• Nombre: ${name}`,
      `• Dirección y barrio: ${address}`,
      `• Método de pago: ${payment}`
    ];

    if (payment === "Efectivo") {
      lines.push(
        `• Paga con: ${money(cash)}`,
        `• Cambio sobre productos: ${money(cash - total)}`,
        "• Domicilio: valor por confirmar."
      );
    }

    lines.push(
      "",
      "*DETALLE DEL PEDIDO*",
      `• Presentación: Chicken Tenders x${packNumber}`,
      `• Cantidad de combos: ${qty}`,
      `• Total de tenders: ${Number(packNumber) * qty} unidades`,
      `• Papas: ${pack.fries}`,
      "",
      "*SALSAS INCLUIDAS*",
      `• Primera salsa: ${sauce1} (${qty} porciones)`,
      `• Segunda salsa: ${sauce2} (${qty} porciones)`,
      `• Total de salsas pequeñas: ${qty * 2}`
    );

    if (extraQty > 0) {
      lines.push(
        "",
        "*SALSAS ADICIONALES*",
        `• Vasos de salsa de 9 oz: ${extraQty}`,
        `• Sabor: ${extraSauce}`,
        `• Subtotal adicional: ${money(extraSaucesSubtotal)}`
      );
    }

    lines.push(
      "",
      "*RESUMEN PARA COCINA*",
      `• Preparar ${qty} combo(s) de Chicken Tenders x${packNumber}.`,
      `• Papas: ${pack.fries}.`,
      `• Salsas incluidas: ${qty} de ${sauce1} y ${qty} de ${sauce2}.`
    );

    if (extraQty > 0) {
      lines.push(
        `• Agregar ${extraQty} vaso(s) de 9 oz de ${extraSauce}.`
      );
    }

    lines.push(
      "",
      `• Subtotal de combos: ${money(combosSubtotal)}`,
      `• Subtotal de salsas adicionales: ${money(extraSaucesSubtotal)}`,
      `*TOTAL DE PRODUCTOS: ${money(total)}*`,
      "• El domicilio no está incluido; confirmar su valor.",
      "",
      "Por favor confirmar el pedido, la disponibilidad y el valor final del domicilio.",
      "",
      "¡Gracias por elegir MIKOS! 🐒"
    );

    return lines.join("\n");
  }

  // ----------------------------------------------------------
  // ENVÍO A WHATSAPP
  // ----------------------------------------------------------

  customerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    clearError();

    const order = updateOrder();

    if (!validateCustomer(order.total)) {
      return;
    }

    // Comprobar que exista el número configurado en config.js.
    if (
      typeof MIKOS === "undefined" ||
      !MIKOS.whatsapp ||
      !String(MIKOS.whatsapp).replace(/\D/g, "")
    ) {
      showError(
        "No se ha configurado el número de WhatsApp de MIKOS. " +
        "Revisa la configuración de la carta."
      );

      console.error(
        "MIKOS: configura MIKOS.whatsapp en js/config.js."
      );

      return;
    }

    const phone = String(MIKOS.whatsapp).replace(/\D/g, "");
    const message = buildWhatsAppMessage(order);

    const whatsappUrl =
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Abrir WhatsApp desde la acción del usuario.
    // Funciona con WhatsApp instalado o con WhatsApp Web.
    window.location.assign(whatsappUrl);
  });

  // ----------------------------------------------------------
  // INICIALIZACIÓN
  // ----------------------------------------------------------

  updatePaymentFields();
  updateOrder();

})();