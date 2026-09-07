import { describe, it, expect } from "vitest";
import { shareText } from "../src/i18n/es.ts";
import { buildShareUrl } from "../src/lib/urls.ts";

describe("share engine and viral distribution", () => {
  it("builds canonical share URL with valid state parameters", () => {
    const url = buildShareUrl("/espana/toyota-corolla", {
      netMonthly: 2100,
      weeklyHours: 37.5,
    });
    expect(url).toContain("/espana/toyota-corolla");
    expect(url).toContain("neto=2100");
    expect(url).toContain("horas=37.5");
  });

  it("generates i18n share text conforming to SPEC specifications", () => {
    const text = shareText({
      productName: "Toyota Corolla",
      countryName: "España",
      hours: 2500,
      workdays8h: 312.5,
      fullPayPhrase: "14 meses",
      yearsFullPay: 1.16,
      age: 30,
    });

    expect(text).toContain("Toyota Corolla · España");
    expect(text).toContain("jornadas de 8 h");
    expect(text).toContain("precioentiempo.com");
  });

  it("builds correct social intent share URLs", () => {
    const targetUrl = "https://precioentiempo.com/espana/toyota-corolla";
    const message = "Me he quedado a cuadros con este precio";

    const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(targetUrl)}`;
    expect(xIntent).toContain("twitter.com/intent/tweet");
    expect(xIntent).toContain(encodeURIComponent(targetUrl));

    const whatsappIntent = `https://api.whatsapp.com/send?text=${encodeURIComponent(message + "\n\n" + targetUrl)}`;
    expect(whatsappIntent).toContain("api.whatsapp.com/send?text=");

    const telegramIntent = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(message)}`;
    expect(telegramIntent).toContain("t.me/share/url");

    const fbIntent = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}&quote=${encodeURIComponent(message)}`;
    expect(fbIntent).toContain("facebook.com/sharer/sharer.php");
  });

  it("generates compelling viral storytelling with emotional hooks and CTAs", async () => {
    const { generateStorytellingCopy } = await import("../src/lib/storytelling.ts");

    const baseOptions = {
      productName: "iPhone 16",
      countryName: "España",
      price: 959,
      currencySymbol: "€",
      hours: 96,
      workdays8h: 12,
      months: 0.6,
      years: 0.05,
      selectedNetwork: "x" as const,
      includeHashtags: true,
    };

    // 1. Gancho Indignación (Shock)
    const shockCopy = generateStorytellingCopy({ ...baseOptions, viralAngle: "shock", metricFocus: "workdays" });
    expect(shockCopy).toContain("se me ha caído el alma a los pies");
    expect(shockCopy).toContain("iPhone 16");
    expect(shockCopy).toContain("12 jornadas de 8 horas");
    expect(shockCopy).toContain("Descubre cuántas semanas");

    // 2. Gancho Tiempo de Vida (Pepe Mújica)
    const realityCopy = generateStorytellingCopy({ ...baseOptions, viralAngle: "reality", metricFocus: "hours" });
    expect(realityCopy).toContain("Pepe Mújica");
    expect(realityCopy).toContain("96 horas de trabajo real");
    expect(realityCopy).toContain("horas de tu existencia");

    // 3. Gancho Dato Revelador (Curiosity loop)
    const curiosityCopy = generateStorytellingCopy({ ...baseOptions, viralAngle: "curiosity", metricFocus: "months" });
    expect(curiosityCopy).toContain("te cambia la perspectiva");
    expect(curiosityCopy).toContain("0,6 meses enteros de salario mediano");
    expect(curiosityCopy).toContain("Pon tu nómina");

    // 4. Gancho Reto (Community Challenge)
    const challengeCopy = generateStorytellingCopy({ ...baseOptions, viralAngle: "challenge", metricFocus: "workdays" });
    expect(challengeCopy).toContain("Reto para abrir los ojos");
    expect(challengeCopy).toContain("Yo me he quedado helado");

    // 5. Formato WhatsApp con asteriscos de negrita
    const wpCopy = generateStorytellingCopy({ ...baseOptions, viralAngle: "shock", metricFocus: "hours", selectedNetwork: "whatsapp" });
    expect(wpCopy).toContain("*iPhone 16*");
    expect(wpCopy).toContain("*96 horas de trabajo real*");
  });
});
