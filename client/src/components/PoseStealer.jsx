import { useState, useEffect } from "react";
import PhotoUpload from "./PhotoUpload";
import ImageLightbox from "./ImageLightbox";
import { resolveImageUrl } from "../utils/imageUrl";

const POSE_LOCATIONS = [
    "All",
    "Café",
    "Street / City",
    "Mirror",
    "Golden Hour / Outdoor",
    "Seated / Lounge",
    "Night Out",
];

function PoseStealer({ apiBaseUrl }) {
    const [poses, setPoses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeLocation, setActiveLocation] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedPose, setSelectedPose] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [showAddPose, setShowAddPose] = useState(false);
    const [showSavedOnly, setShowSavedOnly] = useState(false);

    const [savedPoses, setSavedPoses] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem("sceneStealerSavedPoses"));
            return Array.isArray(stored) ? stored : [];
        } catch {
            return [];
        }
    });

    // Add Pose form state
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("Café");
    const [vibe, setVibe] = useState("");
    const [cameraAngle, setCameraAngle] = useState("");
    const [bodyPosition, setBodyPosition] = useState("");
    const [handPlacement, setHandPlacement] = useState("");
    const [proTip, setProTip] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`${apiBaseUrl}/api/poses`)
            .then((res) => {
                if (!res.ok) throw new Error("Unable to load poses.");
                return res.json();
            })
            .then((data) => {
                if (!cancelled) {
                    setPoses(data);
                    setError("");
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message || "Could not load poses from backend.");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [apiBaseUrl]);

    useEffect(() => {
        localStorage.setItem("sceneStealerSavedPoses", JSON.stringify(savedPoses));
    }, [savedPoses]);

    function toggleSavePose(poseId) {
        setSavedPoses((prev) =>
            prev.includes(poseId)
                ? prev.filter((id) => id !== poseId)
                : [...prev, poseId]
        );
    }

    async function handleAddPose(event) {
        event.preventDefault();
        setFormError("");

        if (
            !title.trim() ||
            !cameraAngle.trim() ||
            !bodyPosition.trim() ||
            !handPlacement.trim()
        ) {
            setFormError("Please fill in title, camera angle, body position, and hand placement.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/poses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    location,
                    vibe: vibe.trim() || "Editorial",
                    cameraAngle: cameraAngle.trim(),
                    bodyPosition: bodyPosition.trim(),
                    handPlacement: handPlacement.trim(),
                    proTip: proTip.trim(),
                    imageUrl: imageUrl.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to add pose.");

            setPoses((prev) => [data, ...prev]);
            setSavedPoses((prev) => [...prev, data._id]);
            setTitle("");
            setVibe("");
            setCameraAngle("");
            setBodyPosition("");
            setHandPlacement("");
            setProTip("");
            setImageUrl("");
            setShowAddPose(false);
        } catch (err) {
            setFormError(err.message || "Could not save pose.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeletePose(poseId) {
        try {
            const res = await fetch(`${apiBaseUrl}/api/poses/${poseId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete pose.");
            setPoses((prev) => prev.filter((p) => p._id !== poseId));
            setSavedPoses((prev) => prev.filter((id) => id !== poseId));
            setSelectedPose(null);
        } catch (err) {
            setError(err.message || "Could not delete pose.");
        }
    }

    const filteredPoses = poses.filter((pose) => {
        const matchesLocation =
            activeLocation === "All" || pose.location === activeLocation;
        const matchesSaved = !showSavedOnly || savedPoses.includes(pose._id);
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            pose.title.toLowerCase().includes(q) ||
            pose.location.toLowerCase().includes(q) ||
            (pose.vibe || "").toLowerCase().includes(q) ||
            pose.cameraAngle.toLowerCase().includes(q) ||
            pose.bodyPosition.toLowerCase().includes(q) ||
            pose.handPlacement.toLowerCase().includes(q);

        return matchesLocation && matchesSaved && matchesSearch;
    });

    return (
        <section className="discover-section pose-section">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">POSE STEALER · EDITORIAL GUIDE</p>
                    <h2>Frame yourself like a film still.</h2>
                </div>

                <div className="pose-heading-actions">
                    <span className="scene-count">
                        {filteredPoses.length}{" "}
                        {filteredPoses.length === 1 ? "POSE" : "POSES"}
                    </span>
                    <button
                        className="explore-button daily-btn"
                        onClick={() => setShowAddPose(true)}
                    >
                        + Add Pose
                    </button>
                </div>
            </div>

            <div className="filter-controls-row">
                <div className="search-box">
                    <span>⌕</span>
                    <input
                        placeholder="Search poses by location, angle, hand placement or vibe..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="clear-search" onClick={() => setSearch("")}>
                            Clear
                        </button>
                    )}
                </div>

                <button
                    className={`category-button pose-saved-toggle ${
                        showSavedOnly ? "active" : ""
                    }`}
                    onClick={() => setShowSavedOnly((prev) => !prev)}
                >
                    {showSavedOnly
                        ? `♥ Saved Poses (${savedPoses.length})`
                        : `♡ Filter Saved (${savedPoses.length})`}
                </button>
            </div>

            <div className="filter-block">
                <span className="filter-block-label">LOCATION</span>
                <div className="category-list">
                    {POSE_LOCATIONS.map((loc) => (
                        <button
                            key={loc}
                            className={`category-button ${
                                activeLocation === loc ? "active" : ""
                            }`}
                            onClick={() => setActiveLocation(loc)}
                        >
                            {loc}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="status-state">
                    <div className="loading-spinner" />
                    <h3>Loading Pose Stealer...</h3>
                </div>
            )}

            {!loading && error && (
                <div className="status-state">
                    <h3>Could not load poses.</h3>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="scene-grid">
                    {filteredPoses.map((pose) => {
                        const isSaved = savedPoses.includes(pose._id);
                        return (
                            <article className="scene-card pose-card" key={pose._id}>
                                {pose.imageUrl ? (
                                    <div className="card-image-wrap">
                                        <img
                                            src={resolveImageUrl(pose.imageUrl, apiBaseUrl)}
                                            alt={pose.title}
                                            className="card-image"
                                            loading="lazy"
                                        />
                                    </div>
                                ) : (
                                    <div className="pose-visual-frame">
                                        <span className="pose-frame-corner tl" />
                                        <span className="pose-frame-corner tr" />
                                        <span className="pose-frame-corner bl" />
                                        <span className="pose-frame-corner br" />
                                        <span className="pose-frame-loc">
                                            {pose.location}
                                        </span>
                                        <span className="pose-frame-vibe">
                                            {pose.vibe}
                                        </span>
                                    </div>
                                )}

                                <div className="card-top">
                                    <div className="card-badges">
                                        <span className="category-label">
                                            {pose.location}
                                        </span>
                                        {pose.isUserCreated && (
                                            <span className="user-badge">YOURS</span>
                                        )}
                                    </div>
                                    <button
                                        className={`save-button ${isSaved ? "saved" : ""}`}
                                        onClick={() => toggleSavePose(pose._id)}
                                        title={isSaved ? "Remove pose" : "Save pose"}
                                    >
                                        {isSaved ? "♥" : "♡"}
                                    </button>
                                </div>

                                <div className="card-number">
                                    POSE NO. {String(pose.poseNumber || 0).padStart(2, "0")}
                                </div>

                                <h3>{pose.title}</h3>
                                <p className="movie-name">Vibe · {pose.vibe}</p>

                                <div className="pose-mini-specs">
                                    <p>
                                        <strong>Angle:</strong> {pose.cameraAngle}
                                    </p>
                                    <p>
                                        <strong>Hands:</strong> {pose.handPlacement}
                                    </p>
                                </div>

                                <div className="card-footer">
                                    <button
                                        className="view-scene-button"
                                        onClick={() => setSelectedPose(pose)}
                                    >
                                        VIEW FULL POSE GUIDE
                                    </button>
                                    <span className="card-arrow">↗</span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {!loading && !error && filteredPoses.length === 0 && (
                <div className="empty-state">
                    <h3>No poses match this filter.</h3>
                    <p>Try another location or add your own go-to pose.</p>
                    <button
                        onClick={() => {
                            setActiveLocation("All");
                            setSearch("");
                            setShowSavedOnly(false);
                        }}
                    >
                        Reset filters
                    </button>
                </div>
            )}

            {selectedPose && (
                <div className="modal-overlay" onClick={() => setSelectedPose(null)}>
                    <div
                        className="scene-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            onClick={() => setSelectedPose(null)}
                        >
                            ×
                        </button>

                        {selectedPose.imageUrl && (
                            <div
                                className="modal-image-wrap"
                                onClick={() =>
                                    setLightboxImage({
                                        src: resolveImageUrl(
                                            selectedPose.imageUrl,
                                            apiBaseUrl
                                        ),
                                        alt: selectedPose.title,
                                    })
                                }
                                title="Click to view full screen"
                            >
                                <img
                                    src={resolveImageUrl(selectedPose.imageUrl, apiBaseUrl)}
                                    alt={selectedPose.title}
                                    className="modal-image"
                                />
                                <span className="image-zoom-hint">⤢ Click to expand</span>
                            </div>
                        )}

                        <p className="eyebrow">
                            {selectedPose.location} · POSE{" "}
                            {String(selectedPose.poseNumber || 0).padStart(2, "0")}
                        </p>
                        <h2>{selectedPose.title}</h2>
                        <p className="modal-movie">Vibe · {selectedPose.vibe}</p>

                        <div className="modal-divider" />

                        <div className="vibe-grid">
                            <div className="vibe-item">
                                <span>CAMERA ANGLE</span>
                                <p>{selectedPose.cameraAngle}</p>
                            </div>
                            <div className="vibe-item">
                                <span>BODY POSITIONING</span>
                                <p>{selectedPose.bodyPosition}</p>
                            </div>
                            <div className="vibe-item">
                                <span>HAND PLACEMENT</span>
                                <p>{selectedPose.handPlacement}</p>
                            </div>
                            {selectedPose.proTip && (
                                <div className="vibe-item">
                                    <span>DIRECTOR&apos;S PRO TIP</span>
                                    <p>{selectedPose.proTip}</p>
                                </div>
                            )}
                        </div>

                        <button
                            className="modal-save"
                            onClick={() => toggleSavePose(selectedPose._id)}
                        >
                            {savedPoses.includes(selectedPose._id)
                                ? "♥  SAVED TO YOUR POSE LIST"
                                : "♡  SAVE THIS POSE"}
                        </button>

                        {selectedPose.isUserCreated && (
                            <div className="modal-delete-area">
                                <button
                                    className="delete-scene-button"
                                    onClick={() => handleDeletePose(selectedPose._id)}
                                >
                                    Delete my added pose
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAddPose && (
                <div className="modal-overlay" onClick={() => setShowAddPose(false)}>
                    <div
                        className="scene-modal add-scene-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            onClick={() => setShowAddPose(false)}
                        >
                            ×
                        </button>

                        <p className="eyebrow">POSE STEALER</p>
                        <h2>Add a pose reference.</h2>
                        {formError && <p className="form-error">{formError}</p>}

                        <form className="add-scene-form" onSubmit={handleAddPose}>
                            <div className="form-row">
                                <label>
                                    <span>Pose Title *</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. The Balcony Coffee Lean"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    <span>Location *</span>
                                    <select
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    >
                                        {POSE_LOCATIONS.filter((l) => l !== "All").map(
                                            (loc) => (
                                                <option key={loc} value={loc}>
                                                    {loc}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>
                            </div>

                            <label>
                                <span>Vibe / Aesthetic</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Parisian Chic"
                                    value={vibe}
                                    onChange={(e) => setVibe(e.target.value)}
                                />
                            </label>

                            <PhotoUpload
                                apiBaseUrl={apiBaseUrl}
                                value={imageUrl}
                                onChange={setImageUrl}
                                label="Reference Photo (optional)"
                            />

                            <label>
                                <span>Camera Angle *</span>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Slightly low angle at 1.5x portrait zoom..."
                                    value={cameraAngle}
                                    onChange={(e) => setCameraAngle(e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                <span>Body Positioning *</span>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Turn shoulders 45° away and look over your front shoulder..."
                                    value={bodyPosition}
                                    onChange={(e) => setBodyPosition(e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                <span>Hand Placement *</span>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Hold coffee cup loosely or tuck hair behind ear..."
                                    value={handPlacement}
                                    onChange={(e) => setHandPlacement(e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                <span>Pro Tip (optional)</span>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Use golden hour backlight for a soft glow..."
                                    value={proTip}
                                    onChange={(e) => setProTip(e.target.value)}
                                />
                            </label>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setShowAddPose(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-save form-submit-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? "SAVING POSE..." : "SAVE POSE"}
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

export default PoseStealer;
