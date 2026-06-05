import { Playfair_Display, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

// Display — high-contrast classical serif (Didot/Bodoni/Canela lineage).
// Playfair Display has the dramatic thick/hairline stroke contrast we want.
export const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Body — humanist sans with warmth and slightly uneven stroke widths.
export const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Data — premium monospace with optical refinement; tabular numerals.
export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});
