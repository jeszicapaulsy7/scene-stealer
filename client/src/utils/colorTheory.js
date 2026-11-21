// Fashion Color Theory & Outfit Color Harmony Engine

export const FASHION_SWATCHES = [
    { name: "Ivory", hex: "#F5EFE6" },
    { name: "Champagne", hex: "#E6D3B3" },
    { name: "Camel", hex: "#C49A70" },
    { name: "Espresso", hex: "#3B2820" },
    { name: "Jet Black", hex: "#161616" },
    { name: "Slate Grey", hex: "#6E737B" },
    { name: "Burgundy", hex: "#6A1B2E" },
    { name: "Crimson Red", hex: "#B8293D" },
    { name: "Blush Rose", hex: "#E2B2BC" },
    { name: "Terracotta", hex: "#B95C42" },
    { name: "Olive", hex: "#5C6442" },
    { name: "Sage", hex: "#9CAF9A" },
    { name: "Emerald", hex: "#195342" },
    { name: "Navy", hex: "#1C2B4B" },
    { name: "Cobalt", hex: "#2349A8" },
    { name: "Lavender", hex: "#B7A6D4" },
];

export function hexToHsl(hex) {
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
        clean = clean
            .split("")
            .map((c) => c + c)
            .join("");
    }
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h *= 60;
    }

    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

