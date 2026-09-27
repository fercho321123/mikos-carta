
const MIKOS = {
  whatsapp: "573222105073",
  pagos: ["Efectivo", "Transferencia"],
  
  promo: "🔥 Promo válida desde mañana: combo con papas y gaseosa incluido",
  sizes: [
    { id: "mediano", name: "Mediano", price: 20000,
      includes: ["Tortilla", "Arroz", "Queso doble crema","salsa cremosa"],
      combo: "Combo: papas a la francesa + gaseosa incluidas",
      rules: { veg: 1, prot: 1, top: 1, esp: 1, salsa: 2 } },
    { id: "xl",      name: "XL",      price: 25000,
      includes: ["Doble tortilla", "Arroz", "Queso doble crema","salsa cremosa"],
      combo: "Combo: papas a la francesa + gaseosa incluidas",
      rules: { veg: 1, prot: 2, top: 2, esp: 1, salsa: 2 } }
  ],
  
  groups: {
    prot: { title: "Proteína", items: [
      { n: "Carne de res",   note: "Porción 130 g" },
      { n: "Carne de cerdo", note: "Porción 130 g" },
      { n: "Pollo salsa",    note: "Porción 130 g" },
      { n: "Pollo tender",   note: "Porción 130 g" } ] },
    veg: { title: "Vegetal", items: [
      { n: "Lechuga" }, { n: "vegetales salteados" }, { n: "Pico de gallo" },
      { n: "Jalapeños" }, { n: "Cebolla encurtida" }, { n: "pepinillos" } ] },
    top: { title: "Topping", items: [
      { n: "Maicito" }, { n: "Huevo frito" }, { n: "Nachos triturados" }, { n: "Plátano maduro" } ] },
    esp: { title: "Topping especial", items: [
      { n: "Chorizo" }, { n: "Chicharrón" }, { n: "Tocineta" } ] },
    salsa: { title: "Salsa", items: [
      { n: "Salsa de la casa" }, { n: "Salsa de guacamole" }, { n: "Salsa miel picante" },
      { n: "Salsa BBQ" }, { n: "Salsa aceitunas" }, { n: "Salsa de mostaza y miel" } ] }  
  }
};
