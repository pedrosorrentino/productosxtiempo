import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";

export interface TimeStream3DProps {
  workdays?: number;
  hours?: number;
  yearsFullPay?: number;
  salaryPct?: number | null;
  userAge?: number | null;
  retirementAge?: number;
  productName?: string;
  class?: string;
}

/**
 * Genera una textura procedimental para partículas DETALLADAS y NÍTIDAS:
 * Núcleo sólido y borde definido de alta precisión (sin difuminado excesivo).
 */
function createCrispSprite(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  // Disco central sólido y nítido tipo estrella / orbe definido
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.38, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.58, "rgba(255, 255, 255, 0.90)");
  gradient.addColorStop(0.72, "rgba(255, 255, 255, 0.30)");
  gradient.addColorStop(0.86, "rgba(255, 255, 255, 0.0)");
  gradient.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Genera una textura procedimental para partículas DIFUMINADAS de fondo:
 * Halo vaporoso, suave y etéreo tipo nube de gas cósmico.
 */
function createDiffuseSprite(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  // Caída suave y vaporosa con amplio halo difuminado
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 0.70)");
  gradient.addColorStop(0.22, "rgba(255, 255, 255, 0.45)");
  gradient.addColorStop(0.50, "rgba(255, 255, 255, 0.18)");
  gradient.addColorStop(0.78, "rgba(255, 255, 255, 0.04)");
  gradient.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Genera la textura del halo / corona de acreción del agujero negro en alta resolución (512x512):
 * Integra el anillo fotónico hiperbrillante, el anillo de Einstein y el halo de acreción cósmica
 * en un único mapa radial perfectamente suavizado y filtrado por GPU (sin aliasing ni parpadeo).
 */
function createBlackHoleHaloTexture(): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const center = size / 2;
  // Radio del horizonte (~108px para HOLE_RADIUS = 0.34 en un plano de 1.6 x 1.6)
  const gradient = ctx.createRadialGradient(center, center, 96, center, center, 256);
  gradient.addColorStop(0.00, "rgba(0, 0, 0, 0.0)");
  gradient.addColorStop(0.05, "rgba(255, 255, 255, 0.0)");
  gradient.addColorStop(0.08, "rgba(255, 255, 255, 0.98)"); // Anillo fotónico hiperbrillante nítido
  gradient.addColorStop(0.12, "rgba(255, 238, 170, 0.92)"); // Lente gravitacional oro/platino
  gradient.addColorStop(0.20, "rgba(255, 175, 45, 0.65)");  // Anillo de Einstein ámbar radiante
  gradient.addColorStop(0.40, "rgba(255, 110, 18, 0.32)");  // Hálito de acreción térmica
  gradient.addColorStop(0.68, "rgba(255, 45, 8, 0.09)");    // Radiación cósmica difuminada
  gradient.addColorStop(1.00, "rgba(200, 20, 0, 0.0)");     // Disipación total en el vacío

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

interface StreamParticle {
  progress: number; // 0.0 (izquierda) a 1.0 (dentro del agujero negro)
  speed: number;
  startOffset: THREE.Vector3;
  curveAmp: number;
  curveFreq: number;
  rotSpeed: number;
  angleOffset: number;
}

/**
 * Normaliza el coste en jornadas de trabajo a un índice perceptivo de intensidad cósmica (0.12 a 1.0):
 * - Microcostes (café, billete metro, minutos a <1h): ~0.12 - 0.22 (hilo mínimo, agujero negro relajado)
 * - Costes cotidianos / moderados (suscripciones, ropa, cenas, 1h-16h): ~0.25 - 0.50 (flujo continuo equilibrado)
 * - Costes considerables (smartphone, vacaciones, electrodomésticos, 3-20 días): ~0.55 - 0.80 (río denso y rápido)
 * - Grandes desembolsos (coche, hipoteca, meses/años de trabajo): ~0.85 - 1.0 (torrente masivo, vórtice voraz)
 */
function computeCostIntensity(workdays: number): number {
  if (!workdays || workdays <= 0.01) return 0.12;
  // Escala logarítmica base 10 normalizada desde 0.01 jornadas (~5 min) hasta 100 jornadas (~5 meses)
  const normalized = (Math.log10(Math.max(0.01, workdays)) + 2.0) / 4.0;
  return Math.max(0.12, Math.min(1.0, normalized));
}

/**
 * Calcula la física cinemática de una partícula en la corriente:
 * Ondulaciones fluidas armónicas + succión en vórtice espiral hacia el agujero negro.
 */
