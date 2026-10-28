import { getInitials, normalizeAddress, normalizeText } from "@/utils/text";

test.each([
  ["João ÁLVARES", "joao alvares"],
  ["Ciências e educação", "ciencias e educacao"],
  ["  São  Paulo  ", "  sao  paulo  "],
  ["東京 123", "東京 123"],
  ["", ""],
])("normaliza texto sem alterar espaços: %j", (input, expected) => {
  expect(normalizeText(input)).toBe(expected);
});

test.each([
  [undefined, ""],
  ["  Praça da Sé  ", "praca da se"],
  ["   ", ""],
])("normaliza endereços opcionais: %j", (input, expected) => {
  expect(normalizeAddress(input)).toBe(expected);
});

test.each([
  ["  Maria   Silva Santos ", "MS"],
  ["João", "J"],
  ["ana costa", "ac"],
  ["", ""],
  ["   ", ""],
])("obtém iniciais dos dois primeiros nomes: %j", (input, expected) => {
  expect(getInitials(input)).toBe(expected);
});
