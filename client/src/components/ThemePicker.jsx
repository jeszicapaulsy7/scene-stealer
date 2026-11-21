import { useState, useEffect, useRef } from "react";

const THEME_STORAGE_KEY = "sceneStealerThemeV3";

const THEME_PRESETS = [
    {
        id: "noir-crimson",
        name: "Noir Crimson",
        mode: "dark",
        vars: {
            "--bg": "#0b0b0b",
            "--bg-elevated": "#141414",
            "--bg-card": "#121212",
            "--bg-input": "#161616",
            "--surface-dark": "#141414",
            "--surface-dark-muted": "#9e9a95",
            "--surface-crimson": "#9b111e",
            "--border": "#262626",
            "--border-strong": "#454545",
            "--text": "#f7f5f2",
            "--text-muted": "#a6a19b",
            "--accent": "#d9232e",
            "--accent-hover": "#f03843",
            "--accent-contrast": "#ffffff",
            "--hero-glow": "#2a0a0d",
        },
    },
    {
        id: "midnight-gold",
        name: "Midnight Gold",
        mode: "dark",
        vars: {
            "--bg": "#0d0c0b",
            "--bg-elevated": "#171412",
            "--bg-card": "#141312",
            "--bg-input": "#161514",
            "--surface-dark": "#161412",
            "--surface-dark-muted": "#9c958e",
            "--surface-crimson": "#7a141a",
            "--border": "#2b2724",
            "--border-strong": "#514032",
            "--text": "#f7f4ef",
            "--text-muted": "#a8a199",
            "--accent": "#c49a70",
            "--accent-hover": "#e0bd98",
            "--accent-contrast": "#111111",
            "--hero-glow": "#2c1e16",
        },
    },
    {
        id: "velvet-rose",
        name: "Velvet Rose",
        mode: "dark",
        vars: {
            "--bg": "#0e0a0d",
            "--bg-elevated": "#191217",
            "--bg-card": "#161015",
            "--bg-input": "#130d12",
            "--surface-dark": "#181116",
            "--surface-dark-muted": "#a795a0",
            "--surface-crimson": "#751c3a",
            "--border": "#33252f",
            "--border-strong": "#5c3f53",
            "--text": "#faf4f7",
            "--text-muted": "#b29eaa",
            "--accent": "#e08da6",
            "--accent-hover": "#f0aec2",
            "--accent-contrast": "#120c10",
            "--hero-glow": "#331725",
        },
    },
    {
        id: "emerald-noir",
        name: "Emerald Noir",
        mode: "dark",
        vars: {
            "--bg": "#0a0e0c",
            "--bg-elevated": "#121a16",
            "--bg-card": "#101714",
            "--bg-input": "#0f1512",
            "--surface-dark": "#121916",
            "--surface-dark-muted": "#8fa39b",
            "--surface-crimson": "#1b4332",
            "--border": "#24342d",
            "--border-strong": "#3e594f",
            "--text": "#f2f7f5",
            "--text-muted": "#98aba3",
            "--accent": "#7ec4a3",
            "--accent-hover": "#9ed9bc",
            "--accent-contrast": "#0b120f",
            "--hero-glow": "#132920",
        },
    },
    {
        id: "editorial-alabaster",
        name: "Editorial Alabaster",
        mode: "light",
        vars: {
            "--bg": "#f4f1ec",
            "--bg-elevated": "#ece7df",
            "--bg-card": "#faf8f5",
            "--bg-input": "#ffffff",
            "--surface-dark": "#111111",
            "--surface-dark-muted": "#a9a29a",
            "--surface-crimson": "#8e1118",
            "--border": "#dcd6cc",
            "--border-strong": "#1c1a18",
            "--text": "#111111",
            "--text-muted": "#5d564f",
            "--accent": "#9e1419",
            "--accent-hover": "#7c0d12",
            "--accent-contrast": "#faf8f5",
            "--hero-glow": "#e7dfd4",
        },
    },
];

function applyThemeToDocument(themeId, customAccent) {
    const preset = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
    const root = document.documentElement;
    root.dataset.themeMode = preset.mode;

    Object.entries(preset.vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });

    if (customAccent) {
        root.style.setProperty("--accent", customAccent);
        root.style.setProperty("--accent-hover", customAccent);
    }
}

function ThemePicker() {
    const [open, setOpen] = useState(false);
    const [themeId, setThemeId] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY));
            return saved?.themeId || "noir-crimson";
        } catch {
            return "noir-crimson";
        }
    });
    const [customAccent, setCustomAccent] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY));
            return saved?.customAccent || "";
        } catch {
            return "";
        }
    });
    const wrapperRef = useRef(null);

    useEffect(() => {
        applyThemeToDocument(themeId, customAccent);
        localStorage.setItem(
            THEME_STORAGE_KEY,
            JSON.stringify({ themeId, customAccent })
        );
    }, [themeId, customAccent]);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const currentPreset =
        THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];

    return (
        <div className="theme-picker-wrap" ref={wrapperRef}>
            <button
                type="button"
                className="theme-trigger-btn"
                onClick={() => setOpen((prev) => !prev)}
                title="Customize Scene Stealer theme"
            >
                Theme
            </button>

            {open && (
                <div className="theme-popover">
                    <div className="theme-popover-header">
                        <span className="filter-block-label">APPEARANCE & THEME</span>
                        <button
                            type="button"
                            className="reset-filters-button"
                            onClick={() => {
                                setThemeId("noir-crimson");
                                setCustomAccent("");
                            }}
                        >
                            Reset
                        </button>
                    </div>

                    <div className="theme-presets-list">
                        {THEME_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                className={`theme-preset-btn ${
                                    themeId === preset.id ? "active" : ""
                                }`}
                                onClick={() => {
                                    setThemeId(preset.id);
                                    setCustomAccent("");
                                }}
                            >
                                <span className="theme-preset-dots">
                                    <span
                                        className="theme-dot"
                                        style={{ backgroundColor: preset.vars["--bg"] }}
                                    />
                                    <span
                                        className="theme-dot"
                                        style={{
                                            backgroundColor: preset.vars["--accent"],
                                        }}
                                    />
                                </span>
                                <span>{preset.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="theme-custom-accent">
                        <label>
                            <span>Custom Accent Color</span>
                            <div className="theme-accent-row">
                                <input
                                    type="color"
                                    value={customAccent || currentPreset.vars["--accent"]}
                                    onChange={(e) => setCustomAccent(e.target.value)}
                                />
                                <span>
                                    {customAccent || currentPreset.vars["--accent"]}
                                </span>
                            </div>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ThemePicker;
