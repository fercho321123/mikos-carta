
const MIKOS = {
  whatsapp: "573222105073",
  pagos: ["Efectivo", "Transferencia"],
 
  promo: "",
  // --- Datos que NO existían: déjalos vacíos hasta tenerlos (la app los oculta o dice "por confirmar") ---
  schedule: "",            // Ej: "Lun a Dom · 5:00 pm a 10:00 pm"  (vacío = no se muestra)
  delivery: { fee: null }, // Valor del domicilio en pesos. null = "Por confirmar"
  drinks: [],              // Ej: ["Coca-Cola", "Colombiana"]. Vacío = el combo dice solo "Gaseosa"
  maxNote: 200,            // Máx. caracteres de observaciones
  maxQty: 10,              // Máx. unidades iguales por burrito
  sizes: [
    { id: "mediano", name: "Mediano", priceSolo: 24900, priceCombo: 32900,
      includes: ["Tortilla", "Arroz", "Queso doble crema", "Sour cream"],
      rules: { veg: 1, prot: 1, top: 1, esp: 1, salsa: 2 } },
    { id: "xl",      name: "XL",      priceSolo: 29900, priceCombo: 37900,
      includes: ["Tortilla", "Arroz", "Queso doble crema", "Sour cream"],
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
    top: { title: "Topping", addPrice: 3000, items: [
      { n: "Maicito" }, { n: "Huevo frito" }, { n: "Nachos triturados" }, { n: "Plátano maduro" }, { n: "Piña" } ] },
    esp: { title: "Topping especial", items: [
      { n: "Chorizo",    addPrice: 6000 },
      { n: "Chicharrón", addPrice: 5000 },
      { n: "Tocineta",   addPrice: 3000 } ] },
    salsa: { title: "Salsa", addPrice: 2000, items: [
      { n: "Salsa de la casa" }, { n: "Salsa de guacamole" }, { n: "Salsa miel picante" },
      { n: "Salsa BBQ" }, { n: "Salsa aceitunas" }, { n: "Salsa de mostaza y miel" } ] }
  },
  
  extras: [
    { n: "Queso extra", price: 2000 }
  ],

  // --- Chicken tenders: paquetes de tamaño fijo, no se arman por grupos como el burrito ---
  tenders: {
    // Mismas 3 salsas del burrito (reusan sus fotos en img/items/). Cada paquete incluye 2, a elegir aquí.
    sauces: ["Salsa miel picante", "Salsa de mostaza y miel", "Salsa aceitunas"],
    sauceCupPrice: 5000, 
    packages: [
      { id: "t5",  name: "Tenders x5",  pieces: 5,  fries: "1 porción de papas a la francesa",              price: 22000 },
      { id: "t10", name: "Tenders x10", pieces: 10, fries: "2 porciones de papas a la francesa",             price: 32000 },
      { id: "t20", name: "Tenders x20", pieces: 20, fries: "3 porciones de papas a la francesa (150 g c/u)", price: 45000 }
    ]
  }
};