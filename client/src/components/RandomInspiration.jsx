import { useState } from "react";

const RANDOM_MODES = [
    { id: "any", label: "Surprise Me" },
    { id: "scene", label: "Scene" },
    { id: "outfit", label: "Outfit" },
    { id: "activity", label: "Activity" },
    { id: "mood", label: "Mood" },
];

function pickLocalFallbackScene(list) {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
}

function RandomInspiration({ apiBaseUrl, scenes, savedScenes, onToggleSave, onSelect }) {
    const [mode, setMode] = useState("any");
    const [result, setResult] = useState(null);
    const [spinning, setSpinning] = useState(false);

    async function handleRoll(selectedMode = mode) {
        setSpinning(true);
        try {
            const query = selectedMode !== "any" ? `?type=${selectedMode}` : "";
            const res = await fetch(`${apiBaseUrl}/api/scenes/random${query}`);
            if (res.ok) {
                const data = await res.json();
                setResult(data);
                return;
            }
            throw new Error("Fallback to local random");
        } catch {
            if (scenes.length > 0) {
                const randomScene = pickLocalFallbackScene(scenes);
                setResult({
                    type: selectedMode === "any" ? "scene" : selectedMode,
                    promptLabel: "Random Inspiration",
                    promptText:
                        randomScene.recreateVibe?.activity ||
                        randomScene.everydayInspiration ||
                        randomScene.description,
                    scene: randomScene,
                });
            }
        } finally {
            setSpinning(false);
        }
    }

    return (
        <section className="random-section">
            <div className="random-card">
                <div className="random-top">
                    <div>
                        <p className="eyebrow">DON&apos;T KNOW WHAT TO DO TODAY?</p>
                        <h3>Random Inspiration Generator</h3>
                    </div>

                    <div className="random-controls">
                        <div className="random-mode-pills">
                            {RANDOM_MODES.map((item) => (
                                <button
                                    key={item.id}
                                    className={`mood-pill ${
                                        mode === item.id ? "active" : ""
                                    }`}
                                    onClick={() => {
                                        setMode(item.id);
                                        handleRoll(item.id);
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <button
                            className="explore-button random-roll-btn"
                            onClick={() => handleRoll(mode)}
                            disabled={spinning || scenes.length === 0}
                        >
                            {spinning ? "Shuffling..." : "✦ Shuffle Inspiration"}
                        </button>
                    </div>
                </div>

                {result && result.scene && (
                    <div className="random-result">
                        <div className="random-result-meta">
                            <span className="category-label">
                                {result.promptLabel}
                            </span>
                            <span className="random-movie-tag">
                                {result.scene.title} · {result.scene.movie}
                            </span>
                        </div>

                        <p className="random-result-text">{result.promptText}</p>

                        <div className="random-result-actions">
                            <button
                                className="view-scene-button"
                                onClick={() => onSelect(result.scene)}
                            >
                                OPEN FULL VIBE GUIDE →
                            </button>

                            <button
                                className={`daily-save-btn ${
                                    savedScenes.includes(result.scene._id) ? "saved" : ""
                                }`}
                                onClick={() => onToggleSave(result.scene._id)}
                            >
                                {savedScenes.includes(result.scene._id)
                                    ? "♥ Saved"
                                    : "♡ Save Scene"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default RandomInspiration;