function computeStreamTrajectory(
  t: number,
  time: number,
  s: StreamParticle,
  centerLeft: THREE.Vector3,
  targetHolePos: THREE.Vector3,
  costIntensity: number,
  outPos: { x: number; y: number; z: number },
  outCol: { r: number; g: number; b: number }
) {
  if (t <= 0 || t >= 1.0) {
    outPos.x = targetHolePos.x;
    outPos.y = targetHolePos.y;
    outPos.z = targetHolePos.z;
    outCol.r = 0;
    outCol.g = 0;
    outCol.b = 0;
    return;
  }

  const startX = centerLeft.x + s.startOffset.x;
  const startY = centerLeft.y + s.startOffset.y;
  const startZ = centerLeft.z + s.startOffset.z;

  const endX = targetHolePos.x;
  const endY = targetHolePos.y;
  const endZ = targetHolePos.z;

  // 1. Progresión a lo largo del eje X para el puente cósmico
  let progX: number;
  if (t < 0.20) {
    const u = t / 0.20;
    progX = 0.15 * Math.sin(u * (Math.PI * 0.5));
  } else if (t < 0.65) {
    const u = (t - 0.20) / 0.45;
    progX = 0.15 + u * 0.55;
  } else {
    const u = (t - 0.65) / 0.35;
    progX = 0.70 + 0.30 * (1.0 - Math.pow(1.0 - u, 1.6));
  }
  let curX = THREE.MathUtils.lerp(startX, endX, progX);

  // 2. Ondulaciones de turbulencia fluida multiharmónica a lo largo del puente
  const turbScale = 0.7 + costIntensity * 0.35;
  const bridgeDamp = Math.max(0.0, 1.0 - Math.pow(Math.max(0.0, (t - 0.55) / 0.30), 2.0));

  const macroWaveY = Math.sin(t * Math.PI * s.curveFreq + time * 1.2 + s.angleOffset) * (s.curveAmp * turbScale);
  const microTurbY = Math.cos(t * 7.5 - time * 1.8 + s.angleOffset * 1.5) * (s.curveAmp * 0.18 * turbScale);
  const waveY = (macroWaveY + microTurbY) * bridgeDamp;

  const macroWaveZ = Math.cos(t * Math.PI * s.curveFreq + time * 1.0 + s.angleOffset) * (s.curveAmp * 0.45 * turbScale);
  const microTurbZ = Math.sin(t * 6.0 + time * 1.5 + s.angleOffset * 1.2) * (s.curveAmp * 0.14 * turbScale);
  const waveZ = (macroWaveZ + microTurbZ) * bridgeDamp;

  let curY = THREE.MathUtils.lerp(startY, endY, progX) + waveY;
  let curZ = THREE.MathUtils.lerp(startZ, endZ, progX) + waveZ;

  // 3. Captura gravitatoria y vórtice de acreción orbital 3D continuo (t > 0.65)
  // Las partículas entran visiblemente POR DELANTE del agujero negro como un embudo cósmico
  // que espirala directamente hacia el centro de la singularidad.
  if (t > 0.65) {
    const pullT = (t - 0.65) / 0.35; // 0.0 a 1.0 hacia el centro

    // Ángulo orbital suave: arranca en Math.PI (lado izquierdo, dirección natural de llegada)
    const spinTurns = 1.3 + costIntensity * 0.5;
    const orbitAngle = Math.PI + pullT * Math.PI * 2.0 * spinTurns + s.angleOffset * 0.3 + time * 0.60;

    // Radio de espiral que decae suavemente hacia el centro del agujero negro (0.0)
    const spiralRadius = (1.0 - Math.pow(pullT, 1.15)) * (0.65 + costIntensity * 0.35);

    // Embudo tridimensional hacia la boca frontal del agujero negro:
    // Las partículas avanzan en el espacio Z frontal (+0.45) y descienden hacia z=0 en el núcleo
    const funnelZ = Math.pow(1.0 - pullT, 1.4) * 0.45;

    const swirlX = endX + Math.cos(orbitAngle) * spiralRadius;
    const swirlY = endY + Math.sin(orbitAngle) * spiralRadius * 0.85;
    const swirlZ = endZ + funnelZ + Math.sin(orbitAngle) * (spiralRadius * 0.12);

    // Fusión suave desde la trayectoria del puente cósmico hacia el embudo orbital
    const blend = Math.sin(pullT * Math.PI * 0.5);
    curX = THREE.MathUtils.lerp(curX, swirlX, blend);
    curY = THREE.MathUtils.lerp(curY, swirlY, blend);
    curZ = THREE.MathUtils.lerp(curZ, swirlZ, blend);
  }

  outPos.x = curX;
  outPos.y = curY;
  outPos.z = curZ;

  // 4. Color y física térmica relativista según el valor del producto:
  // - PRODUCTOS ECONÓMICOS: Plasma frío/noble (cian menta -> azul zafiro -> oro etéreo).
  // - PRODUCTOS CAROS: Fricción gravitatoria extrema e ionización térmica (cian eléctrico -> oro solar -> magma ardiente).
  let coolR: number, coolG: number, coolB: number;
  if (t < 0.50) {
    const u = t / 0.50;
    coolR = 0.0 + 0.22 * u;             // Cian menta (#00f5d4) -> Zafiro celeste (#38b6ff)
    coolG = 0.96 - 0.25 * u;
    coolB = 0.83 + 0.17 * u;
  } else {
    const u = (t - 0.50) / 0.50;
    coolR = 0.22 + 0.78 * u;             // Zafiro celeste (#38b6ff) -> Ámbar dorado etéreo (#ffe58f)
    coolG = 0.71 + 0.19 * u;
    coolB = 1.00 - 0.44 * u;
  }

  let hotR: number, hotG: number, hotB: number;
  if (t < 0.40) {
    const u = t / 0.40;
    hotR = 0.0 + 1.0 * u;               // Cian plasma (#00ffff) -> Oro solar (#ffc820)
    hotG = 1.0 - 0.22 * u;
    hotB = 1.0 - 0.88 * u;
  } else if (t < 0.75) {
    const u = (t - 0.40) / 0.35;
    hotR = 1.0;                         // Oro solar (#ffc820) -> Naranja plasma (#ff5814)
    hotG = 0.78 - 0.43 * u;
    hotB = 0.12 - 0.04 * u;
  } else {
    const u = (t - 0.75) / 0.25;
    hotR = 1.0;                         // Naranja plasma (#ff5814) -> Magma incandescente (#ff1804)
    hotG = 0.35 - 0.26 * u;
    hotB = 0.08 - 0.06 * u;
  }

  // Mezcla térmica continua según el coste del objeto
  const heatFactor = Math.pow(costIntensity, 0.85);
  const baseR = THREE.MathUtils.lerp(coolR, hotR, heatFactor);
  const baseG = THREE.MathUtils.lerp(coolG, hotG, heatFactor);
  const baseB = THREE.MathUtils.lerp(coolB, hotB, heatFactor);

  // Nacimiento progresivo y suave entre t=0.0 y t=0.15 (cero pops al nacer)
  const birthFade = t < 0.15 ? Math.sin((t / 0.15) * (Math.PI * 0.5)) : 1.0;

  // Extinción suave al cruzar la boca del agujero negro hacia el centro (t=0.88 a t=0.98)
  const deathFade = t > 0.88 ? Math.max(0.0, Math.pow((0.98 - t) / 0.10, 1.3)) : 1.0;

  // Luminosidad constante, nítida y pura sin oscilaciones estroboscópicas ni parpadeos
  const intensity = (1.35 + costIntensity * 0.55) * birthFade * deathFade;

  outCol.r = baseR * intensity;
  outCol.g = baseG * intensity;
  outCol.b = baseB * intensity;
}

