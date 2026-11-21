import { useState } from "react";
import {
    FASHION_SWATCHES,
    analyzeColorMatch,
    generateMatchingPalettes,
} from "../utils/colorTheory";

const DEFAULT_SLOTS = [
    { id: "outfit", label: "Main Outfit / Top", hex: "#161616" },
    { id: "bottom", label: "Bottom / Layer", hex: "#C49A70" },
    { id: "heels", label: "Heels / Shoes", hex: "#6A1B2E" },
    { id: "bag", label: "Bag / Accessory", hex: "#F5EFE6" },
];

function ColorStudio() {
    const [tab, setTab] = useState("checker");
    const [slots, setSlots] = useState(DEFAULT_SLOTS.slice(0, 3));
    const [activeSlotIdx, setActiveSlotIdx] = useState(0);
    const [baseHex, setBaseHex] = useState("#6A1B2E");
    const [copiedHex, setCopiedHex] = useState("");

    const analysis = analyzeColorMatch(slots.map((s) => s.hex));
    const palettes = generateMatchingPalettes(baseHex);

    function updateSlotHex(index, hex) {
        setSlots((prev) =>
            prev.map((slot, i) => (i === index ? { ...slot, hex: hex.toUpperCase() } : slot))
        );
    }

    function addFourthSlot() {
        if (slots.length < 4) {
            setSlots((prev) => [...prev, DEFAULT_SLOTS[3]]);
            setActiveSlotIdx(3);
        }
    }

    function removeSlot(index) {
        if (slots.length <= 2) return;
        setSlots((prev) => prev.filter((_, i) => i !== index));
        setActiveSlotIdx(0);
    }

    function copyColor(hex) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(hex).catch(() => {});
        }
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(""), 1300);
    }

    return (
        <section className="discover-section">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">COLOR ANALYSIS STUDIO</p>
                    <h2>Check what colors belong together.</h2>
                </div>
            </div>

            <div className="collection-tabs">
                <button
                    className={`category-button ${tab === "checker" ? "active" : ""}`}
                    onClick={() => setTab("checker")}
                >
                    Outfit Match Checker
                </button>
                <button
                    className={`category-button ${tab === "palettes" ? "active" : ""}`}
                    onClick={() => setTab("palettes")}
                >
                    What Goes With This?
                </button>
            </div>

            {tab === "checker" && (
                <div className="color-studio-layout">
                    <div className="color-picker-panel">
                        <div className="panel-header-row">
                            <span className="filter-block-label">
                                PICK YOUR OUTFIT COLORS (2–4 PIECES)
                            </span>
                            {slots.length < 4 && (
                                <button
                                    type="button"
                                    className="reset-filters-button"
                                    onClick={addFourthSlot}
                                >
                                    + Add 4th piece
                                </button>
                            )}
                        </div>

                        <div className="color-slots-list">
                            {slots.map((slot, idx) => (
                                <div
                                    key={slot.id}
                                    className={`color-slot-card ${
                                        activeSlotIdx === idx ? "active" : ""
                                    }`}
                                    onClick={() => setActiveSlotIdx(idx)}
                                >
                                    <input
                                        type="color"
                                        value={slot.hex}
                                        onChange={(e) => updateSlotHex(idx, e.target.value)}
                                        aria-label={slot.label}
                                    />
                                    <div className="color-slot-info">
                                        <strong>{slot.label}</strong>
                                        <span>{slot.hex}</span>
                                    </div>
                                    {slots.length > 2 && (
                                        <button
                                            type="button"
                                            className="pin-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSlot(idx);
                                            }}
                                            title="Remove piece"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="quick-swatches-box">
                            <span className="filter-block-label">
                                QUICK FASHION SWATCHES (FOR {slots[activeSlotIdx]?.label.toUpperCase()})
                            </span>
                            <div className="fashion-swatch-grid">
                                {FASHION_SWATCHES.map((swatch) => (
                                    <button
                                        key={swatch.name}
                                        type="button"
                                        className="swatch-chip"
                                        onClick={() =>
                                            updateSlotHex(activeSlotIdx, swatch.hex)
                                        }
                                    >
                                        <span
                                            className="swatch-dot"
                                            style={{ backgroundColor: swatch.hex }}
                                        />
                                        <span>{swatch.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="color-verdict-panel">
                        <div className="outfit-swatch-preview">
                            {slots.map((slot) => (
                                <div
                                    key={slot.id}
                                    className="outfit-preview-bar"
                                    style={{ backgroundColor: slot.hex }}
                                    title={`${slot.label}: ${slot.hex}`}
                                >
                                    <span>{slot.label.split(" ")[0]}</span>
                                </div>
                            ))}
                        </div>

                        <div className="verdict-score-row">
                            <div>
                                <span className="category-label">
                                    {analysis.badge} · {analysis.harmonyType}
                                </span>
                                <h3>{analysis.verdict}</h3>
                            </div>
                            <div className="verdict-score-circle">
                                <span>{analysis.score}%</span>
                                <small>MATCH</small>
                            </div>
                        </div>

                        <p className="verdict-tip">{analysis.tip}</p>

                        <div className="vibe-item" style={{ marginTop: 18 }}>
                            <span>RECOMMENDED JEWELRY / HARDWARE</span>
                            <p>{analysis.jewelryMetal}</p>
                        </div>
                    </div>
                </div>
            )}

            {tab === "palettes" && (
                <div className="palette-explorer">
                    <div className="base-color-bar">
                        <div className="base-color-picker-wrap">
                            <input
                                type="color"
                                value={baseHex}
                                onChange={(e) => setBaseHex(e.target.value.toUpperCase())}
                                aria-label="Pick base outfit color"
                            />
                            <div>
                                <span className="filter-block-label">
                                    YOUR BASE PIECE COLOR
                                </span>
                                <h3>{baseHex}</h3>
                            </div>
                        </div>

                        <div className="fashion-swatch-grid">
                            {FASHION_SWATCHES.map((swatch) => (
                                <button
                                    key={swatch.name}
                                    type="button"
                                    className={`swatch-chip ${
                                        baseHex.toUpperCase() === swatch.hex.toUpperCase()
                                            ? "active-swatch"
                                            : ""
                                    }`}
                                    onClick={() => setBaseHex(swatch.hex)}
                                >
                                    <span
                                        className="swatch-dot"
                                        style={{ backgroundColor: swatch.hex }}
                                    />
                                    <span>{swatch.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="palette-results-grid">
                        {palettes.map((palette) => (
                            <article className="palette-result-card" key={palette.name}>
                                <h4>{palette.name}</h4>
                                <p className="palette-subtitle">{palette.subtitle}</p>

                                <div className="palette-strip">
                                    {palette.swatches.map((sw, idx) => (
                                        <button
                                            key={`${palette.name}-${idx}`}
                                            type="button"
                                            className="palette-strip-block"
                                            onClick={() => copyColor(sw.hex)}
                                            title="Click to copy hex"
                                        >
                                            <span
                                                className="palette-strip-color"
                                                style={{ backgroundColor: sw.hex }}
                                            />
                                            <strong>{sw.label}</strong>
                                            <small>
                                                {copiedHex === sw.hex ? "Copied!" : sw.hex}
                                            </small>
                                        </button>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default ColorStudio;
