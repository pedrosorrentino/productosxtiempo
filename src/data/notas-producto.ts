/**
 * Prosa propia de cada producto.
 *
 * El problema de fondo de las ~800 fichas es que entre países solo cambiaba el
 * número: el texto era la misma plantilla. Estas notas son distintas para cada
 * producto (qué se está midiendo, qué incluye y qué no, por qué ese precio se
 * mueve), de forma que dos fichas de productos diferentes no compartan prosa.
 *
 * Reglas al escribirlas:
 *  - Nada de moralina ni de «en estos tiempos que corren».
 *  - Solo afirmaciones comprobables sobre el producto; si algo depende del país,
 *    se dice que depende y no se concreta.
 *  - Explicar qué entra en la cifra y qué se queda fuera, que es lo que el
 *    lector necesita para comparar.
 *
 * Los productos sin nota no muestran bloque: no se rellena con texto genérico.
 */
export const NOTAS_PRODUCTO: Record<string, string[]> = {
  iphone: [
    "El precio de esta ficha es el del modelo base con la capacidad más pequeña, comprado en tienda oficial: sin descuento de operador, sin plan de financiación y sin seguro incluido. Es la cifra que se paga de una vez, no la cuota mensual.",
    "Apple renueva la gama cada septiembre y el modelo anterior suele bajar cuando llega el siguiente, así que el mismo teléfono puede costar bastante menos en enero que en octubre. La comparación entre países solo tiene sentido en horas de trabajo: en euros o pesos, lo que cambia es la moneda, no el esfuerzo.",
  ],
  "tesla-model-3": [
    "El Model 3 se vende a precio de configurador, idéntico en todos los concesionarios del país: no hay regateo. Lo que sí cambia es el precio de tarifa, que Tesla ajusta varias veces al año y sin aviso previo, a veces en un mismo trimestre.",
    "La cifra corresponde a la versión de acceso, con el color incluido y sin extras, sin ayudas públicas a la compra y sin financiación. Si se suma la instalación del cargador en casa, el coste real sube; aquí se mide el vehículo, no el coche listo para usar.",
  ],
  "cesta-semanal": [
    "Es una cesta cerrada de alimentación e higiene con los mismos artículos en los doce países, valorada en un supermercado de referencia. No recoge ofertas puntuales, marcas blancas ni cupones: es una foto comparable, no la compra de una familia concreta.",
    "Su utilidad no es saber cuánto cuesta llenar la nevera, sino cuánto pesa lo básico en el sueldo de cada país. Por eso se mide en horas: dos cestas iguales pueden costar dos jornadas en un país y seis en otro sin que nadie esté pagando de más.",
  ],
  "alquiler-piso": [
    "El precio es la renta mensual de un piso de dos habitaciones en la principal área metropolitana del país, no la media nacional: entre el centro y la periferia la diferencia puede ser del doble, y entre una ciudad grande y una pequeña, mayor todavía.",
    "No incluye gastos de comunidad, suministros ni la fianza. Si el piso se comparte, la cifra se divide entre los ocupantes, pero el esfuerzo que mide esta página es el de una sola persona pagándolo entero.",
  ],
  "habitacion-alquiler": [
    "Una habitación en piso compartido, con gastos aparte. Suele ser la opción de quien llega a una ciudad sin historial de alquiler y la que menos margen deja para negociar: se paga lo que pide el anuncio o se descarta.",
    "La diferencia con alquilar un piso entero no es proporcional: en las ciudades caras, una habitación puede costar más de la mitad de lo que costaría el piso completo, porque el propietario traslada el riesgo y el mobiliario al precio.",
  ],
  "carnet-conducir": [
    "La cifra suma matrícula, clases prácticas y tasas de examen en una autoescuela, con el número de prácticas habitual para aprobar a la primera. No incluye repetir el examen, y ahí es donde se dispara la factura: cada convocatoria suspendida añade clases y tasas.",
    "El precio depende de la comunidad o región, de si el examen es por libre y del tipo de cambio de marchas. Lo que no cambia es que se paga antes de saber si se aprueba.",
  ],
  bitcoin: [
    "El bitcoin no tiene precio de tarifa: cotiza las veinticuatro horas y cambia cada minuto, fines de semana incluidos. La cifra de esta ficha es la cotización del día indicado en la fuente, y a los pocos días puede estar muy por encima o muy por debajo.",
    "No es un bien que se compre en una tienda: se adquiere en un intercambio o entre particulares, con comisiones aparte. Por eso la comparación con el salario de cada país mide otra cosa que el resto del catálogo: cuánto tiempo de trabajo costaba ese día, no cuánto cuesta siempre.",
  ],
  "netflix-anual": [
    "Doce meses del plan estándar, sin descuentos por pago anual, que en la mayoría de los países no existe. El plan determina la calidad de imagen y el número de pantallas simultáneas; el precio, el país.",
    "Las tarifas de suscripción suben con frecuencia y sin aviso previo, así que la cifra de esta ficha caduca más rápido que la de un producto físico. Lo que se compara entre países es el esfuerzo, no el precio: un mismo plan puede costar media jornada en un país y dos en otro.",
  ],
  "menu-big-mac": [
    "Menú completo en el mercado local, con hamburguesa, patatas y bebida. McDonald's fija el precio país por país y casi nunca lo cambia dentro del mismo año, lo que lo convierte en una referencia estable para comparar poder de compra entre lugares distintos.",
    "No es un indicador oficial de nada: es un producto idéntico en todas partes, y precisamente por eso sirve. Si el mismo menú cuesta tres horas de trabajo en un país y media en otro, la diferencia no está en la hamburguesa.",
  ],
  "coche-compacto": [
    "Precio de tarifa del modelo de acceso de una marca generalista, sin descuentos de campaña, sin financiación y sin extras. El precio de concesionario suele quedar por debajo, sobre todo a final de trimestre, así que esta cifra es el techo, no lo que se paga.",
    "No incluye impuesto de matriculación cuando existe, seguro, ni el mantenimiento del primer año. Para comparar entre países sirve la versión de acceso: la misma marca vende el mismo coche con equipamientos distintos según el mercado.",
  ],
  "videojuego-aaa": [
    "Un juego de lanzamiento de gran presupuesto, del tipo que se vende a precio completo el primer día. La cifra es la de la tienda oficial el día de la medición, sin rebajas ni suscripciones.",
    "Los juegos bajan de precio más rápido que casi cualquier otro producto del catálogo: en un año pueden estar a la mitad, y en dos, a un tercio. Si se compara con el sueldo de cada país, conviene tenerlo en cuenta: no es lo mismo comprarlo el día del lanzamiento que esperar.",
  ],
  "gimnasio-anual": [
    "Doce meses de cuota en una cadena de gimnasios de precio medio, con acceso a sala y clases colectivas, sin entrenador personal ni servicios adicionales. Las cuotas bajas suelen llevar permanencia: el precio anual ya la incluye.",
    "El coste real depende de cuánto se use, y ahí la cifra no ayuda: es el mismo para quien va cuatro veces por semana que para quien deja de ir en febrero. Lo que mide esta página es el desembolso, no el aprovechamiento.",
  ],
};

/** Devuelve la nota del producto, o null si no tiene (no se rellena con relleno). */
export function notaProducto(id: string): string[] | null {
  const nota = NOTAS_PRODUCTO[id];
  return nota && nota.length > 0 ? nota : null;
}
