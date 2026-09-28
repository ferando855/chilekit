import { describe, expect, it } from "vitest";

import { amountToWords, integerToWords, type WordCurrency } from "../src/index.js";

describe("integerToWords", () => {
  it.each([
    [0, "cero"],
    [1, "uno"],
    [15, "quince"],
    [16, "dieciséis"],
    [21, "veintiuno"],
    [22, "veintidós"],
    [26, "veintiséis"],
    [31, "treinta y uno"],
    [100, "cien"],
    [101, "ciento uno"],
    [500, "quinientos"],
    [1000, "mil"],
    [2001, "dos mil uno"],
    [1_000_000, "un millón"],
    [1_000_000_000, "mil millones"],
    [1_000_000_000_000, "un billón"],
  ])("%i -> %s", (value, expected) => {
    expect(integerToWords(value)).toBe(expected);
  });

  it("rejects values outside the supported range", () => {
    expect(() => integerToWords(-1)).toThrow();
    expect(() => integerToWords(1.5)).toThrow();
    expect(() => integerToWords(1e16)).toThrow();
  });
});

describe("amountToWords", () => {
  it.each<[number, WordCurrency, string]>([
    [1, "clp", "un peso"],
    [21, "clp", "veintiún pesos"],
    [101, "clp", "ciento un pesos"],
    [21_000, "clp", "veintiún mil pesos"],
    [1_000_000, "clp", "un millón de pesos"],
    [1_500_000, "clp", "un millón quinientos mil pesos"],
    [21_000_000, "clp", "veintiún millones de pesos"],
    [1_021_001, "clp", "un millón veintiún mil un pesos"],
    [1, "uf", "una unidad de fomento"],
    [21, "uf", "veintiuna unidades de fomento"],
    [200, "uf", "doscientas unidades de fomento"],
    [221_000, "uf", "doscientas veintiuna mil unidades de fomento"],
    // RAE admite "veintiún mil" y "veintiuna mil" ante sustantivo femenino; usamos la
    // femenina, coherente con las centenas. Ver comentario en words.ts.
    [21_000, "uf", "veintiuna mil unidades de fomento"],
    [101_001, "uf", "ciento una mil una unidades de fomento"],
    [21_000, "clp", "veintiún mil pesos"],
    [200_000_000, "uf", "doscientos millones de unidades de fomento"],
    [3.5, "uf", "tres coma cinco unidades de fomento"],
    [0.05, "uf", "cero coma cero cinco unidades de fomento"],
    [3.25, "utm", "tres coma veinticinco unidades tributarias mensuales"],
    [1, "dolar", "un dólar"],
    [1.01, "dolar", "un dólar con un centavo"],
    [1500.75, "dolar", "mil quinientos dólares con setenta y cinco centavos"],
    [2_000_000, "euro", "dos millones de euros"],
    [21, "none", "veintiuno"],
    [-5, "clp", "menos cinco pesos"],
  ])("%d %s -> %s", (amount, currency, expected) => {
    expect(amountToWords(amount, currency).words).toBe(expected);
  });

  it("returns the usual document form", () => {
    expect(amountToWords(1_500_000).legal).toBe("$1.500.000 (un millón quinientos mil pesos)");
    expect(amountToWords(3.5, "uf").legal).toBe("3,5 UF (tres coma cinco unidades de fomento)");
    expect(amountToWords(1500.5, "dolar").legal).toBe(
      "US$1.500,50 (mil quinientos dólares con cincuenta centavos)",
    );
    expect(amountToWords(-5).legal).toBe("-$5 (menos cinco pesos)");
  });

  it("refuses decimals where the currency has none", () => {
    expect(() => amountToWords(1500.5, "clp")).toThrow(/no llevan decimales/);
    expect(() => amountToWords(1.123456, "uf")).toThrow(/4 decimales/);
  });
});
