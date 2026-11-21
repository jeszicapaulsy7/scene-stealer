import { useState, useEffect, useRef } from "react";
import ImageLightbox from "./ImageLightbox";
import { resolveImageUrl } from "../utils/imageUrl";
import { parseMusicLink } from "../utils/musicEmbed";

const MAX_PHOTOS = 7;

const MOOD_OPTIONS = [
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

const PIN_FILTERS = [
    { id: "all", label: "All Pins" },
    { id: "photo", label: "Photos" },
    { id: "outfit", label: "Outfits" },
    { id: "quote", label: "Quotes" },
    { id: "note", label: "Notes" },
];

function MultiPhotoPicker({ apiBaseUrl, photos, onChange, label }) {
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [urlDraft, setUrlDraft] = useState("");
    const inputRef = useRef(null);

    const remaining = MAX_PHOTOS - photos.length;

    async function handleFilesChange(event) {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const batch = files.slice(0, remaining);
        if (batch.length === 0) return;

        setUploadError("");
        setUploading(true);
        const uploadedUrls = [];

        try {
            for (const file of batch) {
                const formData = new FormData();
                formData.append("image", file);
                const res = await fetch(`${apiBaseUrl}/api/upload`, {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Failed to upload one of the photos.");
                }
                uploadedUrls.push(data.imageUrl);
            }
            onChange([...photos, ...uploadedUrls].slice(0, MAX_PHOTOS));
        } catch (err) {
            setUploadError(err.message || "Photo upload failed.");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    function handleAddUrl() {
        const trimmed = urlDraft.trim();
        if (!trimmed || photos.length >= MAX_PHOTOS) return;
        onChange([...photos, trimmed].slice(0, MAX_PHOTOS));
        setUrlDraft("");
    }

    function handleRemove(index) {
        onChange(photos.filter((_, i) => i !== index));
    }

    return (
        <div className="photo-upload-field">
            <div className="music-form-header">
                <span className="form-label">{label}</span>
                <span className="multi-photo-count">
                    {photos.length} / {MAX_PHOTOS} photos
                </span>
            </div>

            {remaining > 0 && (
                <div className="photo-upload-controls">
                    <button
                        type="button"
                        className="photo-upload-btn"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading
                            ? "Uploading..."
                            : `↑ Upload photos (up to ${remaining} more)`}
                    </button>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFilesChange}
                        className="sr-only"
                    />

                    <input
                        type="text"
                        placeholder="Or paste image URL..."
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddUrl();
                            }
                        }}
                        className="photo-url-input"
                    />

                    {urlDraft.trim() && (
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleAddUrl}
                        >
                            + Add
                        </button>
                    )}
                </div>
            )}

            {uploadError && <p className="photo-upload-error">{uploadError}</p>}

            {photos.length > 0 && (
                <div className="multi-photo-thumbs">
                    {photos.map((url, idx) => (
                        <div className="multi-photo-thumb" key={`${url}-${idx}`}>
                            <img
                                src={resolveImageUrl(url, apiBaseUrl)}
                                alt={`Upload ${idx + 1}`}
                            />
                            <button
                                type="button"
                                className="multi-photo-remove"
                                onClick={() => handleRemove(idx)}
                                title="Remove photo"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Moodboards({ apiBaseUrl }) {
    const [boards, setBoards] = useState([]);
    const [activeBoardId, setActiveBoardId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copiedHex, setCopiedHex] = useState("");
    const [lightboxImage, setLightboxImage] = useState(null);
    const [pinFilter, setPinFilter] = useState("all");
    const [galleryMode, setGalleryMode] = useState(false);
    const [showSoundtrack, setShowSoundtrack] = useState(false);

    // Create / Edit Board modal
    const [showBoardModal, setShowBoardModal] = useState(false);
    const [editingBoard, setEditingBoard] = useState(null);
    const [boardTitle, setBoardTitle] = useState("");
    const [boardMood, setBoardMood] = useState("Romantic");
    const [boardDesc, setBoardDesc] = useState("");
    const [boardMusicUrl, setBoardMusicUrl] = useState("");
    const [boardPhotos, setBoardPhotos] = useState([]);
    const [savingBoard, setSavingBoard] = useState(false);

    // Add / Edit Pin modal
    const [showPinModal, setShowPinModal] = useState(false);
    const [editingPin, setEditingPin] = useState(null);
    const [itemType, setItemType] = useState("photo");
    const [itemTitle, setItemTitle] = useState("");
    const [itemContent, setItemContent] = useState("");
    const [itemImages, setItemImages] = useState([]);
    const [itemError, setItemError] = useState("");
    const [savingPin, setSavingPin] = useState(false);

    // Color picker
    const [newColor, setNewColor] = useState("#c49a70");

    useEffect(() => {
        let cancelled = false;
        fetch(`${apiBaseUrl}/api/moodboards`)
            .then((res) => {
                if (!res.ok) throw new Error("Unable to load moodboards.");
                return res.json();
            })
            .then((data) => {
                if (!cancelled) {
                    setBoards(data);
                    if (data.length > 0) setActiveBoardId(data[0]._id);
                }
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

    const activeBoard =
        boards.find((b) => b._id === activeBoardId) || boards[0] || null;

    function openCreateBoardModal() {
        setEditingBoard(null);
        setBoardTitle("");
        setBoardMood("Romantic");
        setBoardDesc("");
        setBoardMusicUrl("");
        setBoardPhotos([]);
        setShowBoardModal(true);
    }

    function openEditBoardModal(board) {
        setEditingBoard(board);
        setBoardTitle(board.title || "");
        setBoardMood(board.mood || "Romantic");
        setBoardDesc(board.description || "");
        setBoardMusicUrl(board.musicUrl || "");
        setBoardPhotos([]);
        setShowBoardModal(true);
    }

    function openAddPinModal() {
        setEditingPin(null);
        setItemType("photo");
        setItemTitle("");
        setItemContent("");
        setItemImages([]);
        setItemError("");
        setShowPinModal(true);
    }

    function openEditPinModal(pin) {
        setEditingPin(pin);
        setItemType(pin.type || "note");
        setItemTitle(pin.title || "");
        setItemContent(pin.content || "");
        const existingPhotos =
            Array.isArray(pin.images) && pin.images.length > 0
                ? pin.images
                : pin.imageUrl
                    ? [pin.imageUrl]
                    : [];
        setItemImages(existingPhotos);
        setItemError("");
        setShowPinModal(true);
    }

    async function handleSaveBoard(e) {
        e.preventDefault();
        if (!boardTitle.trim()) return;
        setSavingBoard(true);
        try {
            const url = editingBoard
                ? `${apiBaseUrl}/api/moodboards/${editingBoard._id}`
                : `${apiBaseUrl}/api/moodboards`;
            const method = editingBoard ? "PUT" : "POST";

            const payload = {
                title: boardTitle.trim(),
                mood: boardMood,
                description: boardDesc.trim(),
                musicUrl: boardMusicUrl.trim(),
            };
            if (!editingBoard) {
                payload.photos = boardPhotos;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const saved = await res.json();
            if (!res.ok) throw new Error(saved.message || "Failed to save board");

            if (editingBoard) {
                setBoards((prev) =>
                    prev.map((b) => (b._id === saved._id ? saved : b))
                );
            } else {
                setBoards((prev) => [saved, ...prev]);
                setActiveBoardId(saved._id);
            }
            setShowBoardModal(false);
            setEditingBoard(null);
            setShowSoundtrack(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingBoard(false);
        }
    }

    async function handleSavePin(e) {
        e.preventDefault();
        setItemError("");
        if (!activeBoard) return;
        if (itemType === "photo" && itemImages.length === 0) {
            setItemError("Please upload at least 1 photo (up to 7) or paste an image URL.");
            return;
        }
        if (itemType !== "photo" && !itemContent.trim()) {
            setItemError("Please enter content before saving.");
            return;
        }

        setSavingPin(true);
        try {
            const url = editingPin
                ? `${apiBaseUrl}/api/moodboards/${activeBoard._id}/items/${editingPin._id}`
                : `${apiBaseUrl}/api/moodboards/${activeBoard._id}/items`;
            const method = editingPin ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: itemType,
                    title: itemTitle.trim(),
                    content: itemContent.trim(),
                    imageUrl: itemImages[0] || "",
                    images: itemImages,
                }),
            });
            const updatedBoard = await res.json();
            if (!res.ok) throw new Error(updatedBoard.message || "Failed to save pin");
            setBoards((prev) =>
                prev.map((b) => (b._id === updatedBoard._id ? updatedBoard : b))
            );
            setShowPinModal(false);
            setEditingPin(null);
        } catch (err) {
            setItemError(err.message);
        } finally {
            setSavingPin(false);
        }
    }

    async function handleRemoveItem(itemId) {
        if (!activeBoard) return;
        try {
            const res = await fetch(
                `${apiBaseUrl}/api/moodboards/${activeBoard._id}/items/${itemId}`,
                { method: "DELETE" }
            );
            const updatedBoard = await res.json();
            if (res.ok) {
                setBoards((prev) =>
                    prev.map((b) => (b._id === updatedBoard._id ? updatedBoard : b))
                );
            }
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleReorderPin(fromIndex, toIndex) {
        if (!activeBoard) return;
        try {
            const res = await fetch(
                `${apiBaseUrl}/api/moodboards/${activeBoard._id}/reorder`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fromIndex, toIndex }),
                }
            );
            const updatedBoard = await res.json();
            if (res.ok) {
                setBoards((prev) =>
                    prev.map((b) => (b._id === updatedBoard._id ? updatedBoard : b))
                );
            }
        } catch (err) {
            setError(err.message);
        }
    }

    async function updateBoardColors(nextColors) {
        if (!activeBoard) return;
        try {
            const res = await fetch(
                `${apiBaseUrl}/api/moodboards/${activeBoard._id}/colors`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ colors: nextColors }),
                }
            );
            const updatedBoard = await res.json();
            if (res.ok) {
                setBoards((prev) =>
                    prev.map((b) => (b._id === updatedBoard._id ? updatedBoard : b))
                );
            }
        } catch (err) {
            setError(err.message);
        }
    }

    function handleAddColor() {
        if (!activeBoard) return;
        if ((activeBoard.colors || []).includes(newColor)) return;
        updateBoardColors([...(activeBoard.colors || []), newColor]);
    }

    function handleRemoveColor(hexToRemove) {
        if (!activeBoard) return;
        updateBoardColors((activeBoard.colors || []).filter((c) => c !== hexToRemove));
    }

    async function handleDeleteBoard(boardId) {
        try {
            const res = await fetch(`${apiBaseUrl}/api/moodboards/${boardId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                const remaining = boards.filter((b) => b._id !== boardId);
                setBoards(remaining);
                setActiveBoardId(remaining[0]?._id || null);
            }
        } catch (err) {
            setError(err.message);
        }
    }

    function copySwatch(hex) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(hex).catch(() => {});
        }
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(""), 1400);
    }

    const visibleItems = (activeBoard?.items || []).filter(
        (item) => pinFilter === "all" || item.type === pinFilter
    );

    const boardMusicInfo = activeBoard?.musicUrl
        ? parseMusicLink(activeBoard.musicUrl)
        : null;

    return (
        <section className="discover-section">
            {!galleryMode && (
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">AESTHETIC MOODBOARDS</p>
                        <h2>Curate your visual world.</h2>
                    </div>

                    <button
                        className="explore-button daily-btn"
                        onClick={openCreateBoardModal}
                    >
                        + New Moodboard
                    </button>
                </div>
            )}

            {loading && (
                <div className="status-state">
                    <div className="loading-spinner" />
                    <h3>Loading your moodboards...</h3>
                </div>
            )}

            {!loading && error && (
                <div className="status-state">
                    <h3>Could not load moodboards.</h3>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && (
                <>
                    {!galleryMode && (
                        <div className="board-selector-bar">
                            {boards.map((board) => (
                                <button
                                    key={board._id}
                                    className={`category-button ${
                                        activeBoard?._id === board._id ? "active" : ""
                                    }`}
                                    onClick={() => {
                                        setActiveBoardId(board._id);
                                        setPinFilter("all");
                                        setShowSoundtrack(false);
                                    }}
                                >
                                    {board.title} ({board.items?.length || 0})
                                </button>
                            ))}
                        </div>
                    )}

                    {activeBoard ? (
                        <div
                            className={`board-canvas ${
                                galleryMode ? "gallery-mode-canvas" : ""
                            }`}
                        >
                            <div className="board-canvas-header">
                                <div>
                                    <span className="mood-badge">
                                        ✦ {activeBoard.mood}
                                    </span>
                                    <h3 className="board-title">{activeBoard.title}</h3>
                                    {activeBoard.description && (
                                        <p className="board-description">
                                            {activeBoard.description}
                                        </p>
                                    )}
                                </div>

                                <div className="board-header-actions">
                                    {!galleryMode && (
                                        <>
                                            <button
                                                className="explore-button daily-btn"
                                                onClick={openAddPinModal}
                                            >
                                                + Pin Photos / Quote / Outfit
                                            </button>
                                            <button
                                                className="secondary-button"
                                                onClick={() =>
                                                    openEditBoardModal(activeBoard)
                                                }
                                            >
                                                ✎ Edit Board
                                            </button>
                                            <button
                                                className="secondary-button"
                                                onClick={() =>
                                                    handleDeleteBoard(activeBoard._id)
                                                }
                                            >
                                                Delete Board
                                            </button>
                                        </>
                                    )}

                                    <button
                                        className={`secondary-button ${
                                            galleryMode ? "gallery-exit-btn" : ""
                                        }`}
                                        onClick={() => setGalleryMode((prev) => !prev)}
                                    >
                                        {galleryMode
                                            ? "✕ Exit Gallery Mode"
                                            : "⤢ Gallery Mode"}
                                    </button>
                                </div>
                            </div>

                            {boardMusicInfo && !boardMusicInfo.isEmpty && (
                                <div className="scene-music-section board-soundtrack-bar">
                                    <div className="scene-music-header">
                                        <div>
                                            <span className="scene-music-label">
                                                ♫ BOARD SOUNDTRACK
                                            </span>
                                            <span className="scene-music-source">
                                                {boardMusicInfo.platform}
                                            </span>
                                        </div>

                                        <div className="scene-music-actions">
                                            {boardMusicInfo.isValid &&
                                            boardMusicInfo.canEmbed ? (
                                                <button
                                                    type="button"
                                                    className="listen-scene-btn"
                                                    onClick={() =>
                                                        setShowSoundtrack((prev) => !prev)
                                                    }
                                                >
                                                    {showSoundtrack
                                                        ? "Hide Player"
                                                        : "▶ Play Board Soundtrack"}
                                                </button>
                                            ) : boardMusicInfo.isValid ? (
                                                <a
                                                    href={boardMusicInfo.originalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="listen-scene-btn"
                                                >
                                                    Open Soundtrack ↗
                                                </a>
                                            ) : null}

                                            {boardMusicInfo.isValid &&
                                                boardMusicInfo.canEmbed && (
                                                    <a
                                                        href={boardMusicInfo.originalUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="open-source-link"
                                                    >
                                                        Open Source ↗
                                                    </a>
                                                )}
                                        </div>
                                    </div>

                                    {showSoundtrack &&
                                        boardMusicInfo.isValid &&
                                        boardMusicInfo.canEmbed && (
                                            <div className="scene-music-embed">
                                                {boardMusicInfo.embedKind === "audio" ? (
                                                    <audio
                                                        src={boardMusicInfo.embedUrl}
                                                        controls
                                                        autoPlay
                                                        style={{
                                                            width: "100%",
                                                            display: "block",
                                                        }}
                                                    />
                                                ) : (
                                                    <iframe
                                                        src={boardMusicInfo.embedUrl}
                                                        title={`Soundtrack for ${activeBoard.title}`}
                                                        width="100%"
                                                        height={
                                                            boardMusicInfo.embedHeight ||
                                                            166
                                                        }
                                                        frameBorder="0"
                                                        referrerPolicy="strict-origin-when-cross-origin"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        loading="lazy"
                                                    />
                                                )}
                                            </div>
                                        )}
                                </div>
                            )}

                            <div className="palette-bar">
                                <span className="filter-block-label">COLOR PALETTE</span>
                                <div className="palette-swatches">
                                    {(activeBoard.colors || []).map((hex) => (
                                        <div className="swatch-chip-wrap" key={hex}>
                                            <button
                                                type="button"
                                                className="swatch-chip"
                                                onClick={() => copySwatch(hex)}
                                                title="Click to copy hex"
                                            >
                                                <span
                                                    className="swatch-dot"
                                                    style={{ backgroundColor: hex }}
                                                />
                                                <span>
                                                    {copiedHex === hex ? "Copied!" : hex}
                                                </span>
                                            </button>
                                            {!galleryMode && (
                                                <button
                                                    type="button"
                                                    className="swatch-remove-btn"
                                                    onClick={() =>
                                                        handleRemoveColor(hex)
                                                    }
                                                    title="Remove color"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {!galleryMode && (
                                        <div className="swatch-adder">
                                            <input
                                                type="color"
                                                value={newColor}
                                                onChange={(e) =>
                                                    setNewColor(e.target.value)
                                                }
                                                aria-label="Pick palette color"
                                            />
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={handleAddColor}
                                            >
                                                + Add Color
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!galleryMode && (activeBoard.items || []).length > 0 && (
                                <div className="pin-filter-bar">
                                    {PIN_FILTERS.map((f) => {
                                        const count =
                                            f.id === "all"
                                                ? activeBoard.items.length
                                                : activeBoard.items.filter(
                                                      (i) => i.type === f.id
                                                  ).length;
                                        return (
                                            <button
                                                key={f.id}
                                                type="button"
                                                className={`mood-pill ${
                                                    pinFilter === f.id ? "active" : ""
                                                }`}
                                                onClick={() => setPinFilter(f.id)}
                                            >
                                                {f.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {visibleItems.length > 0 ? (
                                <div className="moodboard-grid">
                                    {visibleItems.map((item, idx) => {
                                        const pinPhotos =
                                            Array.isArray(item.images) &&
                                            item.images.length > 0
                                                ? item.images
                                                : item.imageUrl
                                                    ? [item.imageUrl]
                                                    : [];

                                        return (
                                            <article
                                                key={item._id}
                                                className={`board-pin board-pin-${item.type}`}
                                            >
                                                {!galleryMode && (
                                                    <div className="board-pin-top">
                                                        <span className="category-label">
                                                            {item.type}
                                                            {pinPhotos.length > 1
                                                                ? ` · ${pinPhotos.length} PHOTOS`
                                                                : ""}
                                                        </span>
                                                        <div className="board-pin-controls">
                                                            {pinFilter === "all" && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="pin-icon-btn"
                                                                        disabled={idx === 0}
                                                                        onClick={() =>
                                                                            handleReorderPin(
                                                                                idx,
                                                                                idx - 1
                                                                            )
                                                                        }
                                                                        title="Move earlier"
                                                                    >
                                                                        ←
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="pin-icon-btn"
                                                                        disabled={
                                                                            idx ===
                                                                            visibleItems.length -
                                                                                1
                                                                        }
                                                                        onClick={() =>
                                                                            handleReorderPin(
                                                                                idx,
                                                                                idx + 1
                                                                            )
                                                                        }
                                                                        title="Move later"
                                                                    >
                                                                        →
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="pin-icon-btn"
                                                                onClick={() =>
                                                                    openEditPinModal(item)
                                                                }
                                                                title="Edit pin"
                                                            >
                                                                ✎
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="pin-remove-btn"
                                                                onClick={() =>
                                                                    handleRemoveItem(
                                                                        item._id
                                                                    )
                                                                }
                                                                title="Remove item"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {pinPhotos.length === 1 && (
                                                    <div
                                                        className="board-pin-img-wrap"
                                                        onClick={() =>
                                                            setLightboxImage({
                                                                src: resolveImageUrl(
                                                                    pinPhotos[0],
                                                                    apiBaseUrl
                                                                ),
                                                                alt:
                                                                    item.title ||
                                                                    "Moodboard pin",
                                                            })
                                                        }
                                                        title="Click to view full screen"
                                                    >
                                                        <img
                                                            src={resolveImageUrl(
                                                                pinPhotos[0],
                                                                apiBaseUrl
                                                            )}
                                                            alt={
                                                                item.title ||
                                                                "Moodboard pin"
                                                            }
                                                            className="board-pin-img"
                                                        />
                                                    </div>
                                                )}

                                                {pinPhotos.length > 1 && (
                                                    <div className="board-pin-collage">
                                                        {pinPhotos.map((url, pIdx) => (
                                                            <div
                                                                key={`${item._id}-img-${pIdx}`}
                                                                className="board-collage-cell"
                                                                onClick={() =>
                                                                    setLightboxImage({
                                                                        src: resolveImageUrl(
                                                                            url,
                                                                            apiBaseUrl
                                                                        ),
                                                                        alt: `${item.title || "Moodboard"} photo ${pIdx + 1}`,
                                                                    })
                                                                }
                                                                title="Click to view full screen"
                                                            >
                                                                <img
                                                                    src={resolveImageUrl(
                                                                        url,
                                                                        apiBaseUrl
                                                                    )}
                                                                    alt={`Pin ${pIdx + 1}`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {item.title && (
                                                    <h4 className="board-pin-title">
                                                        {item.title}
                                                    </h4>
                                                )}

                                                {item.content && (
                                                    <p className="board-pin-content">
                                                        {item.type === "quote"
                                                            ? `“${item.content}”`
                                                            : item.content}
                                                    </p>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <h3>
                                        {pinFilter === "all"
                                            ? "This board is a blank canvas."
                                            : `No ${pinFilter} pins on this board yet.`}
                                    </h3>
                                    <p>
                                        Pin up to 7 photos, quotes, outfit formulas, or
                                        notes to bring this aesthetic to life.
                                    </p>
                                    <button onClick={openAddPinModal}>
                                        + Pin inspiration
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3>No moodboards yet.</h3>
                            <p>Create your first aesthetic board to get started.</p>
                            <button onClick={openCreateBoardModal}>
                                + Create Moodboard
                            </button>
                        </div>
                    )}
                </>
            )}

            {showBoardModal && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        setShowBoardModal(false);
                        setEditingBoard(null);
                    }}
                >
                    <div
                        className="scene-modal add-scene-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            onClick={() => {
                                setShowBoardModal(false);
                                setEditingBoard(null);
                            }}
                        >
                            ×
                        </button>
                        <p className="eyebrow">
                            {editingBoard ? "EDIT MOODBOARD" : "NEW MOODBOARD"}
                        </p>
                        <h2>
                            {editingBoard
                                ? "Update your board."
                                : "Name your aesthetic."}
                        </h2>

                        <form className="add-scene-form" onSubmit={handleSaveBoard}>
                            <label>
                                <span>Board Title *</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Old Money Winter"
                                    value={boardTitle}
                                    onChange={(e) => setBoardTitle(e.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                <span>Primary Mood</span>
                                <select
                                    value={boardMood}
                                    onChange={(e) => setBoardMood(e.target.value)}
                                >
                                    {MOOD_OPTIONS.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Description (optional)</span>
                                <textarea
                                    rows={2}
                                    placeholder="Describe the feeling, textures, or inspiration behind this board..."
                                    value={boardDesc}
                                    onChange={(e) => setBoardDesc(e.target.value)}
                                />
                            </label>

                            <div className="music-form-section">
                                <div className="music-form-header">
                                    <span className="form-label">
                                        ♫ Board Soundtrack Link (optional)
                                    </span>
                                    {boardMusicUrl.trim() && (
                                        <button
                                            type="button"
                                            className="remove-music-btn"
                                            onClick={() => setBoardMusicUrl("")}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Paste a YouTube, Spotify, or SoundCloud playlist/song link..."
                                    value={boardMusicUrl}
                                    onChange={(e) => setBoardMusicUrl(e.target.value)}
                                />
                            </div>

                            {!editingBoard && (
                                <MultiPhotoPicker
                                    apiBaseUrl={apiBaseUrl}
                                    photos={boardPhotos}
                                    onChange={setBoardPhotos}
                                    label="Starter Photos (Optional · Up to 7)"
                                />
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        setShowBoardModal(false);
                                        setEditingBoard(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-save form-submit-btn"
                                    disabled={savingBoard}
                                >
                                    {savingBoard
                                        ? "SAVING..."
                                        : editingBoard
                                            ? "SAVE BOARD CHANGES"
                                            : "CREATE BOARD"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPinModal && activeBoard && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        setShowPinModal(false);
                        setEditingPin(null);
                    }}
                >
                    <div
                        className="scene-modal add-scene-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            onClick={() => {
                                setShowPinModal(false);
                                setEditingPin(null);
                            }}
                        >
                            ×
                        </button>
                        <p className="eyebrow">
                            {editingPin
                                ? `EDIT PIN · ${activeBoard.title}`
                                : `PIN TO ${activeBoard.title}`}
                        </p>
                        <h2>
                            {editingPin
                                ? "Update this pin."
                                : "Add inspiration to board."}
                        </h2>
                        {itemError && <p className="form-error">{itemError}</p>}

                        <div className="collection-tabs" style={{ marginTop: 18 }}>
                            {["photo", "quote", "outfit", "note"].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`category-button ${
                                        itemType === t ? "active" : ""
                                    }`}
                                    onClick={() => {
                                        setItemType(t);
                                        setItemError("");
                                    }}
                                >
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <form className="add-scene-form" onSubmit={handleSavePin}>
                            <label>
                                <span>Title / Caption</span>
                                <input
                                    type="text"
                                    placeholder={
                                        itemType === "outfit"
                                            ? "e.g. Evening Gallery Look"
                                            : "Optional heading..."
                                    }
                                    value={itemTitle}
                                    onChange={(e) => setItemTitle(e.target.value)}
                                />
                            </label>

                            {(itemType === "photo" || itemType === "outfit") && (
                                <MultiPhotoPicker
                                    apiBaseUrl={apiBaseUrl}
                                    photos={itemImages}
                                    onChange={setItemImages}
                                    label={
                                        itemType === "photo"
                                            ? "Upload Photos (Up to 7)"
                                            : "Outfit Photos (Optional · Up to 7)"
                                    }
                                />
                            )}

                            <label>
                                <span>
                                    {itemType === "quote"
                                        ? "Quote *"
                                        : itemType === "outfit"
                                            ? "Outfit Pieces & Styling Notes *"
                                            : itemType === "photo"
                                                ? "Caption / Note (optional)"
                                                : "Inspiration Note *"}
                                </span>
                                <textarea
                                    rows={3}
                                    placeholder="Write your quote, outfit pieces, or aesthetic note..."
                                    value={itemContent}
                                    onChange={(e) => setItemContent(e.target.value)}
                                    required={itemType !== "photo"}
                                />
                            </label>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        setShowPinModal(false);
                                        setEditingPin(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="modal-save form-submit-btn"
                                    disabled={savingPin}
                                >
                                    {savingPin
                                        ? "SAVING..."
                                        : editingPin
                                            ? "SAVE PIN CHANGES"
                                            : "PIN TO BOARD"}
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

export default Moodboards;