export function hslToHex(h, s, l) {
    const hue = ((h % 360) + 360) % 360;
    const sat = Math.max(0, Math.min(100, s)) / 100;
    const light = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * light - 1)) * sat;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = light - c / 2;
    let r;
    let g;
    let b;

    if (hue < 60) [r, g, b] = [c, x, 0];
    else if (hue < 120) [r, g, b] = [x, c, 0];
    else if (hue < 180) [r, g, b] = [0, c, x];
    else if (hue < 240) [r, g, b] = [0, x, c];
    else if (hue < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    const toHex = (v) =>
        Math.round((v + m) * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function isNeutral(hsl) {
    // Low saturation, very dark, very light, or classic navy/brown/camel neutral zone
    if (hsl.s <= 18 || hsl.l <= 13 || hsl.l >= 91) return true;
    if (hsl.h >= 20 && hsl.h <= 45 && hsl.s <= 45 && (hsl.l <= 30 || hsl.l >= 70)) {
        return true;
    }
    if (hsl.h >= 210 && hsl.h <= 235 && hsl.l <= 24) return true; // classic navy
    return false;
}

function isWarm(hsl) {
    return (hsl.h >= 0 && hsl.h <= 65) || hsl.h >= 315;
}

function hueDistance(h1, h2) {
    const diff = Math.abs(h1 - h2);
    return diff > 180 ? 360 - diff : diff;
}

export function analyzeColorMatch(hexColors) {
    const hsls = hexColors.map(hexToHsl);
    const nonNeutrals = hsls.filter((c) => !isNeutral(c));
    const warmCount = hsls.filter((c) => !isNeutral(c) && isWarm(c)).length;
    const coolCount = nonNeutrals.length - warmCount;

    let jewelryMetal;
    if (nonNeutrals.length === 0) {
        const avgLight = hsls.reduce((acc, c) => acc + c.l, 0) / hsls.length;
        jewelryMetal = avgLight > 55 ? "Warm Gold or Pearls" : "Brushed Gold or Sleek Silver";
    } else if (warmCount > coolCount) {
        jewelryMetal = "Warm Gold or Rose Gold";
    } else if (coolCount > warmCount) {
        jewelryMetal = "Silver, White Gold, or Pearls";
    } else {
        jewelryMetal = "Mixed Metals (Gold & Silver)";
    }

    // Case 1: All neutrals
    if (nonNeutrals.length === 0) {
        const lightnesses = hsls.map((c) => c.l);
        const spread = Math.max(...lightnesses) - Math.min(...lightnesses);
        return {
            score: spread >= 20 ? 96 : 91,
            verdict: "Old Money Neutral Harmony",
            harmonyType: "Timeless Neutrals",
            badge: "EXCELLENT MATCH",
            tip:
                spread >= 20
                    ? "Effortless high-contrast neutral styling. Add texture (silk, wool, or croc-embossed leather) so every piece stands out."
                    : "Soft tonal neutral palette. Introduce one slightly darker or lighter piece (like a belt or bag) for subtle depth.",
            jewelryMetal,
        };
    }

    // Case 2: One statement color anchored by neutrals
    if (nonNeutrals.length === 1) {
        return {
            score: 95,
            verdict: "Editorial Statement Pop",
            harmonyType: "Neutral + Hero Color",
            badge: "EXCELLENT MATCH",
            tip: "Pairing one hero color with clean neutrals is a foolproof styling formula — let the accent piece (heels, bag, or lip) steal focus.",
            jewelryMetal,
        };
    }

    // Compare pairwise hue distances among chromatic colors
    const distances = [];
    for (let i = 0; i < nonNeutrals.length; i++) {
        for (let j = i + 1; j < nonNeutrals.length; j++) {
            distances.push(hueDistance(nonNeutrals[i].h, nonNeutrals[j].h));
        }
    }
    const maxDist = Math.max(...distances);
    const minDist = Math.min(...distances);

    if (maxDist <= 18) {
        return {
            score: 94,
            verdict: "Monochrome Luxe",
            harmonyType: "Monochromatic",
            badge: "GREAT MATCH",
            tip: "Dressing in shades of the same hue elongates your silhouette and looks instantly polished. Mix matte and glossy finishes for dimension.",
            jewelryMetal,
        };
    }

    if (maxDist <= 55) {
        return {
            score: 90,
            verdict: "Soft Analogous Flow",
            harmonyType: "Analogous",
            badge: "GREAT MATCH",
            tip: "Neighboring hues blend smoothly and feel intentional. Keep one color dominant (60%) and use the others as supporting accents.",
            jewelryMetal,
        };
    }

    if (minDist >= 145 && maxDist <= 180) {
        const highSatCount = nonNeutrals.filter((c) => c.s > 68).length;
        return {
            score: highSatCount >= 2 ? 78 : 88,
            verdict: "Bold Complementary Contrast",
            harmonyType: "Complementary",
            badge: highSatCount >= 2 ? "BOLD — STYLE WITH CARE" : "STRONG CONTRAST",
            tip:
                highSatCount >= 2
                    ? "Both shades are vivid opposites. Let one be the main outfit and keep the second smaller (like a mini bag, heels, or lip) grounded with black or ivory."
                    : "Opposite tones create crisp visual drama. Balance the look with neutral shoes or minimal jewelry.",
            jewelryMetal,
        };
    }

    if (minDist >= 100 && maxDist <= 145) {
        return {
            score: 83,
            verdict: "Triadic Editorial Mix",
            harmonyType: "Triadic / Split",
            badge: "STYLISH MATCH",
            tip: "Rich creative pairing! Keep silhouettes clean and structured so the color story feels intentional rather than busy.",
            jewelryMetal,
        };
    }

    // Awkward middle zone (60°–100° with competing saturations)
    const highSat = nonNeutrals.filter((c) => c.s > 55).length;
    if (highSat >= 2) {
        return {
            score: 58,
            verdict: "Competing Tones (Slight Clash)",
            harmonyType: "High-Tension Mix",
            badge: "TRY ADJUSTING",
            tip: "These hues sit at a tricky angle with similar intensity. Soften one into a muted/pastel version, or swap your bag/heels to Ivory, Espresso, or Black to bridge them.",
            jewelryMetal,
        };
    }

    return {
        score: 79,
        verdict: "Muted Editorial Contrast",
        harmonyType: "Soft Contrast",
        badge: "GOOD MATCH",
        tip: "Because these shades are softened/muted, they coexist gracefully. Repeat one tone in your makeup or accessories to tie the whole look together.",
        jewelryMetal,
    };
}

export function generateMatchingPalettes(baseHex) {
    const base = hexToHsl(baseHex);
    const neutralDark = isWarm(base) ? "#2B211B" : "#181A1F";
    const neutralLight = isWarm(base) ? "#F4EDE3" : "#F3F4F6";
    const neutralMid = isWarm(base) ? "#C49A70" : "#8E939D";

    const palettes = [
        {
            name: "Effortless Neutrals",
            subtitle: "Timeless everyday pairing — works for heels, coats, and bags",
            swatches: [
                { label: "Your Piece", hex: baseHex.toUpperCase() },
                { label: "Soft Light", hex: neutralLight },
                { label: "Mid Tone", hex: neutralMid },
                { label: "Deep Anchor", hex: neutralDark },
            ],
        },
        {
            name: "Monochrome Editorial",
            subtitle: "Tonal light-to-dark layering in the same color family",
            swatches: [
                { label: "Your Piece", hex: baseHex.toUpperCase() },
                { label: "Tint / Blush", hex: hslToHex(base.h, Math.max(15, base.s - 18), Math.min(88, base.l + 28)) },
                { label: "Rich Mid", hex: hslToHex(base.h, Math.min(85, base.s + 6), Math.max(25, Math.min(60, base.l))) },
                { label: "Deep Shade", hex: hslToHex(base.h, Math.min(75, base.s), Math.max(14, base.l - 26)) },
            ],
        },
        {
            name: "Soft Analogous",
            subtitle: "Neighboring hues for a cohesive, magazine-worthy look",
            swatches: [
                { label: "Your Piece", hex: baseHex.toUpperCase() },
                { label: "Warm Neighbor", hex: hslToHex(base.h + 28, Math.max(22, base.s - 8), Math.min(76, base.l + 6)) },
                { label: "Cool Neighbor", hex: hslToHex(base.h - 28, Math.max(22, base.s - 8), Math.max(24, base.l - 6)) },
                { label: "Grounding", hex: neutralLight },
            ],
        },
        {
            name: "Bold Contrast Pop",
            subtitle: "Statement bag, heels, or lip color to make heads turn",
            swatches: [
                { label: "Your Piece", hex: baseHex.toUpperCase() },
                { label: "Opposite Pop", hex: hslToHex(base.h + 180, Math.max(30, Math.min(68, base.s)), Math.max(28, Math.min(58, base.l))) },
                { label: "Split Accent", hex: hslToHex(base.h + 150, Math.max(24, base.s - 12), Math.min(72, base.l + 10)) },
                { label: "Anchor", hex: neutralDark },
            ],
        },
    ];

    return palettes;
}
