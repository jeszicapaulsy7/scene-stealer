import { useState } from "react";
import { resolveImageUrl } from "../utils/imageUrl";

function parsePosition(posString) {
    if (!posString || typeof posString !== "string") {
        return { x: 50, y: 15 };
    }
    const parts = posString.trim().split(/\s+/);
    const parseVal = (val, fallback) => {
        if (!val) return fallback;
        if (val === "top" || val === "left") return 0;
        if (val === "center") return 50;
        if (val === "bottom" || val === "right") return 100;
        const num = parseFloat(val);
        return Number.isFinite(num) ? Math.min(100, Math.max(0, num)) : fallback;
    };
    return {
        x: parseVal(parts[0], 50),
        y: parseVal(parts[1], 15),
    };
}

function SceneCard({
    scene,
    apiBaseUrl,
    isSaved,
    onToggleSave,
    onSelect,
    onEdit,
    onDelete,
    onAdjustPhoto,
}) {
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const savedPos = parsePosition(scene.imagePosition);
    const savedFit = scene.imageFit === "contain" ? "contain" : "cover";

    const [adjusting, setAdjusting] = useState(false);
    const [draftX, setDraftX] = useState(savedPos.x);
    const [draftY, setDraftY] = useState(savedPos.y);
    const [draftFit, setDraftFit] = useState(savedFit);
    const [savingPhoto, setSavingPhoto] = useState(false);

    const imageSrc = resolveImageUrl(scene.imageUrl, apiBaseUrl);

    const activeFit = adjusting ? draftFit : savedFit;
    const activePosition = adjusting
        ? `${draftX}% ${draftY}%`
        : `${savedPos.x}% ${savedPos.y}%`;

    function openAdjust() {
        const current = parsePosition(scene.imagePosition);
        setDraftX(current.x);
        setDraftY(current.y);
        setDraftFit(scene.imageFit === "contain" ? "contain" : "cover");
        setAdjusting(true);
    }

    async function handleSavePhotoLayout() {
        if (!onAdjustPhoto) {
            setAdjusting(false);
            return;
        }
        setSavingPhoto(true);
        try {
            await onAdjustPhoto(scene._id, {
                imagePosition: `${Math.round(draftX)}% ${Math.round(draftY)}%`,
                imageFit: draftFit,
            });
            setAdjusting(false);
        } finally {
            setSavingPhoto(false);
        }
    }

    async function handleConfirmDelete() {
        setDeleting(true);
        try {
            await onDelete(scene._id);
        } finally {
            setDeleting(false);
            setConfirmingDelete(false);
        }
    }

    return (
        <article className={`scene-card ${imageSrc ? "has-photo" : "no-photo"}`}>
            {imageSrc && (
                <div className="card-image-wrap">
                    <img
                        src={imageSrc}
                        alt={scene.title}
                        className="card-image"
                        loading="lazy"
                        style={{
                            objectFit: activeFit,
                            objectPosition: activePosition,
                        }}
                        onError={(e) => {
                            e.currentTarget.parentElement.style.display = "none";
                        }}
                    />

                    {!adjusting ? (
                        <button
                            type="button"
                            className="photo-adjust-trigger"
                            onClick={openAdjust}
                            title="Adjust photo framing & fit"
                        >
                            ⊹ Adjust Photo
                        </button>
                    ) : (
                        <div className="photo-adjust-overlay">
                            <div className="photo-adjust-fit-row">
                                <button
                                    type="button"
                                    className={`photo-fit-btn ${
                                        draftFit === "cover" ? "active" : ""
                                    }`}
                                    onClick={() => setDraftFit("cover")}
                                >
                                    Fill
                                </button>
                                <button
                                    type="button"
                                    className={`photo-fit-btn ${
                                        draftFit === "contain" ? "active" : ""
                                    }`}
                                    onClick={() => setDraftFit("contain")}
                                >
                                    Full Photo
                                </button>
                            </div>

                            {draftFit === "cover" && (
                                <div className="photo-adjust-sliders">
                                    <label>
                                        <span>↑↓</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={draftY}
                                            onChange={(e) =>
                                                setDraftY(Number(e.target.value))
                                            }
                                        />
                                    </label>
                                    <label>
                                        <span>←→</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={draftX}
                                            onChange={(e) =>
                                                setDraftX(Number(e.target.value))
                                            }
                                        />
                                    </label>
                                </div>
                            )}

                            <div className="photo-adjust-actions">
                                <button
                                    type="button"
                                    className="photo-adjust-cancel"
                                    onClick={() => setAdjusting(false)}
                                    disabled={savingPhoto}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="photo-adjust-save"
                                    onClick={handleSavePhotoLayout}
                                    disabled={savingPhoto}
                                >
                                    {savingPhoto ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="card-body">
                <div className="card-top">
                    <div className="card-badges">
                        <span className="category-label">{scene.category}</span>
                        {scene.isUserCreated && <span className="user-badge">YOURS</span>}
                        {scene.musicUrl && (
                            <span
                                className="music-badge"
                                title={`Music attached (${scene.musicPlatform || "Audio"})`}
                            >
                                ♫
                            </span>
                        )}
                    </div>

                    <button
                        className={`save-button ${isSaved ? "saved" : ""}`}
                        onClick={() => onToggleSave(scene._id)}
                        title={isSaved ? "Remove from collection" : "Save scene"}
                        aria-label={isSaved ? "Remove from collection" : "Save scene"}
                    >
                        {isSaved ? "♥" : "♡"}
                    </button>
                </div>

                <div className="card-number">SCENE: {scene.movie.toUpperCase()}</div>

                <h3>{scene.title}</h3>

                <p className="movie-name">Inspired by {scene.movie}</p>

                <p className="card-description">{scene.description}</p>

                {scene.moods && scene.moods.length > 0 && (
                    <div className="mood-badge-list">
                        {scene.moods.map((mood) => (
                            <span className="mood-badge" key={mood}>
                                ✦ {mood}
                            </span>
                        ))}
                    </div>
                )}

                {scene.tags && scene.tags.length > 0 && (
                    <div className="tag-list">
                        {scene.tags.map((tag) => (
                            <span className="tag" key={tag}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="card-footer">
                    {confirmingDelete ? (
                        <div className="card-delete-confirm">
                            <span>Delete?</span>
                            <button
                                type="button"
                                className="card-delete-yes"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? "..." : "YES"}
                            </button>
                            <button
                                type="button"
                                className="card-delete-no"
                                onClick={() => setConfirmingDelete(false)}
                                disabled={deleting}
                            >
                                NO
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="card-footer-actions">
                                <button
                                    className="view-scene-button"
                                    onClick={() => onSelect(scene)}
                                >
                                    VIEW SCENE
                                </button>
                                <button
                                    className="edit-scene-card-btn"
                                    onClick={() => onEdit(scene)}
                                    title="Edit this scene"
                                >
                                    EDIT
                                </button>
                                <button
                                    className="delete-scene-card-btn"
                                    onClick={() => setConfirmingDelete(true)}
                                    title="Delete this scene"
                                >
                                    DELETE
                                </button>
                            </div>
                            <span className="card-arrow">↗</span>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

export default SceneCard;
