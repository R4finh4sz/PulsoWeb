import { z } from "zod";

export const ThemeNameSchema = z.string().trim()
  .min(1, "Informe o nome do tema.")
  .max(40, "O tema deve ter no máximo 40 caracteres.")
  .regex(/\p{L}/u, "O tema deve conter pelo menos uma letra.");
