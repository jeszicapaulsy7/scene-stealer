import { useState } from "react";
import PhotoUpload from "./PhotoUpload";
import { parseMusicLink } from "../utils/musicEmbed";

function AddSceneModal({
    apiBaseUrl,
    categories,
    moods,
    initialScene = null,
    onClose,
    onSubmitScene,
}) {
    const isEditing = Boolean(initialScene);

    const [title, setTitle] = useState(initialScene?.title || "");
    const [movie, setMovie] = useState(initialScene?.movie || "");
    const [category, setCategory] = useState(
        initialScene?.category || categories[0] || "Fashion"
    );
    const [selectedMoods, setSelectedMoods] = useState(
        Array.isArray(initialScene?.moods) ? initialScene.moods : []
    );
    const [description, setDescription] = useState(initialScene?.description || "");
    const [everydayInspiration, setEverydayInspiration] = useState(
        initialScene?.everydayInspiration || ""
    );

    const hasExistingVibe = Boolean(
        initialScene?.recreateVibe &&
            (initialScene.recreateVibe.outfit ||
                initialScene.recreateVibe.makeup ||
                initialScene.recreateVibe.hairstyle ||
                initialScene.recreateVibe.activity ||
                initialScene.recreateVibe.music)
    );
    const [showVibeFields, setShowVibeFields] = useState(hasExistingVibe);
    const [outfit, setOutfit] = useState(initialScene?.recreateVibe?.outfit || "");
    const [makeup, setMakeup] = useState(initialScene?.recreateVibe?.makeup || "");
    const [hairstyle, setHairstyle] = useState(
        initialScene?.recreateVibe?.hairstyle || ""
    );
    const [activity, setActivity] = useState(initialScene?.recreateVibe?.activity || "");
    const [music, setMusic] = useState(initialScene?.recreateVibe?.music || "");

    const [tagsInput, setTagsInput] = useState(
        Array.isArray(initialScene?.tags) ? initialScene.tags.join(", ") : ""
    );
    const [imageUrl, setImageUrl] = useState(initialScene?.imageUrl || "");
    const [personalNotes, setPersonalNotes] = useState(
        initialScene?.personalNotes || ""
    );
    const [musicUrl, setMusicUrl] = useState(initialScene?.musicUrl || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const parsedMusic = parseMusicLink(musicUrl);

    function toggleMood(mood) {
        setSelectedMoods((prev) =>
            prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!title.trim() || !movie.trim() || !description.trim()) {
            setError("Please fill in the title, movie/TV show, and description.");
            return;
        }

        if (!parsedMusic.isEmpty && !parsedMusic.isValid) {
            setError(
                "Please enter a valid music URL starting with https:// (YouTube, Spotify, SoundCloud, etc.), or remove it."
            );
            return;
        }

        const tags = tagsInput
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

        setSubmitting(true);
        try {
            await onSubmitScene({
                title: title.trim(),
                movie: movie.trim(),
                category,
                moods: selectedMoods,
                description: description.trim(),
                everydayInspiration: everydayInspiration.trim(),
                recreateVibe: {
                    outfit: outfit.trim(),
                    makeup: makeup.trim(),
                    hairstyle: hairstyle.trim(),
                    activity: activity.trim(),
                    music: music.trim(),
                },
                tags,
                imageUrl: imageUrl.trim(),
                personalNotes: personalNotes.trim(),
                musicUrl: musicUrl.trim(),
            });
            onClose();
        } catch (err) {
            setError(
                err.message ||
                    (isEditing
                        ? "Could not update scene. Please try again."
                        : "Could not save scene. Please try again.")
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="scene-modal add-scene-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <button className="modal-close" onClick={onClose} aria-label="Close modal">
                    ×
                </button>

                <p className="eyebrow">
                    {isEditing ? "EDIT SCENE" : "CURATE YOUR ARCHIVE"}
                </p>
                <h2>{isEditing ? "Update this scene." : "Add your own scene."}</h2>

                {error && <p className="form-error">{error}</p>}

                <form className="add-scene-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>
                            <span>Scene / Idea Title *</span>
                            <input
                                type="text"
                                placeholder="e.g. Rainy Day Bookstore"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </label>

                        <label>
                            <span>Movie or TV Show *</span>
                            <input
                                type="text"
                                placeholder="e.g. Notting Hill"
                                value={movie}
                                onChange={(e) => setMovie(e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    <div className="form-row">
                        <label>
                            <span>Category *</span>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Tags (comma-separated)</span>
                            <input
                                type="text"
                                placeholder="e.g. Cozy, Books, Autumn"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="form-group">
                        <span className="form-label">Moods (select any that match)</span>
                        <div className="modal-mood-picker">
                            {moods.map((mood) => (
                                <button
                                    type="button"
                                    key={mood}
                                    className={`mood-pill ${
                                        selectedMoods.includes(mood) ? "active" : ""
                                    }`}
                                    onClick={() => toggleMood(mood)}
                                >
                                    {mood}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label>
                        <span>Description *</span>
                        <textarea
                            rows={3}
                            placeholder="Describe the vibe, outfit, makeup, music, or cinematic feeling..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        <span>How to try it in real life (optional)</span>
                        <textarea
                            rows={2}
                            placeholder="e.g. Pair a cream turtleneck with gold hoops and a warm latte..."
                            value={everydayInspiration}
                            onChange={(e) => setEverydayInspiration(e.target.value)}
                        />
                    </label>

                    <div className="music-form-section">
                        <div className="music-form-header">
                            <span className="form-label">
                                ♫ Attach Music Link (YouTube, Spotify, SoundCloud, etc.)
                            </span>
                            {musicUrl.trim() && (
                                <button
                                    type="button"
                                    className="remove-music-btn"
                                    onClick={() => setMusicUrl("")}
                                >
                                    Remove Music
                                </button>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Paste a YouTube, YouTube Music, Spotify, SoundCloud, or other music link..."
                            value={musicUrl}
                            onChange={(e) => setMusicUrl(e.target.value)}
                        />

                        {!parsedMusic.isEmpty && (
                            <p
                                className={
                                    parsedMusic.isValid
                                        ? "music-detect-ok"
                                        : "photo-upload-error"
                                }
                            >
                                {parsedMusic.isValid
                                    ? parsedMusic.canEmbed
                                        ? `♫ Detected ${parsedMusic.platform} — playable embedded player will appear on this scene.`
                                        : `♫ Detected ${parsedMusic.platform} — will open cleanly in a new tab.`
                                    : "Invalid URL — please paste a full link starting with https://"}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        className="vibe-toggle-btn"
                        onClick={() => setShowVibeFields((prev) => !prev)}
                    >
                        {showVibeFields
                            ? "− Hide Recreate the Vibe fields"
                            : "+ Add Recreate the Vibe breakdown (Outfit, Makeup, Hair, Activity, Music)"}
                    </button>

                    {showVibeFields && (
                        <div className="vibe-form-box">
                            <label>
                                <span>Outfit</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Camel trench coat, knit sweater, loafers"
                                    value={outfit}
                                    onChange={(e) => setOutfit(e.target.value)}
                                />
                            </label>
                            <div className="form-row">
                                <label>
                                    <span>Makeup</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Glossy rose lips, soft liner"
                                        value={makeup}
                                        onChange={(e) => setMakeup(e.target.value)}
                                    />
                                </label>
                                <label>
                                    <span>Hairstyle</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Loose waves with satin ribbon"
                                        value={hairstyle}
                                        onChange={(e) => setHairstyle(e.target.value)}
                                    />
                                </label>
                            </div>
                            <div className="form-row">
                                <label>
                                    <span>Activity</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Solo bookstore browse & espresso"
                                        value={activity}
                                        onChange={(e) => setActivity(e.target.value)}
                                    />
                                </label>
                                <label>
                                    <span>Music Vibe Note</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. 90s indie acoustic or Parisian jazz"
                                        value={music}
                                        onChange={(e) => setMusic(e.target.value)}
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    <PhotoUpload
                        apiBaseUrl={apiBaseUrl}
                        value={imageUrl}
                        onChange={setImageUrl}
                        label="Cover Photo (optional)"
                    />

                    <label>
                        <span>Personal Notes (optional)</span>
                        <textarea
                            rows={2}
                            placeholder="Private reminders, outfit ideas, or songs to remember..."
                            value={personalNotes}
                            onChange={(e) => setPersonalNotes(e.target.value)}
                        />
                    </label>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="modal-save form-submit-btn"
                            disabled={submitting}
                        >
                            {submitting
                                ? isEditing
                                    ? "SAVING CHANGES..."
                                    : "SAVING TO ARCHIVE..."
                                : isEditing
                                    ? "SAVE CHANGES"
                                    : "SAVE SCENE TO ARCHIVE"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddSceneModal;
