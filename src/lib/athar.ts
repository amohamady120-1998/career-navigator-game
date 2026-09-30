/**
 * Shared class strings for the Athar prototype look. Utility strings (not CSS
 * component classes) so they override the default Button size/colour utilities.
 */
export const btnPrimary =
  "btn-gradient h-auto gap-2 rounded-xl px-[26px] py-3.5 text-base shadow-premium hover:-translate-y-0.5 hover:shadow-premium-lg";

export const btnOutline =
  "h-auto gap-2 rounded-xl border-border bg-card px-[26px] py-3.5 text-base font-bold text-card-foreground hover:border-muted-foreground/40 hover:bg-card";

/** Western → Arabic-Indic digits for display. */
export const toArabicDigits = (n: number | string) =>
  String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
