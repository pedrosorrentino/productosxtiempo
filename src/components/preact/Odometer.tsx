import { useEffect, useState } from "preact/hooks";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

interface OdometerProps {
  /** Cifra ya formateada ("402", "40,2", "1,5"). Los dígitos ruedan; los
   * separadores (",", ".") quedan fijos entre celdas. */
  value: string;
  /** Frase completa para lectores de pantalla ("402 jornadas de 8 h"). */
  label: string;
  class?: string;
}

type Cell =
  | { kind: "digit"; d: number; col: number }
  | { kind: "sep"; ch: string };

const CELL_EM = 1.18; // alto de celda en em (mismo valor que .flap-cell)

/**
 * Odómetro mecánico: cada dígito es una tira vertical de 0-9 dentro de una
 * celda split-flap (crema, costura horizontal). El cambio de valor desliza la
 * tira al dígito nuevo (transform en em + transición CSS).
 *
 * Fases: "ssr" pinta el valor final (sin JS se lee directo del HTML estático);
 * al montar pasa un frame por "primed" (tiras a 0, sin transición) y salta a
 * "revealed", que activa .flap-anim y rueda de 0 al valor UNA vez.
 */
export default function Odometer({ value, label, class: className }: OdometerProps) {
  const [phase, setPhase] = useState<"ssr" | "primed" | "revealed">("ssr");

  useEffect(() => {
    setPhase("primed");
    const raf = requestAnimationFrame(() => setPhase("revealed"));
    return () => cancelAnimationFrame(raf);
  }, []);

  const cells: Cell[] = [];
  let col = 0;
  for (const ch of value) {
    if (/\d/.test(ch)) cells.push({ kind: "digit", d: Number(ch), col: col++ });
    else cells.push({ kind: "sep", ch });
  }

  return (
    <span role="img" aria-label={label} class={`inline-flex items-end ${className ?? ""}`}>
      {cells.map((cell, i) =>
        cell.kind === "digit" ? (
          <span class="flap-cell" key={i}>
            <span
              class={`flap-strip${phase === "revealed" ? " flap-anim" : ""}`}
              style={`transform: translateY(-${(phase === "primed" ? 0 : cell.d) * CELL_EM}em); transition-delay: ${cell.col * 70}ms`}
            >
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span class="flap-sep" key={i}>
            {cell.ch}
          </span>
        ),
      )}
    </span>
  );
}