export default function TimeStream3D({
  workdays = 1,
  hours = 8,
  yearsFullPay: _yearsFullPay = 0,
  salaryPct: _salaryPct = 0,
  productName = "este producto",
  class: className = "",
}: TimeStream3DProps) {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const workdaysRef = useRef(workdays);
  workdaysRef.current = workdays;

  const hoursRef = useRef(hours);
  hoursRef.current = hours;

  const prodNameRef = useRef(productName);
  prodNameRef.current = productName;

  // Seguimiento del cambio de producto para disparar la ola de transición fluida
  const prevProdRef = useRef(productName);
  const transitionTriggerRef = useRef(false);

  if (prevProdRef.current !== productName) {
    prevProdRef.current = productName;
    transitionTriggerRef.current = true;
  }

  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true, // Mismo fondo que la web
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Iluminación ambiental y puntual
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLightRight = new THREE.PointLight(0xffb020, 4.0, 10);
    pointLightRight.position.set(3.2, 0.5, 2.0);
    scene.add(pointLightRight);

    const pointLightLeft = new THREE.PointLight(0x00f5d4, 4.0, 10);
    pointLightLeft.position.set(-3.2, 0, 2.0);
    scene.add(pointLightLeft);

    const crispTexture = createCrispSprite();
    const diffuseTexture = createDiffuseSprite();

    // =========================================================================
    // 1. LADO IZQUIERDO: NEBULOSA MIXTA (PARTÍCULAS DETALLADAS + DIFUMINADAS)
    // =========================================================================
    // Mezcla de estrellas y chispas nítidas y detalladas con nubes suaves difuminadas
    const CRISP_COUNT = 340;   // Partículas nítidas, definidas y brillantes
    const DIFFUSE_COUNT = 200; // Partículas difuminadas y vaporosas de gas
    const TOTAL_NEBULA_COUNT = CRISP_COUNT + DIFFUSE_COUNT; // 540 en total

    const crispPositions = new Float32Array(CRISP_COUNT * 3);
    const crispColors = new Float32Array(CRISP_COUNT * 3);

    const diffusePositions = new Float32Array(DIFFUSE_COUNT * 3);
    const diffuseColors = new Float32Array(DIFFUSE_COUNT * 3);

    // Parámetros orbitales para cada partícula (tipo nebulosa cósmica volumétrica)
    const orbitData: {
      radius: number;
      angle: number;
      speed: number;
      eccentricity: number;
      argPeriapsis: number;
      inclination: number;
      yOffset: number;
      pulseSpeed: number;
      verticalAmp: number;
    }[] = [];

    const centerLeft = new THREE.Vector3(-3.2, 0, 0);

    const cNeonCyan = new THREE.Color(0x00ffff);      // Cian neón de alta energía
    const cPhosphor = new THREE.Color(0x2effa0);      // Verde fósforo radiante
    const cElectricBlue = new THREE.Color(0x38b6ff);  // Azul eléctrico
    const cStarlight = new THREE.Color(0xffffff);      // Diamante blanco puro
    const cGoldSpark = new THREE.Color(0xffdd55);      // Destello oro solar

    const cDiffuseTeal = new THREE.Color(0x00d2b8);   // Gas cian profundo
    const cDiffuseSky = new THREE.Color(0x2588f0);    // Vapor azul etéreo
    const cDiffuseEmerald = new THREE.Color(0x18b874);// Hálito esmeralda

    for (let i = 0; i < TOTAL_NEBULA_COUNT; i++) {
      const isCrisp = i < CRISP_COUNT;

      // Las partículas detalladas tienen radio más recogido; las difuminadas forman el halo exterior
      const radius = isCrisp
        ? 0.35 + Math.pow(Math.random(), 1.25) * 1.55
        : 0.40 + Math.pow(Math.random(), 1.1) * 1.85;

      const angle = Math.random() * Math.PI * 2;
      const speed = isCrisp ? 0.5 + Math.random() * 0.9 : 0.3 + Math.random() * 0.6;
      const eccentricity = 0.05 + Math.random() * 0.22;
      const argPeriapsis = Math.random() * Math.PI * 2;
      const inclination = (Math.random() - 0.5) * 1.2;
      const yOffset = (Math.random() - 0.5) * 4.4;
      const verticalAmp = isCrisp ? 0.08 + Math.random() * 0.16 : 0.15 + Math.random() * 0.25;
      const pulseSpeed = 0.8 + Math.random() * 1.8;

      orbitData.push({
        radius,
        angle,
        speed,
        eccentricity,
        argPeriapsis,
        inclination,
        yOffset,
        pulseSpeed,
        verticalAmp,
      });

      if (isCrisp) {
        // Colores de alta definición, nítidos y con destellos de diamantes blancos
        let chosenColor: THREE.Color;
        let boost = 2.2;

        if (i % 10 === 0) {
          chosenColor = cStarlight;
          boost = 2.8; // Estrellas diamantes ultra-brillantes y detalladas
        } else if (i % 7 === 0) {
          chosenColor = cGoldSpark;
          boost = 2.4;
        } else if (i % 3 === 0) {
          chosenColor = cNeonCyan;
          boost = 2.3;
        } else if (i % 3 === 1) {
          chosenColor = cPhosphor;
          boost = 2.2;
        } else {
          chosenColor = cElectricBlue;
          boost = 2.2;
        }

        crispColors[i * 3] = chosenColor.r * boost;
        crispColors[i * 3 + 1] = chosenColor.g * boost;
        crispColors[i * 3 + 2] = chosenColor.b * boost;
      } else {
        // Colores de vapor difuminado (halo cósmico de menor intensidad)
        const j = i - CRISP_COUNT;
        const diffuseCol = j % 3 === 0 ? cDiffuseTeal : j % 3 === 1 ? cDiffuseSky : cDiffuseEmerald;
        const boost = 1.35;

        diffuseColors[j * 3] = diffuseCol.r * boost;
        diffuseColors[j * 3 + 1] = diffuseCol.g * boost;
        diffuseColors[j * 3 + 2] = diffuseCol.b * boost;
      }
    }

    // Capa de estrellas nítidas y detalladas
    const crispGeo = new THREE.BufferGeometry();
    crispGeo.setAttribute("position", new THREE.BufferAttribute(crispPositions, 3));
    crispGeo.setAttribute("color", new THREE.BufferAttribute(crispColors, 3));

    const crispMat = new THREE.PointsMaterial({
      size: 0.28,
      map: crispTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const crispPoints = new THREE.Points(crispGeo, crispMat);
    rootGroup.add(crispPoints);

    // Capa de gas y vapor difuminado
    const diffuseGeo = new THREE.BufferGeometry();
    diffuseGeo.setAttribute("position", new THREE.BufferAttribute(diffusePositions, 3));
    diffuseGeo.setAttribute("color", new THREE.BufferAttribute(diffuseColors, 3));

    const diffuseMat = new THREE.PointsMaterial({
      size: 0.58,
      map: diffuseTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const diffusePoints = new THREE.Points(diffuseGeo, diffuseMat);
    rootGroup.add(diffusePoints);

    // =========================================================================
    // 2. CORRIENTE DE NAVEGACIÓN MIXTA (DETALLADAS + DIFUMINADAS HACIA EL CUBO)
    // =========================================================================
    // Mezcla de partículas nítidas y detalladas con motas difuminadas en el flujo
    const STREAM_CRISP_COUNT = 100;   // Partículas nítidas y definidas
    const STREAM_DIFFUSE_COUNT = 60;  // Partículas difuminadas y vaporosas
    const STREAM_COUNT = STREAM_CRISP_COUNT + STREAM_DIFFUSE_COUNT; // 160 en total

    const streamCrispPositions = new Float32Array(STREAM_CRISP_COUNT * 3);
    const streamCrispColors = new Float32Array(STREAM_CRISP_COUNT * 3);

    const streamDiffusePositions = new Float32Array(STREAM_DIFFUSE_COUNT * 3);
    const streamDiffuseColors = new Float32Array(STREAM_DIFFUSE_COUNT * 3);

    const streamData: StreamParticle[] = [];

    for (let i = 0; i < STREAM_COUNT; i++) {
      const progress = Math.random();
      const speed = 0.0018 + Math.random() * 0.0026;
      const startOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 3.2, // Partículas de vida naciendo a lo largo de toda la altura de la nebulosa
        (Math.random() - 0.5) * 0.7
      );
      const curveAmp = 0.28 + Math.random() * 0.45;
      const curveFreq = 1.0 + Math.random() * 1.4;
      const rotSpeed = 2.0 + Math.random() * 4.0;
      const angleOffset = Math.random() * Math.PI * 2;

      streamData.push({
        progress,
        speed,
        startOffset,
        curveAmp,
        curveFreq,
        rotSpeed,
        angleOffset,
      });
    }

    // Capa de corriente nítida y detallada
    const streamCrispGeo = new THREE.BufferGeometry();
    streamCrispGeo.setAttribute("position", new THREE.BufferAttribute(streamCrispPositions, 3));
    streamCrispGeo.setAttribute("color", new THREE.BufferAttribute(streamCrispColors, 3));

    const streamCrispMat = new THREE.PointsMaterial({
      size: 0.28, // Tamaño proporcionado al horizonte de sucesos
      map: crispTexture, // Nítidas y bien definidas en su trayecto
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false, // Desactivado para evitar recortes bruscos o parpadeos z-buffer
    });
    const streamCrispPoints = new THREE.Points(streamCrispGeo, streamCrispMat);
    streamCrispPoints.renderOrder = 5; // Renderiza visiblemente POR DELANTE del disco del agujero negro
    rootGroup.add(streamCrispPoints);

    // Capa de corriente difuminada y vaporosa
    const streamDiffuseGeo = new THREE.BufferGeometry();
    streamDiffuseGeo.setAttribute("position", new THREE.BufferAttribute(streamDiffusePositions, 3));
    streamDiffuseGeo.setAttribute("color", new THREE.BufferAttribute(streamDiffuseColors, 3));

    const streamDiffuseMat = new THREE.PointsMaterial({
      size: 0.40, // Vapor cósmico contenido que no sobresale al absorberse
      map: diffuseTexture, // Difuminadas, suaves y gaseosas
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const streamDiffusePoints = new THREE.Points(streamDiffuseGeo, streamDiffuseMat);
    streamDiffusePoints.renderOrder = 4; // Renderiza visiblemente POR DELANTE del disco del agujero negro
    rootGroup.add(streamDiffusePoints);

    // =========================================================================
    // 2b. MINI RASTROS SUTILES (SOLO ALGUNAS PARTÍCULAS ALEATORIAS)
    // =========================================================================
    // Solo un número selecto de partículas dispersas (~12) deja una micro-estela delicada
    const TRAIL_LEADER_COUNT = 12;
    const TRAIL_STEPS = 2; // Solo 2 micro-pasos sutiles (muy ligero, no pesado)
    const TRAIL_TOTAL = TRAIL_LEADER_COUNT * TRAIL_STEPS;

    // Distribuir los índices de líderes aleatoriamente a lo largo de toda la corriente
    const trailLeaderIndices: number[] = [];
    const spacing = Math.floor(STREAM_COUNT / TRAIL_LEADER_COUNT);
    for (let k = 0; k < TRAIL_LEADER_COUNT; k++) {
      const randOffset = Math.floor(Math.random() * (spacing - 1));
      trailLeaderIndices.push(Math.min(STREAM_COUNT - 1, k * spacing + randOffset));
    }

    const trailPositions = new Float32Array(TRAIL_TOTAL * 3);
    const trailColors = new Float32Array(TRAIL_TOTAL * 3);

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));

    const trailMat = new THREE.PointsMaterial({
      size: 0.13, // Micro-estela vaporosa y suave
      map: diffuseTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    trailPoints.renderOrder = 4; // Renderiza POR DELANTE del disco del agujero negro
    rootGroup.add(trailPoints);

    // =========================================================================
    // 3. LADO DERECHO: AGUJERO NEGRO ABSORBENTE (CÍRCULO NEGRO CON ANILLO FOTÓNICO)
    // =========================================================================
    const holeGroup = new THREE.Group();
    holeGroup.position.set(3.2, 0, 0);
    rootGroup.add(holeGroup);

    // Radio del círculo negro pequeño
    const HOLE_RADIUS = 0.34;

    // 3a. Horizonte de sucesos frontal (Fondo negro puro sobre el que las partículas entran por delante)
    const horizonCircleGeo = new THREE.CircleGeometry(HOLE_RADIUS, 96);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: false,
    });
    const horizonCircleMesh = new THREE.Mesh(horizonCircleGeo, horizonMat);
    horizonCircleMesh.renderOrder = 2; // Fondo del agujero negro (las partículas cruzan por delante hacia el núcleo)
    holeGroup.add(horizonCircleMesh);

    // 3b. Esfera oclusora volumétrica interna
    const horizonSphereGeo = new THREE.SphereGeometry(HOLE_RADIUS * 0.98, 32, 32);
    const horizonSphereMesh = new THREE.Mesh(horizonSphereGeo, horizonMat);
    horizonSphereMesh.position.set(0, 0, -0.02);
    horizonSphereMesh.renderOrder = 2;
    holeGroup.add(horizonSphereMesh);

    // 3c. Corona de acreción, anillo fotónico y halo gravitatorio en alta resolución (512x512)
    // Se proyecta sobre un plano filtrado por GPU con AdditiveBlending, eliminando por completo
    // cualquier recorte geométrico, moiré o parpadeo en el perímetro del agujero negro.
    const haloTexture = createBlackHoleHaloTexture();
    const haloGeo = new THREE.PlaneGeometry(1.65, 1.65);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0, -0.001);
    haloMesh.renderOrder = 1; // Halo y corona al fondo
    holeGroup.add(haloMesh);

    // =========================================================================
    // RESPONSIVE & REDIMENSIÓN ROBUSTA: OCUPAR TODO EL ANCHO
    // =========================================================================
    let currentWidth = 0;
    let currentHeight = 0;

    const updateSize = () => {
      if (!wrapper) return;
      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;
      if (w <= 0 || h <= 0) return;

      if (w !== currentWidth || h !== currentHeight) {
        currentWidth = w;
        currentHeight = h;
        camera.aspect = w / h;

        // Frustum horizontal visible exacto en el plano z=0
        const vHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
        const vWidth = vHeight * camera.aspect;

        // Posicionamiento dinámico con margen de seguridad para evitar que los elementos toquen los bordes
        centerLeft.x = -vWidth * 0.28;
        holeGroup.position.x = vWidth * 0.30;

        pointLightLeft.position.x = centerLeft.x;
        pointLightRight.position.x = holeGroup.position.x;

        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(wrapper);
    }

    // Parallax suave con el ratón
    let targetRotY = 0;
    let targetRotX = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = mx * 0.12;
      targetRotX = -my * 0.08;
    };

    wrapper.addEventListener("pointermove", onPointerMove);

    // =========================================================================
    // BUCLE CINEMÁTICO 60/120 FPS
    // =========================================================================
    let animationFrameId: number;

    // Estado dinámico del coste interpolado para transiciones fluidas entre objetos
    let currentCostIntensity = computeCostIntensity(workdaysRef.current);
    let transitionPulse = 0.0;
    let speedRamp = 1.0;
    let lastTime = performance.now() * 0.001;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      updateSize();

      const now = performance.now() * 0.001;
      const dt = Math.min(0.05, Math.max(0.001, now - lastTime));
      lastTime = now;
      const dtFactor = dt / 0.016666; // Normalización a 60 FPS (mismo comportamiento exacto en 60Hz, 120Hz o 144Hz)

      const time = now;

      // 0. Interpolación cinemática fluida del coste del producto y ola de transición
      const targetCostIntensity = computeCostIntensity(workdaysRef.current);
      // Suavizado exponencial orgánico (transición continua de ~1.8s entre productos, sin saltos ni cortes)
      currentCostIntensity += (targetCostIntensity - currentCostIntensity) * (0.032 * dtFactor);

      // Detectar cambio de producto e iniciar aceleración progresiva ("de menos a más velocidad")
      if (transitionTriggerRef.current) {
        transitionTriggerRef.current = false;
        transitionPulse = 1.0;
        speedRamp = 0.35; // Arranca con ritmo pausado y acelera suavemente hacia la velocidad de crucero
      }
      transitionPulse += (0.0 - transitionPulse) * (0.025 * dtFactor);
      speedRamp += (1.0 - speedRamp) * (0.020 * dtFactor); // Aceleración suave en ~2.5 segundos

      // Velocidad de avance de la corriente: modulación continua fluida y controlada
      // Al cambiar a un objeto costoso, acelera progresivamente sin absorber de golpe
      const streamSpeedMultiplier = (0.36 + currentCostIntensity * 0.36) * speedRamp * dtFactor;

      // Caudal de partículas activas en la corriente según el coste:
      // Crece o disminuye de forma gradual y orgánica con currentCostIntensity sin que desaparezcan partículas en vuelo
      const activeCrispCount = Math.max(12, Math.round(STREAM_CRISP_COUNT * (0.12 + currentCostIntensity * 0.88)));
      const activeDiffuseCount = Math.max(6, Math.round(STREAM_DIFFUSE_COUNT * (0.12 + currentCostIntensity * 0.88)));
      const activeTrails = Math.max(2, Math.round(TRAIL_LEADER_COUNT * (0.18 + currentCostIntensity * 0.82)));

      // Parallax inercial cinematográfico
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.05;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.05;

      // Reusable stack structs for zero-allocation loop
      const tempPos = { x: 0, y: 0, z: 0 };
      const tempCol = { r: 0, g: 0, b: 0 };

      // 1a. Animación de las Estrellas y Chispas Detalladas / Nítidas
      const crispPos = crispPoints.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < CRISP_COUNT; i++) {
        const d = orbitData[i];
        const keplerSpeed = (d.speed * 0.005) / Math.pow(d.radius, 0.45);
        d.angle += keplerSpeed;

        const breathing = d.radius + Math.sin(time * d.pulseSpeed * 0.55 + i) * 0.06;
        const currentR = breathing * (1.0 + d.eccentricity * Math.cos(d.angle + d.argPeriapsis));

        const orbitX = Math.cos(d.angle) * currentR;
        const orbitZ = Math.sin(d.angle) * currentR;

        const cosInc = Math.cos(d.inclination);
        const sinInc = Math.sin(d.inclination);

        const driftY = Math.sin(time * d.pulseSpeed * 0.5 + d.angle * 1.5 + i * 0.1) * d.verticalAmp;

        // Marea gravitatoria relativista: la nebulosa se deforma ligeramente hacia el agujero negro con productos caros
        const tidalPullX = Math.max(0, Math.cos(d.angle)) * (0.22 * currentCostIntensity);

        crispPos[i * 3] = centerLeft.x + orbitX + tidalPullX;
        crispPos[i * 3 + 1] = centerLeft.y + d.yOffset + orbitZ * sinInc * 0.4 + driftY;
        crispPos[i * 3 + 2] = centerLeft.z + orbitZ * cosInc * 0.7;
      }
      crispPoints.geometry.attributes.position.needsUpdate = true;

      // 1b. Animación de las Nubes y Vapor Difuminado de la Nebulosa
      const diffusePos = diffusePoints.geometry.attributes.position.array as Float32Array;
      for (let j = 0; j < DIFFUSE_COUNT; j++) {
        const i = CRISP_COUNT + j;
        const d = orbitData[i];
        const keplerSpeed = (d.speed * 0.0035) / Math.pow(d.radius, 0.45); // Deriva más suave para el gas
        d.angle += keplerSpeed;

        const breathing = d.radius + Math.sin(time * d.pulseSpeed * 0.4 + i) * 0.08;
        const currentR = breathing * (1.0 + d.eccentricity * Math.cos(d.angle + d.argPeriapsis));

        const orbitX = Math.cos(d.angle) * currentR;
        const orbitZ = Math.sin(d.angle) * currentR;

        const cosInc = Math.cos(d.inclination);
        const sinInc = Math.sin(d.inclination);

        const driftY = Math.sin(time * d.pulseSpeed * 0.35 + d.angle * 1.2 + j * 0.2) * (d.verticalAmp * 1.4);

        // Deformación de gas estelar por marea gravitacional
        const tidalPullGasX = Math.max(0, Math.cos(d.angle)) * (0.28 * currentCostIntensity);

        diffusePos[j * 3] = centerLeft.x + orbitX + tidalPullGasX;
        diffusePos[j * 3 + 1] = centerLeft.y + d.yOffset + orbitZ * sinInc * 0.5 + driftY;
        diffusePos[j * 3 + 2] = centerLeft.z + orbitZ * cosInc * 0.75;
      }
      diffusePoints.geometry.attributes.position.needsUpdate = true;

      // 2a. Animación de la Corriente Nítida y Detallada (Estrellas en trayectoria hacia el agujero negro)
      const streamCrispPos = streamCrispPoints.geometry.attributes.position.array as Float32Array;
      const streamCrispCol = streamCrispPoints.geometry.attributes.color.array as Float32Array;

      const targetHolePos = holeGroup.position;

      for (let i = 0; i < STREAM_CRISP_COUNT; i++) {
        const s = streamData[i];
        s.progress += s.speed * streamSpeedMultiplier;

        if (s.progress >= 1.0) {
          s.progress = s.progress % 1.0;
        }

        const crispThreshold = i + 1;
        let crispFade = 1.0;
        if (crispThreshold > activeCrispCount) {
          crispFade = 0.0;
        } else if (crispThreshold > activeCrispCount - 4) {
          crispFade = (activeCrispCount - crispThreshold + 1) / 4.0;
        }

        if (crispFade > 0.0) {
          computeStreamTrajectory(s.progress, time, s, centerLeft, targetHolePos, currentCostIntensity, tempPos, tempCol);

          streamCrispPos[i * 3] = tempPos.x;
          streamCrispPos[i * 3 + 1] = tempPos.y;
          streamCrispPos[i * 3 + 2] = tempPos.z;

          streamCrispCol[i * 3] = tempCol.r * crispFade;
          streamCrispCol[i * 3 + 1] = tempCol.g * crispFade;
          streamCrispCol[i * 3 + 2] = tempCol.b * crispFade;
        } else {
          streamCrispPos[i * 3] = targetHolePos.x;
          streamCrispPos[i * 3 + 1] = targetHolePos.y;
          streamCrispPos[i * 3 + 2] = targetHolePos.z;

          streamCrispCol[i * 3] = 0;
          streamCrispCol[i * 3 + 1] = 0;
          streamCrispCol[i * 3 + 2] = 0;
        }
      }
      streamCrispPoints.geometry.attributes.position.needsUpdate = true;
      streamCrispPoints.geometry.attributes.color.needsUpdate = true;

      // 2b. Animación de la Corriente Difuminada (Nubes suaves de energía hacia el agujero negro)
      const streamDiffusePos = streamDiffusePoints.geometry.attributes.position.array as Float32Array;
      const streamDiffuseCol = streamDiffusePoints.geometry.attributes.color.array as Float32Array;

      for (let j = 0; j < STREAM_DIFFUSE_COUNT; j++) {
        const i = STREAM_CRISP_COUNT + j;
        const s = streamData[i];
        s.progress += s.speed * streamSpeedMultiplier;

        if (s.progress >= 1.0) {
          s.progress = s.progress % 1.0;
        }

        const diffuseThreshold = j + 1;
        let diffuseFade = 1.0;
        if (diffuseThreshold > activeDiffuseCount) {
          diffuseFade = 0.0;
        } else if (diffuseThreshold > activeDiffuseCount - 3) {
          diffuseFade = (activeDiffuseCount - diffuseThreshold + 1) / 3.0;
        }

        if (diffuseFade > 0.0) {
          computeStreamTrajectory(s.progress, time, s, centerLeft, targetHolePos, currentCostIntensity, tempPos, tempCol);

          streamDiffusePos[j * 3] = tempPos.x;
          streamDiffusePos[j * 3 + 1] = tempPos.y;
          streamDiffusePos[j * 3 + 2] = tempPos.z;

          const diffuseScale = 0.88 * diffuseFade;
          streamDiffuseCol[j * 3] = tempCol.r * diffuseScale;
          streamDiffuseCol[j * 3 + 1] = tempCol.g * diffuseScale;
          streamDiffuseCol[j * 3 + 2] = tempCol.b * diffuseScale;
        } else {
          streamDiffusePos[j * 3] = targetHolePos.x;
          streamDiffusePos[j * 3 + 1] = targetHolePos.y;
          streamDiffusePos[j * 3 + 2] = targetHolePos.z;

          streamDiffuseCol[j * 3] = 0;
          streamDiffuseCol[j * 3 + 1] = 0;
          streamDiffuseCol[j * 3 + 2] = 0;
        }
      }
      streamDiffusePoints.geometry.attributes.position.needsUpdate = true;
      streamDiffusePoints.geometry.attributes.color.needsUpdate = true;

      // 2c. Animación de los Mini Rastros Sutiles (Solo partículas aleatorias seleccionadas)
      const trailPos = trailPoints.geometry.attributes.position.array as Float32Array;
      const trailCol = trailPoints.geometry.attributes.color.array as Float32Array;
      const trailFadeFactors = [0.28, 0.10]; // Resplandor muy sutil y suave

      for (let idx = 0; idx < TRAIL_LEADER_COUNT; idx++) {
        const streamIdx = trailLeaderIndices[idx];
        const s = streamData[streamIdx];
        const isTrailActive = idx < activeTrails;

        for (let k = 0; k < TRAIL_STEPS; k++) {
          const trailStep = k + 1;
          // Estela que se alarga por estiramiento de marea según la intensidad del producto
          const trailSpacing = 0.005 + currentCostIntensity * 0.005;
          const trailT = s.progress - trailStep * trailSpacing;
          const trailPtIdx = (idx * TRAIL_STEPS + k) * 3;

          if (isTrailActive && trailT > 0.0 && trailT < 1.0) {
            computeStreamTrajectory(trailT, time - trailStep * 0.015, s, centerLeft, targetHolePos, currentCostIntensity, tempPos, tempCol);

            trailPos[trailPtIdx] = tempPos.x;
            trailPos[trailPtIdx + 1] = tempPos.y;
            trailPos[trailPtIdx + 2] = tempPos.z;

            // Factor de resplandor ionizado que se intensifica en productos costosos
            const factor = trailFadeFactors[k] * (0.65 + currentCostIntensity * 0.70);
            trailCol[trailPtIdx] = tempCol.r * factor;
            trailCol[trailPtIdx + 1] = tempCol.g * factor;
            trailCol[trailPtIdx + 2] = tempCol.b * factor;
          } else {
            trailPos[trailPtIdx] = targetHolePos.x;
            trailPos[trailPtIdx + 1] = targetHolePos.y;
            trailPos[trailPtIdx + 2] = targetHolePos.z;

            trailCol[trailPtIdx] = 0;
            trailCol[trailPtIdx + 1] = 0;
            trailCol[trailPtIdx + 2] = 0;
          }
        }
      }
      trailPoints.geometry.attributes.position.needsUpdate = true;
      trailPoints.geometry.attributes.color.needsUpdate = true;

      // 3. Animación del Agujero Negro y Corona Gravitatoria
      // Levitación cósmica sutil en el eje Y
      holeGroup.position.y = Math.sin(time * 0.9) * 0.05;

      // Escala del horizonte ligada al coste del producto:
      // Como referencia, el tamaño actual (~1.15) es cuando absorbe muchas partículas (artículos caros).
      // Cuando absorbe menos partículas (artículos baratos), el diámetro es notablemente más pequeño (~0.52).
      // Transición fluida continua y orgánica mediante suavizado exponencial sin jittering de píxeles.
      const baseHoleScale = 0.44 + currentCostIntensity * 0.71;
      const holeScale = baseHoleScale * (1.0 + transitionPulse * 0.03);

      horizonCircleMesh.scale.set(holeScale, holeScale, 1);
      horizonSphereMesh.scale.set(holeScale, holeScale, holeScale);

      // El halo cósmico (anillo fotónico y corona de acreción) se expande con el horizonte
      haloMesh.scale.set(holeScale, holeScale, 1);
      haloMat.opacity = 0.45 + currentCostIntensity * 0.50;

      // Iluminación puntual derecha reactiva y temperatura estelar (oro cálido suave -> plasma solar incandescente)
      pointLightRight.intensity = 1.8 + currentCostIntensity * 3.0;
      pointLightRight.color.setRGB(1.0, 0.88 - currentCostIntensity * 0.28, 0.45 - currentCostIntensity * 0.38);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateSize);
      if (resizeObserver) resizeObserver.disconnect();
      wrapper.removeEventListener("pointermove", onPointerMove);

      crispTexture.dispose();
      diffuseTexture.dispose();
      haloTexture.dispose();
      crispGeo.dispose();
      crispMat.dispose();
      diffuseGeo.dispose();
      diffuseMat.dispose();
      streamCrispGeo.dispose();
      streamCrispMat.dispose();
      streamDiffuseGeo.dispose();
      streamDiffuseMat.dispose();
      trailGeo.dispose();
      trailMat.dispose();
      horizonCircleGeo.dispose();
      horizonSphereGeo.dispose();
      horizonMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      renderer.dispose();
    };
  }, []);

  const daysFormatted = workdays.toFixed(1);
  const hoursFormatted = Math.round(hours);
  const pctFormatted = ((workdays / 240) * 100).toFixed(1);

  // Clasificación visual honesta y calibrada según la magnitud del coste
  const flowConfig =
    workdays < 0.25
      ? { label: "Flujo leve", badgeClass: "text-emerald-400 border-emerald-500/25 bg-emerald-950/40", dotClass: "bg-emerald-400" }
      : workdays < 2.0
        ? { label: "Flujo moderado", badgeClass: "text-[#00f5d4] border-[#00f5d4]/25 bg-[#00f5d4]/10", dotClass: "bg-[#00f5d4]" }
        : workdays < 15.0
          ? { label: "Flujo intenso", badgeClass: "text-[#ffd269] border-[#ffd269]/25 bg-[#ffd269]/10", dotClass: "bg-[#ffd269]" }
          : { label: "Vórtice crítico", badgeClass: "text-error border-error/30 bg-error/15", dotClass: "bg-error" };

  return (
    <div
      class={`w-full overflow-hidden select-none flex flex-col bg-transparent ${className}`}
    >
      {/* Contenedor del Canvas 3D (Altura adaptativa y holgada en móvil y escritorio) */}
      <div
        ref={canvasWrapperRef}
        class="relative w-full overflow-hidden bg-transparent h-[440px] sm:h-[500px] md:h-[560px]"
        style={{ minHeight: "420px" }}
      >
        <canvas
          ref={canvasRef}
          class="block w-full h-full cursor-default"
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/* Barra Superior de Telemetría: Reserva Vital (izq) vs Agujero Negro del Producto (der) */}
        {/* Usa flexbox con separación garantizada para que títulos largos nunca se solapen en móvil */}
        <div class="absolute top-2.5 sm:top-5 left-2.5 sm:left-5 right-2.5 sm:right-5 pointer-events-none flex justify-between items-start gap-2 sm:gap-6 font-board-mono text-xs z-10">
          {/* Rótulo Izquierdo: Tu Reserva Vital */}
          <div class="flex-1 max-w-[48%] sm:max-w-xs min-w-0 flex flex-col gap-0.5">
            <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#00f5d4] shadow-[0_0_12px_#00f5d4] shrink-0" />
              <span
                class="font-signage uppercase tracking-wider text-[11px] sm:text-base text-[#00f5d4] font-bold truncate block"
                title="Tu Reserva Vital"
              >
                Tu Reserva Vital
              </span>
            </div>
            <span class="text-[9px] sm:text-[11px] text-base-content/60 leading-tight truncate hidden xs:block">
              Nebulosa de vida
            </span>
          </div>

          {/* Rótulo Derecho: El Agujero Negro del Producto */}
          <div class="flex-1 max-w-[48%] sm:max-w-xs min-w-0 flex flex-col items-end gap-0.5 text-right">
            <div class="flex items-center justify-end gap-1.5 sm:gap-2 w-full min-w-0">
              <span
                class="font-signage uppercase tracking-wider text-[11px] sm:text-base text-[#ffb020] font-bold truncate block transition-all duration-500"
                title={productName}
              >
                {productName}
              </span>
              <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffb020] shadow-[0_0_12px_#ffb020] shrink-0" />
            </div>
            <span class="text-[9px] sm:text-[11px] text-base-content/60 text-right leading-tight whitespace-nowrap">
              <span class="hidden sm:inline">Agujero negro drena el </span>
              <span class="sm:hidden">Drena el </span>
              <strong class="text-error font-bold">{pctFormatted}%</strong>
              <span class="hidden sm:inline"> del año</span>
              <span class="sm:hidden">/año</span>
            </span>
          </div>
        </div>

        {/* Rótulo Central: Corriente de Extracción Dinámica */}
        {/* En móvil evita saltos de línea antiestéticos; si salta, divide armónicamente etiqueta y valor */}
        <div class="absolute bottom-2.5 sm:bottom-5 left-1/2 -translate-x-1/2 pointer-events-none text-center font-board-mono text-xs w-full px-2 sm:px-3 flex justify-center z-10">
          <div
            class={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-full backdrop-blur-md border shadow-lg inline-flex flex-wrap sm:flex-nowrap items-center justify-center gap-x-2 gap-y-0.5 transition-all duration-700 max-w-[96vw] sm:max-w-none ${flowConfig.badgeClass}`}
          >
            {/* Etiqueta del nivel de flujo (nunca se fragmenta internamente) */}
            <div class="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <span class={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${flowConfig.dotClass} shadow-[0_0_8px_currentColor] shrink-0`} />
              <span class="font-bold tracking-wide uppercase text-[10px] sm:text-[11px]">
                {flowConfig.label}<span class="hidden sm:inline">:</span>
              </span>
            </div>

            {/* Métrica de tiempo absorbido (siempre unida y legible) */}
            <div class="whitespace-nowrap font-medium text-[10px] sm:text-xs text-base-content/90 shrink-0">
              <span class="sm:hidden text-base-content/40 mr-1">·</span>
              <span class="hidden sm:inline">Transfiriendo </span>
              <strong class="text-base-content font-bold">{hoursFormatted} h</strong>{" "}
              <span class="text-base-content/80">({daysFormatted} días)</span>
              <span class="hidden md:inline text-base-content/70"> hacia el vórtice</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
