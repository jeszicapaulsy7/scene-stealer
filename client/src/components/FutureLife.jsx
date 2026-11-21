import { useState, useEffect } from "react";
import PhotoUpload from "./PhotoUpload";
import { resolveImageUrl } from "../utils/imageUrl";

const PILLARS = [
    "All",
    "Lifestyle",
    "Career",
    "Fashion",
    "Travel",
    "Home",
    "Hobbies",
    "Goals",
];

const STATUS_CYCLE = ["Dreaming", "In Progress", "Manifested"];

function FutureLife({ apiBaseUrl }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activePillar, setActivePillar] = useState("All");
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [pillar, setPillar] = useState("Lifestyle");
    const [affirmation, setAffirmation] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [status, setStatus] = useState("Dreaming");
    const [imageUrl, setImageUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`${apiBaseUrl}/api/vision`)
            .then((res) => {
                if (!res.ok) throw new Error("Unable to load vision board.");
                return res.json();
            })
            .then((data) => {
                if (!cancelled) setItems(data);
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

    async function handleAddVision(e) {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/vision`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    pillar,
                    affirmation: affirmation.trim(),
                    targetDate: targetDate.trim(),
                    status,
                    imageUrl: imageUrl.trim(),
                }),
            });
            const created = await res.json();
            if (!res.ok) throw new Error(created.message || "Failed to add vision.");
            setItems((prev) => [created, ...prev]);
            setTitle("");
            setAffirmation("");
            setTargetDate("");
            setImageUrl("");
            setStatus("Dreaming");
            setShowAddModal(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCycleStatus(item) {
        const idx = STATUS_CYCLE.indexOf(item.status);
        const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        try {
            const res = await fetch(`${apiBaseUrl}/api/vision/${item._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const updated = await res.json();
            if (res.ok) {
                setItems((prev) =>
                    prev.map((v) => (v._id === updated._id ? updated : v))
                );
            }
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(id) {
        try {
            const res = await fetch(`${apiBaseUrl}/api/vision/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setItems((prev) => prev.filter((item) => item._id !== id));
            }
        } catch (err) {
            setError(err.message);
        }
    }

    const filteredItems = items.filter(
        (item) => activePillar === "All" || item.pillar === activePillar
    );

    const dreamingCount = items.filter((i) => i.status === "Dreaming").length;
    const progressCount = items.filter((i) => i.status === "In Progress").length;
    const manifestedCount = items.filter((i) => i.status === "Manifested").length;

    return (
        <section className="discover-section">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">MY FUTURE LIFE · VISION BOARD</p>
                    <h2>Direct your next chapter.</h2>
                </div>

                <button
                    className="explore-button daily-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    + Add Vision Card
                </button>
            </div>

            <div className="vision-stats-row">
                <div className="vision-stat-card">
                    <span>{dreamingCount}</span>
                    <p>DREAMING</p>
                </div>
                <div className="vision-stat-card">
                    <span>{progressCount}</span>
                    <p>IN PROGRESS</p>
                </div>
                <div className="vision-stat-card highlight">
                    <span>{manifestedCount}</span>
                    <p>MANIFESTED</p>
                </div>
            </div>

            <div className="filter-block">
                <span className="filter-block-label">LIFE PILLARS</span>
                <div className="category-list">
                    {PILLARS.map((p) => (
                        <button
                            key={p}
                            className={`category-button ${
                                activePillar === p ? "active" : ""
                            }`}
                            onClick={() => setActivePillar(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="status-state">
                    <div className="loading-spinner" />
                    <h3>Loading your vision board...</h3>
                </div>
            )}

            {!loading && error && (
                <div className="status-state">
                    <h3>Could not load vision board.</h3>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && filteredItems.length > 0 && (
                <div className="scene-grid">
                    {filteredItems.map((item) => (
                        <article className="scene-card vision-card" key={item._id}>
                            {item.imageUrl && (
                                <div className="card-image-wrap">
                                    <img
                                        src={resolveImageUrl(item.imageUrl, apiBaseUrl)}
                                        alt={item.title}
                                        className="card-image"
                                    />
                                </div>
                            )}

                            <div className="card-top">
                                <span className="category-label">{item.pillar}</span>
                                <button
                                    className={`vision-status-btn status-${item.status
                                        .toLowerCase()
                                        .replace(" ", "-")}`}
                                    onClick={() => handleCycleStatus(item)}
                                    title="Click to update progress"
                                >
                                    {item.status} ↻
                                </button>
                            </div>

                            <h3>{item.title}</h3>

                            {item.targetDate && (
                                <p className="movie-name">Target · {item.targetDate}</p>
                            )}

                            {item.affirmation && (
                                <p className="card-description">{item.affirmation}</p>
                            )}

                            <div className="card-footer">
                                <button
                                    className="reset-filters-button"
                                    onClick={() => handleDelete(item._id)}
                                >
                                    Remove
                                </button>
                                <span className="card-arrow">✦</span>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {!loading && !error && filteredItems.length === 0 && (
                <div className="empty-state">
                    <h3>No visions in this pillar yet.</h3>
                    <p>
                        Add a dream home, career milestone, wardrobe era, or travel
                        destination to your board.
                    </p>
                    <button onClick={() => setShowAddModal(true)}>
                        + Add Vision Card
                    </button>
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div
                        className="scene-modal add-scene-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            onClick={() => setShowAddModal(false)}
                        >
                            ×
                        </button>
                        <p className="eyebrow">MY FUTURE LIFE</p>
                        <h2>Add a dream vision.</h2>

                        <form className="add-scene-form" onSubmit={handleAddVision}>
                            <div className="form-row">
                                <label>
                                    <span>Vision / Goal Title *</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Creative Director Role"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </label>

                                <label>
                                    <span>Life Pillar *</span>
                                    <select
                                        value={pillar}
                                        onChange={(e) => setPillar(e.target.value)}
                                    >
                                        {PILLARS.filter((p) => p !== "All").map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="form-row">
                                <label>
                                    <span>Target Timeframe (optional)</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2027, Next Summer"
                                        value={targetDate}
                                        onChange={(e) => setTargetDate(e.target.value)}
                                    />
                                </label>

                                <label>
                                    <span>Status</span>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        {STATUS_CYCLE.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <PhotoUpload
                                apiBaseUrl={apiBaseUrl}
                                value={imageUrl}
                                onChange={setImageUrl}
                                label="Vision Photo (optional)"
                            />

                            <label>
                                <span>Affirmation / Description</span>
                                <textarea
                                    rows={3}
                                    placeholder="Describe how this chapter looks, feels, and unfolds..."
                                    value={affirmation}
                                    onChange={(e) => setAffirmation(e.target.value)}
                                />
                            </label>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-save form-submit-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? "SAVING..." : "ADD TO VISION BOARD"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}

export default FutureLife;
