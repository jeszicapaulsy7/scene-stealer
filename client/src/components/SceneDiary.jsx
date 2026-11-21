import { useState, useEffect } from "react";
import PhotoUpload from "./PhotoUpload";
import ImageLightbox from "./ImageLightbox";
import { resolveImageUrl } from "../utils/imageUrl";

const DIARY_MOODS = [
    "All",
    "Romantic",
    "Confident",
    "Soft girl",
    "Dark feminine",
    "Main character",
    "Cozy",
    "Old money",
    "Party",
    "Study",
    "Rebellious",
];

function SceneDiary({ apiBaseUrl }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeMood, setActiveMood] = useState("All");
    const [search, setSearch] = useState("");
    const [showNewModal, setShowNewModal] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    // Form state
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [mood, setMood] = useState("Main character");
    const [movieReference, setMovieReference] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [entry, setEntry] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`${apiBaseUrl}/api/diary`)
            .then((res) => {
                if (!res.ok) throw new Error("Unable to load diary entries.");
                return res.json();
            })
            .then((data) => {
                if (!cancelled) setEntries(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [apiBaseUrl]);

    async function handleCreateEntry(e) {
        e.preventDefault();
        if (!title.trim() || !entry.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/diary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    date,
                    mood,
                    movieReference: movieReference.trim(),
                    imageUrl: imageUrl.trim(),
                    entry: entry.trim(),
                }),
            });
            const created = await res.json();
            if (!res.ok) throw new Error(created.message || "Failed to save memory.");
            setEntries((prev) => [created, ...prev]);
            setTitle("");
            setMovieReference("");
            setImageUrl("");
            setEntry("");
            setShowNewModal(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        try {
            const res = await fetch(`${apiBaseUrl}/api/diary/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setEntries((prev) => prev.filter((item) => item._id !== id));
            }
        } catch (err) {
            setError(err.message);
        }
    }

    const filteredEntries = entries.filter((item) => {
        const matchesMood = activeMood === "All" || item.mood === activeMood;
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            item.title.toLowerCase().includes(q) ||
            item.entry.toLowerCase().includes(q) ||
            (item.movieReference || "").toLowerCase().includes(q);
        return matchesMood && matchesSearch;
    });

    return (
        <section className="discover-section">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">SCENE DIARY · PERSONAL MEMORIES</p>
                    <h2>Document your real-life scenes.</h2>
                </div>

                <button
                    className="explore-button daily-btn"
                    onClick={() => setShowNewModal(true)}
                >
                    + New Diary Entry
                </button>
            </div>

            <div className="search-box">
                <span>⌕</span>
                <input
                    placeholder="Search memories, feelings, or movie vibes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button className="clear-search" onClick={() => setSearch("")}>
                        Clear
                    </button>
                )}
            </div>

            <div className="filter-block">
                <span className="filter-block-label">FILTER BY MOOD</span>
                <div className="mood-list">
                    {DIARY_MOODS.map((m) => (
                        <button
                            key={m}
                            className={`mood-pill ${activeMood === m ? "active" : ""}`}
                            onClick={() => setActiveMood(m)}
                        >
                            {m === "All" ? "All Moods" : m}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="status-state">
                    <div className="loading-spinner" />
                    <h3>Opening your Scene Diary...</h3>
                </div>
            )}

            {!loading && error && (
                <div className="status-state">
                    <h3>Could not load diary.</h3>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && filteredEntries.length > 0 && (
                <div className="diary-timeline">
                    {filteredEntries.map((item) => (
                        <article className="diary-card" key={item._id}>
                            {item.imageUrl && (
                                <div
                                    className="diary-img-wrap"
                                    onClick={() =>
                                        setLightboxImage({
                                            src: resolveImageUrl(
                                                item.imageUrl,
                                                apiBaseUrl
                                            ),
                                            alt: item.title,
                                        })
                                    }
                                    title="Click to view full screen"
                                >
                                    <img
                                        src={resolveImageUrl(item.imageUrl, apiBaseUrl)}
                                        alt={item.title}
                                        className="diary-img"
                                    />
                                </div>
                            )}

                            <div className="diary-body">
                                <div className="diary-meta">
                                    <span className="category-label">{item.date}</span>
                                    <span className="mood-badge">✦ {item.mood}</span>
                                </div>

                                <h3>{item.title}</h3>

                                {item.movieReference && (
                                    <p className="movie-name">
                                        Felt like · {item.movieReference}
                                    </p>
                                )}

                                <p className="diary-text">{item.entry}</p>

                                <div className="diary-footer">
                                    <button
                                        className="reset-filters-button"
                                        onClick={() => handleDelete(item._id)}
                                    >
                                        Delete entry
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {!loading && !error && filteredEntries.length === 0 && (
                <div className="empty-state">
                    <h3>Your Scene Diary is ready.</h3>
                    <p>
                        Save photos, moods, dates, and little moments that felt straight
                        out of a movie.
                    </p>
                    <button onClick={() => setShowNewModal(true)}>
                        + Write your first entry
                    </button>
                </div>
            )}

            {showNewModal && (
                <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
                    <div
                        className="scene-modal add-scene-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            onClick={() => setShowNewModal(false)}
                        >
                            ×
                        </button>
                        <p className="eyebrow">SCENE DIARY</p>
                        <h2>Capture a memory.</h2>

                        <form className="add-scene-form" onSubmit={handleCreateEntry}>
                            <div className="form-row">
                                <label>
                                    <span>Memory Title *</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Rainy Evening Coffee Walk"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </label>

                                <label>
                                    <span>Date *</span>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </label>
                            </div>

                            <div className="form-row">
                                <label>
                                    <span>Mood</span>
                                    <select
                                        value={mood}
                                        onChange={(e) => setMood(e.target.value)}
                                    >
                                        {DIARY_MOODS.filter((m) => m !== "All").map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    <span>Movie / Vibe Reference (optional)</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Midnight in Paris"
                                        value={movieReference}
                                        onChange={(e) =>
                                            setMovieReference(e.target.value)
                                        }
                                    />
                                </label>
                            </div>

                            <PhotoUpload
                                apiBaseUrl={apiBaseUrl}
                                value={imageUrl}
                                onChange={setImageUrl}
                                label="Memory Photo (optional)"
                            />

                            <label>
                                <span>Journal Entry *</span>
                                <textarea
                                    rows={4}
                                    placeholder="What happened today? What were you wearing, listening to, or feeling?"
                                    value={entry}
                                    onChange={(e) => setEntry(e.target.value)}
                                    required
                                />
                            </label>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setShowNewModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-save form-submit-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? "SAVING..." : "SAVE TO DIARY"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ImageLightbox
                src={lightboxImage?.src}
                alt={lightboxImage?.alt}
                onClose={() => setLightboxImage(null)}
            />
        </section>
    );
}

export default SceneDiary;
