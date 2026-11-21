import { resolveImageUrl } from "../utils/imageUrl";

function DailyScene({ dailyData, apiBaseUrl, isSaved, onToggleSave, onSelect }) {
    if (!dailyData || !dailyData.scene) {
        return null;
    }

    const { date, scene } = dailyData;
    const vibe = scene.recreateVibe || {};
    const imageSrc = resolveImageUrl(scene.imageUrl, apiBaseUrl);

    return (
        <section className="daily-section" id="daily-scene">
            <div className="daily-card editorial-split">
                <div className="daily-crimson-panel">
                    <div className="daily-vertical-rail" aria-hidden="true">
                        <span>DAILY EDIT</span>
                        <span>SCENE STEALER</span>
                        <span>{date}</span>
                    </div>

                    <div className="daily-crimson-inner">
                        <div className="daily-header">
                            <p className="eyebrow">DAILY INSPIRATION · {date}</p>
                            <span className="category-label">{scene.category}</span>
                        </div>

                        <div className="daily-crimson-body">
                            <div className="daily-main">
                                <h2>{scene.title}</h2>
                                <p className="daily-movie">Inspired by {scene.movie}</p>
                                <p className="daily-description">{scene.description}</p>

                                {scene.moods && scene.moods.length > 0 && (
                                    <div className="mood-badge-list">
                                        {scene.moods.map((mood) => (
                                            <span className="mood-badge" key={mood}>
                                                ✦ {mood}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {imageSrc && (
                                <div className="daily-thumb-wrap">
                                    <img
                                        src={imageSrc}
                                        alt={scene.title}
                                        className="daily-thumb"
                                        onError={(e) => {
                                            e.currentTarget.parentElement.style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="daily-try-box">
                    <p className="daily-try-kicker">CURATED FOR YOU</p>
                    <h3>TRY IT IN REAL LIFE</h3>
                    <p className="daily-try-lead">
                        {scene.everydayInspiration ||
                            "Translate this scene's energy into your outfit, playlist, or evening routine today."}
                    </p>

                    {(vibe.outfit || vibe.activity) && (
                        <div className="daily-vibe-preview">
                            {vibe.outfit && (
                                <p>
                                    <strong>Outfit:</strong> {vibe.outfit}
                                </p>
                            )}
                            {vibe.activity && (
                                <p>
                                    <strong>Activity:</strong> {vibe.activity}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="daily-actions">
                        <button
                            className="editorial-link-btn"
                            onClick={() => onSelect(scene)}
                        >
                            RECREATE THE VIBE <span>→</span>
                        </button>

                        <button
                            className={`daily-save-btn ${isSaved ? "saved" : ""}`}
                            onClick={() => onToggleSave(scene._id)}
                        >
                            {isSaved ? "♥ SAVED" : "♡ SAVE SCENE"}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default DailyScene;
