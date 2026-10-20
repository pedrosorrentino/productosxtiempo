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
  "toyota-corolla": [
    "La cifra es un precio medio de mercado del híbrido de 140 CV, no el PVP oficial de un acabado concreto. El Corolla se vende con varias carrocerías y niveles de equipamiento, y entre el de acceso y el tope hay una diferencia que puede superar el 40%.",
    "No incluye impuesto de matriculación, seguro ni mantenimiento. Lo que sí cambia frente a un coche de combustión es el gasto corriente: el híbrido consume menos en ciudad, y eso pesa más cuanto más se conduce.",
  ],
  "seat-ibiza": [
    "Utilitario fabricado en España y uno de los modelos más vendidos de su segmento. La cifra corresponde a un precio de mercado del acabado de acceso con motor de gasolina, no al PVP de tarifa: los descuentos de campaña y el stock mueven esa cantidad varios miles de euros arriba o abajo.",
    "Sin matriculación, seguro ni revisiones. En este segmento el equipamiento opcional puede añadir más de lo que sugiere el precio de partida, así que conviene comparar acabados, no solo modelos.",
  ],
  "volkswagen-golf": [
    "El compacto de referencia del mercado europeo, con motores y acabados que van del utilitario básico a versiones deportivas. La cifra es un precio medio de mercado, y precisamente por esa variedad conviene leerla como puerta de entrada, no como el precio del coche que uno acaba comprando.",
    "No incluye matriculación, seguro ni mantenimiento. El Golf mantiene mejor valor de reventa que la media del segmento, algo que no aparece en el precio de compra pero sí en el coste de tenerlo.",
  ],
  "movil-gama-media": [
    "Un teléfono de gama media, en la franja donde se vende la mayoría de los móviles: pantalla grande, buena batería y cámara suficiente, sin las funciones de la gama alta. La cifra es el precio de tarifa en tienda, sin plan de operador ni pago a plazos.",
    "La diferencia con la gama alta se nota sobre todo a los dos o tres años, cuando llegan las actualizaciones del sistema: los modelos baratos dejan de recibirlas antes. Esa fecha conviene mirarla al comprar, no al año de tenerlo.",
  ],
  "portatil": [
    "Portátil de uso general, de 14 o 15 pulgadas, para estudiar, trabajar con documentos y navegar. No es un equipo para jugar ni para editar vídeo: ahí el precio se multiplica por dos o por tres. La cifra es la mediana de lo que ofrecen las tiendas del país.",
    "No incluye software de pago ni garantía extendida. En este rango, la memoria y el disco son lo que más cambia el rendimiento real, más que el procesador: dos equipos con el mismo precio pueden llevarse años de diferencia en uso diario.",
  ],
  "televisor": [
    "Televisor de 55 pulgadas de gama media, el tamaño más vendido en Europa. La cifra es la mediana de las tiendas del país, así que mezcla tecnologías distintas: pantallas LED básicas y modelos con mejor contraste y brillo.",
    "La diferencia de precio entre dos televisiones del mismo tamaño está casi toda en el panel y en el sistema de iluminación, no en las pulgadas. En un salón con mucha luz, el modelo barato se ve peor que en una habitación a oscuras.",
  ],
  "spotify-anual": [
    "Doce meses del plan Premium Individual a la tarifa vigente cada mes, con impuestos incluidos según el país. El plan familiar y el dúo cuestan más, y el plan gratuito no entra en esta cifra porque no se paga.",
    "Spotify ha subido el precio varias veces en los últimos años y lo ha hecho país por país, así que esta cifra caduca antes que la de un producto físico. Si se contrata desde la aplicación del móvil, la tienda añade su comisión al importe.",
  ],
  "chatgpt-plus": [
    "Doce meses de la suscripción de pago, a la tarifa mensual vigente en cada país y con los impuestos correspondientes. Es el plan individual; los planes de equipo y de empresa se facturan aparte y con otro precio.",
    "Si la suscripción se contrata desde la aplicación del móvil, la tienda del sistema añade su comisión, y el mismo plan cuesta más que contratado en la web. Conviene revisar dónde se hizo la compra antes de comparar precios entre países.",
  ],
  "luz-gas-mes": [
    "Factura media mensual de electricidad y gas de un hogar, no el precio del kilovatio hora. Depende de tres cosas que cambian mucho de un país a otro: el consumo, la tarifa contratada y los impuestos que cada gobierno aplica a la energía.",
    "En países con calefacción de gas, la factura se dispara en invierno y baja en verano; en los que calientan con electricidad, pasa lo contrario. Por eso la cifra anual es más comparable que la de un mes suelto.",
  ],
  "abono-transporte": [
    "Abono mensual de transporte público en la principal ciudad del país, válido para metro y autobús. No incluye cercanías ni tren regional salvo que se indique, y muchas ciudades tienen tarifas reducidas para jóvenes, estudiantes o familias numerosas.",
    "Es uno de los productos donde más influye la política local: hay ciudades que lo subvencionan casi por completo y otras donde cuesta como una cena. Comparar el precio sin mirar qué cubre el abono lleva a conclusiones falsas.",
  ],
  "cafe": [
    "Un café solo servido en la barra, no una cápsula ni un paquete de supermercado. Es el producto donde más pesa el sitio: el mismo café cuesta el doble en el centro de una capital que en un pueblo, y la diferencia entre países mezcla precio y tamaño de la taza.",
    "Con una cifra tan pequeña, las horas de trabajo salen con decimales y cuesta hacerse idea. Sirve más mirar cuántos cafés al día caben en una hora de sueldo que el precio aislado: ahí se ve el poder de compra de verdad.",
  ],
  "menu-del-dia": [
    "Primero, segundo, pan, bebida y postre o café, servido al mediodía en un restaurante de barrio. No es la carta ni el menú de noche: es la fórmula que los restaurantes usan para llenar el local a una hora concreta.",
    "Varía mucho entre ciudades y entre semana y fin de semana, y en zonas de oficinas suele ser más barato que en el centro turístico. Comparado con cocinar en casa, el menú incluye el trabajo de quien lo prepara y sirve, algo que no aparece en la cifra.",
  ],
  "barra-de-pan": [
    "Barra de unos 250 gramos, estimada a partir del precio de la hogaza de medio kilo. El pan artesano de masa madre y el de horno de supermercado no cuestan lo mismo, y esta cifra es la media de tienda, no la del obrador de barrio.",
    "Es el producto del catálogo con el precio más pequeño y el que más ha subido en los últimos años en relación con su coste. Por eso las horas que salen son casi simbólicas: lo que mide bien es su evolución, no su importe.",
  ],
  "leche-mes": [
    "Doce litros al mes, aproximadamente un litro al día. Es leche entera de supermercado; la semidesnatada y la desnatada cuestan prácticamente lo mismo, y la diferencia real está entre marca blanca y marca comercial.",
    "Al ser un consumo mensual y no una compra suelta, la cifra se compara bien entre países: doce litros son los mismos en todos, aunque el envase, la marca y el formato cambien.",
  ],
  "huevos-docena": [
    "Docena de huevos camperos de tamaño mediano. El tipo importa: los de jaula cuestan entre la mitad y dos tercios de lo que cuesta esta docena, y los ecológicos, más. Comparar precios entre países sin mirar el tipo de huevo lleva a conclusiones falsas.",
    "El huevo es uno de los alimentos con mejor relación entre proteína y precio, y por eso aparece tanto en las cestas de la compra ajustadas. Su precio se mueve con los piensos y con los brotes de gripe aviar, no con la demanda de los hogares.",
  ],
  "arroz-kilo": [
    "Un kilo de arroz redondo, el de uso diario para guisos y paellas sencillas. El bomba, el basmati o el de denominación de origen cuestan varias veces más, así que esta cifra es la del arroz corriente de tienda.",
    "Es un alimento con precio estable y existencias abundantes: cuando sube, suele ser por el coste del transporte o por restricciones a la exportación en los países productores, más que por falta de arroz.",
  ],
  "pechuga-pollo-kilo": [
    "Un kilo de pechuga fileteada, la parte más cara del pollo. El pollo entero cuesta bastante menos por kilo y aprovecha más, pero exige tiempo de preparación: la diferencia de precio es, en parte, la diferencia entre comprar tiempo o comprarlo hecho.",
    "Su precio depende de las ofertas de la semana y de si es marca blanca o de marca. Entre países cambia menos que la carne de vacuno, porque el pollo se produce en casi todos y no cruza tantas fronteras.",
  ],
  "cerveza-pack": [
    "Pack de seis latas de 33 centilitros, calculado desde el precio de la botella de medio litro. Es cerveza de supermercado, no de bar: la misma cantidad servida en una terraza cuesta varias veces más, y ese sobreprecio es el que se paga por el sitio y el servicio.",
    "En los países donde el alcohol lleva impuesto específico, buena parte de la cifra no es la cerveza: es el impuesto. Por eso comparar el precio de una caja entre países mide también la política fiscal de cada uno.",
  ],
  "entrada-cine": [
    "Entrada de sesión estándar en una sala comercial, sin descuentos. El día del espectador, las tarifas de estudiante o de jubilado y los bonos reducen el precio; las salas premium, con butacas grandes o proyección especial, lo suben.",
    "El cine es uno de los productos donde el precio sube por encima de la inflación desde hace años, mientras baja el número de espectadores. Lo que se paga no es solo la película: es la sala, el aire acondicionado y el personal.",
  ],
  "corte-pelo": [
    "Corte de hombre en una barbería de ciudad, sin tinte ni tratamiento. El corte de mujer suele costar más y no entra en esta cifra, así que comparar este precio entre países no dice nada sobre lo que cuesta mantenerse el pelo en general.",
    "Es un servicio con poco margen de sustitución: no se puede comprar por internet ni traer de otro país. Su precio refleja casi directamente lo que cuesta una hora de trabajo en el sector servicios de ese lugar.",
  ],
  "dacia-sandero": [
    "El coche nuevo más barato que se vende en Europa, y la cifra es orientativa: no sale de un configurador concreto sino del precio de partida con el acabado básico y el motor de gasolina de acceso. Con aire acondicionado, pantalla o cambio automático sube varios miles.",
    "Lo que abarata el Sandero es renunciar a lo que no se ve: acabados sencillos, menos aislamiento y una lista corta de asistentes. A cambio, mantiene la garantía y la mecánica del grupo al que pertenece. Quien compara solo precio no ve esa parte.",
  ],
  "kia-sportage": [
    "PVP de partida del SUV familiar más vendido de Kia en España, con el acabado básico y el motor de gasolina 1.6 turbo. Los acabados intermedios y el híbrido suben el precio varios miles, y ahí está la mayoría de las ventas reales.",
    "No incluye matriculación, seguro ni mantenimiento. En este segmento el descuento de concesionario y las campañas de fin de trimestre mueven más el precio final que la diferencia entre marcas parecidas.",
  ],
  "hyundai-tucson": [
    "PVP de partida del SUV familiar que lidera matriculaciones en España, con el acabado de acceso. El mismo modelo con motor híbrido, techo o asientos de cuero cuesta bastante más: la cifra es la puerta de entrada, no lo que se paga de media.",
    "No incluye matriculación, seguro ni revisiones. El Tucson se fabrica en Europa y comparte piezas con otros modelos del grupo, algo que se nota en el precio de los recambios más que en el de compra.",
  ],
  "toyota-c-hr": [
    "PVP oficial del SUV coupé híbrido con el acabado de acceso. La versión híbrida de 140 CV es la única que se vende en España, así que aquí no hay opción de gasolina barata: el precio de partida ya incluye la mecánica híbrida.",
    "No incluye matriculación, seguro ni mantenimiento. Toyota mantiene una garantía larga si se pasa por el servicio oficial, una ventaja que no aparece en la cifra de compra pero sí en el coste de los años siguientes.",
  ],
  "peugeot-208": [
    "PVP oficial del utilitario más vendido en Europa, con el acabado Active y el motor de gasolina de 100 CV. Las versiones automáticas, las deportivas y las eléctricas del mismo coche cuestan bastante más.",
    "No incluye matriculación, seguro ni mantenimiento. En este segmento conviene mirar el precio del seguro antes que el de compra: entre dos utilitarios parecidos puede haber más diferencia en la póliza que en la etiqueta.",
  ],
  "renault-clio": [
    "PVP oficial del utilitario superventas europeo, con el acabado Evolution y el motor de 90 CV. Es el Clio de gasolina; el híbrido y el deportivo se venden con otra tarifa y otro público.",
    "No incluye matriculación, seguro ni mantenimiento. Es uno de los modelos con más unidades en el mercado de segunda mano, lo que abarata el coche usado pero también reduce lo que se recupera al vender el nuevo.",
  ],
  "toyota-yaris-cross": [
    "PVP del crossover urbano híbrido más vendido en España, con el acabado Active Plus. Combina la plataforma del Yaris con una carrocería más alta y algo más de espacio, y ese cambio de formato es casi todo lo que separa su precio del utilitario.",
    "No incluye matriculación, seguro ni mantenimiento. Al ser híbrido, gasta menos en ciudad que en carretera: el ahorro depende tanto de dónde se conduzca como de cuánto se conduzca.",
  ],
  "tesla-model-y": [
    "PVP oficial de la versión de acceso, tracción trasera, sin extras ni ayudas públicas a la compra. Es el coche eléctrico más vendido del mundo, y esa escala es la que le permite tener un precio parecido al de un SUV de combustión equivalente.",
    "No incluye la instalación del cargador en casa, que puede añadir un desembolso importante, ni el seguro, que en un eléctrico suele ser más caro por el coste de reparación. Lo que se ahorra es combustible y mantenimiento, no la compra.",
  ],
  "nissan-versa": [
    "PVP de referencia del sedán subcompacto más vendido en México y Latinoamérica, con el acabado Sense. La cifra viene del mercado mexicano, donde este modelo se fabrica y se vende a gran escala.",
    "No incluye seguro ni placas. En los países donde el sedán compite con el SUV pequeño, el Versa se elige por precio y por maletero; en otros, directamente no se vende, y por eso no aparece en todas las fichas.",
  ],
  "mg-zs": [
    "PVP del SUV compacto de precio ajustado con el acabado Comfort. La marca, de origen británico y hoy en manos chinas, ha entrado en Europa compitiendo por precio antes que por imagen, y eso se nota en la cifra.",
    "No incluye matriculación, seguro ni mantenimiento. La red de servicio es más pequeña que la de las marcas tradicionales, algo que importa más a los tres o cuatro años que el día de la compra.",
  ],
  "ortodoncia-invisible": [
    "Tratamiento correctivo completo con alineadores transparentes, de unos 18 meses de duración media. Incluye el estudio inicial, los alineadores, las revisiones y la retención final; no incluye la ortodoncia infantil ni los casos que requieren cirugía.",
    "El precio varía mucho más que el de una funda de móvil: entre clínicas de la misma ciudad puede haber el doble, y casi nunca por la marca de los alineadores. Las clínicas con escáner propio y seguimiento cercano cobran más y ahorran visitas; las low-cost abaratan la entrada y cobran aparte las revisiones.",
  ],
  "amazon-prime": [
    "Cuota anual de la suscripción, no mensual: el precio mensual existe y sale más caro al año. Incluye envíos rápidos, vídeo y música, y su utilidad depende de cuánto se compre en Amazon más que del precio en sí.",
    "La cuota sube con frecuencia y de forma distinta en cada país, así que la cifra de esta ficha caduca antes que la de un producto físico. Si se compara entre países, conviene mirar también qué incluye: el catálogo de vídeo cambia y las condiciones de envío, más.",
  ],
  "factura-luz-mes": [
    "Factura doméstica de 250 kWh al mes al precio oficial del kilovatio hora, con impuestos incluidos. No es un recibo real: es un consumo tipo, para que las cifras de distintos países se puedan comparar entre sí.",
    "La factura real depende del consumo, de la tarifa contratada y de la potencia, y en muchos países casi la mitad de lo que se paga no es energía sino peajes y cargos fijos. Por eso dos hogares con el mismo consumo pueden pagar muy distinto.",
  ],
  "factura-gas-mes": [
    "Factura doméstica de 625 kWh de gas al mes, para cocina, agua caliente y calefacción de un piso medio. Igual que la luz, es un consumo tipo y no un recibo real: sirve para comparar, no para adivinar lo que pagarás en enero.",
    "En los países donde la calefacción es de gas, esta factura se concentra en invierno y en verano baja a casi nada. El coste del gas depende menos de la producción que del transporte y de los impuestos de cada país.",
  ],
  "gafas-graduadas": [
    "Montura graduada con cristales orgánicos antirreflejantes de gama media, montaje incluido. No incluye cristales progresivos, tratamientos especiales ni la revisión optométrica, que en algunos países se cobra aparte.",
    "Es el producto donde la diferencia entre comprar en óptica y comprar por internet es mayor: el mismo tipo de cristal puede costar la mitad. Lo que se paga de más en la óptica es la graduación presencial y el ajuste de la montura, no el cristal.",
  ],
  "implante-dental": [
    "Precio orientativo de un implante unitario con corona, que es la parte visible del tratamiento. No incluye el injerto de hueso ni la elevación de seno, que en muchos casos son necesarios y pueden añadir más que el propio implante.",
    "La horquilla entre clínicas es enorme y no siempre por la calidad de la pieza: influye el cirujano, la ciudad y si el tratamiento se hace en varias sedes. Pedir dos presupuestos no es desconfianza, es la norma en este sector.",
  ],
  "sesion-psicologo": [
    "Una sesión individual de 50 a 60 minutos con un psicólogo sanitario privado, sin seguro de por medio. No incluye la primera entrevista, que muchas consultas cobran aparte, ni el tratamiento completo: una terapia media son entre ocho y veinte sesiones.",
    "El precio depende de la ciudad y de la experiencia del profesional más que de la corriente terapéutica. En algunos países la sanidad pública cubre parte de la terapia con lista de espera, y eso cambia por completo el coste real de tratarse.",
  ],
  "seguro-salud": [
    "Póliza individual completa, sin copago en las consultas, para un adulto de entre 30 y 40 años. El precio que se paga de verdad depende de la edad, de las enfermedades previas y de si se contrata con o sin dental.",
    "La prima sube con los años y con el uso: quien contrata joven y sano paga menos, y quien espera a tener un problema puede encontrar exclusiones. Es el producto del catálogo donde el precio anunciado y el precio final más se separan.",
  ],
  "guarderia-mes": [
    "Cuota mensual de una guardería privada para un niño de 0 a 3 años, con jornada completa y comedor según el centro. No incluye matrícula, material ni las horas extra, que suelen cobrarse aparte.",
    "En muchos países existen plazas públicas o ayudas por hijo que reducen el coste a una fracción, y esa es la diferencia real entre países: no el precio de la privada, sino cuántas familias consiguen plaza pública. La cifra de esta ficha es la privada, sin ayudas.",
  ],
  "master": [
    "Precio orientativo de un máster universitario de un año, en una universidad pública o privada según el país. No incluye tasas administrativas, material ni el coste de vivir durante el curso, que para quien se muda pesa más que la matrícula.",
    "La horquilla es enorme: un máster oficial en una universidad pública europea puede costar menos que un trimestre de una privada. El precio no mide la calidad del programa, pero sí cuánto tarda en recuperarse la inversión con el sueldo del país.",
  ],
};

/** Devuelve la nota del producto, o null si no tiene (no se rellena con relleno). */
export function notaProducto(id: string): string[] | null {
  const nota = NOTAS_PRODUCTO[id];
  return nota && nota.length > 0 ? nota : null;
}
