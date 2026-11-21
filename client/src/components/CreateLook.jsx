import { useState, useEffect } from "react";
import PhotoUpload from "./PhotoUpload";
import ImageLightbox from "./ImageLightbox";
import { resolveImageUrl } from "../utils/imageUrl";

const OCCASIONS = [
    "All",
    "Everyday Chic",
    "Date Night",
    "Brunch",
    "Party / Gala",
    "Work / Office",
    "Travel",
    "Cozy Day",
];

const PIECE_SLOTS = [
    { key: "outfit", label: "Outfit", placeholder: "e.g. Tailored ivory blazer & silk slip" },
    { key: "makeup", label: "Makeup", placeholder: "e.g. Espresso liner & glossy berry lip" },
    { key: "heels", label: "Heels / Shoes", placeholder: "e.g. Black pointed slingback heels" },
    { key: "bag", label: "Bag", placeholder: "e.g. Structured burgundy mini shoulder bag" },
    { key: "accessories", label: "Accessories", placeholder: "e.g. Chunky gold hoops & vintage watch" },
    { key: "hairstyle", label: "Hairstyle / Perfume", placeholder: "e.g. Sleek low bun + warm vanilla scent" },
];

function createEmptyPieces() {
    return {
        outfit: { imageUrl: "", note: "" },
        makeup: { imageUrl: "", note: "" },
        heels: { imageUrl: "", note: "" },
        bag: { imageUrl: "", note: "" },
        accessories: { imageUrl: "", note: "" },
        hairstyle: { imageUrl: "", note: "" },
    };
}

