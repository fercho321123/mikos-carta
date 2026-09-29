
const MIKOS = {
  whatsapp: "573222105073",
  pagos: ["Efectivo", "Transferencia"],
 
  promo: "",
  sizes: [
    { id: "mediano", name: "Mediano", priceSolo: 23000, priceCombo: 31000,
      includes: ["Tortilla", "Arroz", "Queso doble crema", "Salsa cremosa"],
      rules: { veg: 1, prot: 1, top: 1, esp: 1, salsa: 2 } },
    { id: "xl",      name: "XL",      priceSolo: 27000, priceCombo: 35000,
      includes: ["Doble tortilla", "Arroz", "Queso doble crema", "Salsa cremosa"],
      rules: { veg: 1, prot: 2, top: 2, esp: 1, salsa: 2 } }
  ],
  comboNote: "El combo agrega papas a la francesa + gaseosa",

  groups: {
    prot: { title: "Proteína", addPrice: 5000, items: [
      { n: "Carne de res",   note: "Porción 130 g" },
      { n: "Carne de cerdo", note: "Porción 130 g" },
      { n: "Pollo salsa",    note: "Porción 130 g" } ] },
    veg: { title: "Vegetal", addPrice: 2000, items: [
      { n: "Lechuga" }, { n: "Vegetales salteados" }, { n: "Pico de gallo" },
      { n: "Jalapeños" }, { n: "Cebolla encurtida" }, { n: "Pepinillos" } ] },
    top: { title: "Topping", addPrice: 2000, items: [
      { n: "Maicito" }, { n: "Huevo frito" }, { n: "Nachos triturados" }, { n: "Plátano maduro" } ] },
    esp: { title: "Topping especial", items: [
      { n: "Chorizo",    addPrice: 4000 },
      { n: "Chicharrón", addPrice: 3000 },
      { n: "Tocineta",   addPrice: 2000 } ] },
    salsa: { title: "Salsa", addPrice: 2000, items: [
      { n: "Salsa de la casa" }, { n: "Salsa de guacamole" }, { n: "Salsa miel picante" },
      { n: "Salsa BBQ" }, { n: "Salsa aceitunas" }, { n: "Salsa de mostaza y miel" } ] }
  },
  
  extras: [
    { n: "Queso extra", price: 2000 }
  ]
};