function CreateLook({ apiBaseUrl }) {
    const [looks, setLooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeOccasion, setActiveOccasion] = useState("All");
    const [search, setSearch] = useState("");
    const [lightboxImage, setLightboxImage] = useState(null);

    // Modal state (shared for Create & Edit)
    const [showModal, setShowModal] = useState(false);
    const [editingLook, setEditingLook] = useState(null);
    const [title, setTitle] = useState("");
    const [occasion, setOccasion] = useState("Everyday Chic");
    const [vibe, setVibe] = useState("");
    const [notes, setNotes] = useState("");
    const [pieces, setPieces] = useState(createEmptyPieces);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        let cancelled = false;
        fetch(`${apiBaseUrl}/api/looks`)
            .then((res) => {
                if (!res.ok) throw new Error("Unable to load your looks.");
                return res.json();
            })
            .then((data) => {
                if (!cancelled) setLooks(data);
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

    function openCreateModal() {
        setEditingLook(null);
        setTitle("");
        setOccasion("Everyday Chic");
        setVibe("");
        setNotes("");
        setPieces(createEmptyPieces());
        setFormError("");
        setShowModal(true);
    }

    function openEditModal(look) {
        setEditingLook(look);
        setTitle(look.title || "");
        setOccasion(look.occasion || "Everyday Chic");
        setVibe(look.vibe || "");
        setNotes(look.notes || "");
        const base = createEmptyPieces();
        for (const slot of PIECE_SLOTS) {
            if (look.pieces?.[slot.key]) {
                base[slot.key] = {
                    imageUrl: look.pieces[slot.key].imageUrl || "",
                    note: look.pieces[slot.key].note || "",
                };
            }
        }
        setPieces(base);
        setFormError("");
        setShowModal(true);
    }

    function updatePiece(key, field, value) {
        setPieces((prev) => ({
            ...prev,
            [key]: { ...prev[key], [field]: value },
        }));
    }

    async function handleSaveLook(e) {
        e.preventDefault();
        setFormError("");
        if (!title.trim()) {
            setFormError("Please give your look a title.");
            return;
        }

        setSubmitting(true);
        try {
            const url = editingLook
                ? `${apiBaseUrl}/api/looks/${editingLook._id}`
                : `${apiBaseUrl}/api/looks`;
            const method = editingLook ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    occasion,
                    vibe: vibe.trim(),
                    notes: notes.trim(),
                    pieces,
                }),
            });

            const saved = await res.json();
            if (!res.ok) throw new Error(saved.message || "Failed to save look.");

            if (editingLook) {
                setLooks((prev) =>
                    prev.map((l) => (l._id === saved._id ? saved : l))
                );
            } else {
                setLooks((prev) => [saved, ...prev]);
            }
            setShowModal(false);
            setEditingLook(null);
        } catch (err) {
            setFormError(err.message || "Could not save look.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteLook(id) {
        try {
            const res = await fetch(`${apiBaseUrl}/api/looks/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setLooks((prev) => prev.filter((l) => l._id !== id));
            }
        } catch (err) {
            setError(err.message);
        }
    }

    const filteredLooks = looks.filter((look) => {
        const matchesOccasion =
            activeOccasion === "All" || look.occasion === activeOccasion;
        const q = search.trim().toLowerCase();
        const matchesSearch =
            !q ||
            look.title.toLowerCase().includes(q) ||
            (look.vibe || "").toLowerCase().includes(q) ||
            (look.notes || "").toLowerCase().includes(q) ||
            (look.occasion || "").toLowerCase().includes(q);
        return matchesOccasion && matchesSearch;
    });

    return (
        <section className="discover-section">
            <div className="section-heading">
                <div>
                    <p className="eyebrow">CREATE A LOOK · YOUR ORIGINAL STYLE</p>
                    <h2>Build your signature flat-lay looks.</h2>
                </div>

                <button
                    className="explore-button daily-btn"
                    onClick={openCreateModal}
                >
                    + Create a Look
                </button>
            </div>

            <div className="search-box">
                <span>⌕</span>
                <input
                    placeholder="Search your looks by title, vibe, occasion, or notes..."
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
                <span className="filter-block-label">OCCASION</span>
                <div className="category-list">
                    {OCCASIONS.map((occ) => (
                        <button
                            key={occ}
                            className={`category-button ${
                                activeOccasion === occ ? "active" : ""
                            }`}
                            onClick={() => setActiveOccasion(occ)}
                        >
                            {occ}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="status-state">
                    <div className="loading-spinner" />
                    <h3>Loading your lookbook...</h3>
                </div>
            )}

            {!loading && error && (
                <div className="status-state">
                    <h3>Could not load looks.</h3>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && filteredLooks.length > 0 && (
                <div className="looks-grid">
                    {filteredLooks.map((look) => {
                        const activeSlots = PIECE_SLOTS.filter(
                            (slot) =>
                                look.pieces?.[slot.key]?.imageUrl ||
                                look.pieces?.[slot.key]?.note
                        );

                        return (
                            <article className="look-card" key={look._id}>
                                <div className="look-card-header">
                                    <div>
                                        <span className="category-label">
                                            {look.occasion}
                                        </span>
                                        <h3>{look.title}</h3>
                                        {look.vibe && (
                                            <p className="movie-name">Vibe · {look.vibe}</p>
                                        )}
                                    </div>
                                    <div className="look-card-actions">
                                        <button
                                            className="edit-scene-card-btn"
                                            onClick={() => openEditModal(look)}
                                        >
                                            EDIT
                                        </button>
                                        <button
                                            className="pin-remove-btn"
                                            onClick={() => handleDeleteLook(look._id)}
                                            title="Delete look"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                {activeSlots.length > 0 ? (
                                    <div className="look-collage-grid">
                                        {activeSlots.map((slot) => {
                                            const piece = look.pieces[slot.key];
                                            const imgSrc = resolveImageUrl(
                                                piece.imageUrl,
                                                apiBaseUrl
                                            );
                                            return (
                                                <div
                                                    className="look-piece-tile"
                                                    key={slot.key}
                                                >
                                                    <span className="look-piece-label">
                                                        {slot.label}
                                                    </span>
                                                    {imgSrc && (
                                                        <div
                                                            className="look-piece-img-wrap"
                                                            onClick={() =>
                                                                setLightboxImage({
                                                                    src: imgSrc,
                                                                    alt: `${look.title} — ${slot.label}`,
                                                                })
                                                            }
                                                            title="Click to view full screen"
                                                        >
                                                            <img
                                                                src={imgSrc}
                                                                alt={slot.label}
                                                                className="look-piece-img"
                                                            />
                                                        </div>
                                                    )}
                                                    {piece.note && (
                                                        <p className="look-piece-note">
                                                            {piece.note}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="card-description">
                                        No pieces added yet — click EDIT to upload photos
                                        for outfit, makeup, heels, bag, and accessories.
                                    </p>
                                )}

                                {look.notes && (
                                    <p className="look-overall-notes">{look.notes}</p>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {!loading && !error && filteredLooks.length === 0 && (
                <div className="empty-state">
                    <h3>Your personal lookbook is waiting.</h3>
                    <p>
                        Upload separate photos for your outfit, makeup, heels, bag,
                        accessories, and hairstyle to style a complete look of your own.
                    </p>
                    <button onClick={openCreateModal}>+ Create your first look</button>
                </div>
            )}

            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        setShowModal(false);
                        setEditingLook(null);
                    }}
                >
                    <div
                        className="scene-modal create-look-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            onClick={() => {
                                setShowModal(false);
                                setEditingLook(null);
                            }}
                        >
                            ×
                        </button>

                        <p className="eyebrow">
                            {editingLook ? "EDIT YOUR LOOK" : "CREATE A LOOK"}
                        </p>
                        <h2>
                            {editingLook
                                ? "Refine your style board."
                                : "Style your own look."}
                        </h2>

                        {formError && <p className="form-error">{formError}</p>}

                        <form className="add-scene-form" onSubmit={handleSaveLook}>
                            <div className="form-row">
                                <label>
                                    <span>Look Name *</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Candlelit Rooftop Dinner"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    <span>Occasion</span>
                                    <select
                                        value={occasion}
                                        onChange={(e) => setOccasion(e.target.value)}
                                    >
                                        {OCCASIONS.filter((o) => o !== "All").map((o) => (
                                            <option key={o} value={o}>
                                                {o}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label>
                                <span>Personal Vibe / Mood (optional)</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Dark Feminine, Soft Parisian, Clean Minimal"
                                    value={vibe}
                                    onChange={(e) => setVibe(e.target.value)}
                                />
                            </label>

                            <div className="look-slots-editor">
                                <span className="form-label">
                                    UPLOAD SEPARATE PHOTOS FOR EACH PIECE (ALL OPTIONAL)
                                </span>
                                <div className="look-slots-editor-grid">
                                    {PIECE_SLOTS.map((slot) => (
                                        <div
                                            className="look-slot-editor-card"
                                            key={slot.key}
                                        >
                                            <h4>{slot.label}</h4>
                                            <PhotoUpload
                                                apiBaseUrl={apiBaseUrl}
                                                value={pieces[slot.key].imageUrl}
                                                onChange={(url) =>
                                                    updatePiece(slot.key, "imageUrl", url)
                                                }
                                                label={`${slot.label} Photo`}
                                            />
                                            <input
                                                type="text"
                                                placeholder={slot.placeholder}
                                                value={pieces[slot.key].note}
                                                onChange={(e) =>
                                                    updatePiece(
                                                        slot.key,
                                                        "note",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <label>
                                <span>Overall Styling Notes (optional)</span>
                                <textarea
                                    rows={2}
                                    placeholder="Any notes about fit, weather, scent, or where you'll wear it..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </label>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingLook(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-save form-submit-btn"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "SAVING LOOK..."
                                        : editingLook
                                            ? "SAVE LOOK CHANGES"
                                            : "SAVE TO LOOKBOOK"}
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

export default CreateLook;
