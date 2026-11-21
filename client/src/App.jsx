import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import SceneCard from "./components/SceneCard";
import DailyScene from "./components/DailyScene";
import RandomInspiration from "./components/RandomInspiration";
import PoseStealer from "./components/PoseStealer";
import CreateLook from "./components/CreateLook";
import ColorStudio from "./components/ColorStudio";
import Moodboards from "./components/Moodboards";
import SceneDiary from "./components/SceneDiary";
import FutureLife from "./components/FutureLife";
import AmbientPlayer from "./components/AmbientPlayer";
import AddSceneModal from "./components/AddSceneModal";
import ImageLightbox from "./components/ImageLightbox";
import { resolveImageUrl } from "./utils/imageUrl";
import { parseMusicLink } from "./utils/musicEmbed";
import editorialHeroImg from "./assets/editorial-hero.jpg";
import stripDailyImg from "./assets/strip-daily.jpg";
import stripMoodboardsImg from "./assets/strip-moodboards.jpg";
import stripLooksImg from "./assets/strip-looks.jpg";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ??
    (import.meta.env.DEV ? "http://localhost:5000" : "");

const CATEGORIES = [
    "All",
    "Fashion",
    "Beauty",
    "Music",
    "Lifestyle",
    "Aesthetic",
    "Movies & TV",
    "Character Inspiration",
];

const MOODS = [
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

function App() {
    const [scenes, setScenes] = useState([]);
    const [dailyData, setDailyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeMood, setActiveMood] = useState("All");
    const [activeMovie, setActiveMovie] = useState("All");

    const [page, setPage] = useState("discover");
    const [collectionTab, setCollectionTab] = useState("saved");
    const [selectedScene, setSelectedScene] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingScene, setEditingScene] = useState(null);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [savedScenes, setSavedScenes] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem("sceneStealerSaved"));
            return Array.isArray(stored) ? stored : [];
        } catch {
            return [];
        }
    });

    async function loadScenesFromApi() {
        const [scenesRes, dailyRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/scenes`),
            fetch(`${API_BASE_URL}/api/scenes/daily`),
        ]);

        if (!scenesRes.ok) {
            throw new Error("Unable to load scenes from the server.");
        }

        const scenesJson = await scenesRes.json();
        const dailyJson = dailyRes.ok ? await dailyRes.json() : null;
        return { scenesJson, dailyJson };
    }

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { scenesJson, dailyJson } = await loadScenesFromApi();
            setScenes(scenesJson);
            setDailyData(dailyJson);
        } catch (err) {
            setError(
                err.message ||
                    "Could not connect to the Scene Stealer backend. Make sure the server is running on port 5000."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        loadScenesFromApi()
            .then(({ scenesJson, dailyJson }) => {
                if (!cancelled) {
                    setScenes(scenesJson);
                    setDailyData(dailyJson);
                    setError("");
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(
                        err.message ||
                            "Could not connect to the Scene Stealer backend. Make sure the server is running on port 5000."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        localStorage.setItem("sceneStealerSaved", JSON.stringify(savedScenes));
    }, [savedScenes]);

    // Close modals with Escape key
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setSelectedScene(null);
                setShowAddModal(false);
                setEditingScene(null);
                setShowMusicPlayer(false);
                setConfirmDeleteId(null);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    function showToast(message) {
        setToastMessage(message);
        window.setTimeout(() => {
            setToastMessage((prev) => (prev === message ? "" : prev));
        }, 3200);
    }

    // Keep savedCount synced with existing scenes in DB
    const validSavedIds = savedScenes.filter((id) =>
        scenes.some((scene) => scene._id === id)
    );

    const movieOptions = [
        "All",
        ...Array.from(new Set(scenes.map((scene) => scene.movie))).sort((a, b) =>
            a.localeCompare(b)
        ),
    ];

    const userCreatedCount = scenes.filter((scene) => scene.isUserCreated).length;

    const displayedScenes = scenes.filter((scene) => {
        const matchesCategory =
            activeCategory === "All" || scene.category === activeCategory;

        const matchesMood =
            activeMood === "All" ||
            (Array.isArray(scene.moods) && scene.moods.includes(activeMood));

        const matchesMovie =
            activeMovie === "All" || scene.movie === activeMovie;

        const query = search.trim().toLowerCase();
        const matchesSearch =
            !query ||
            scene.title.toLowerCase().includes(query) ||
            scene.movie.toLowerCase().includes(query) ||
            scene.category.toLowerCase().includes(query) ||
            scene.description.toLowerCase().includes(query) ||
            (scene.tags || []).some((tag) => tag.toLowerCase().includes(query)) ||
            (scene.moods || []).some((mood) => mood.toLowerCase().includes(query));

        let matchesPage = true;
        if (page === "saved") {
            matchesPage =
                collectionTab === "saved"
                    ? savedScenes.includes(scene._id)
                    : Boolean(scene.isUserCreated);
        }

        return (
            matchesCategory &&
            matchesMood &&
            matchesMovie &&
            matchesSearch &&
            matchesPage
        );
    });

    const hasActiveFilters =
        activeCategory !== "All" ||
        activeMood !== "All" ||
        activeMovie !== "All" ||
        search.trim() !== "";

    function resetFilters() {
        setActiveCategory("All");
        setActiveMood("All");
        setActiveMovie("All");
        setSearch("");
    }

    function toggleSave(sceneId) {
        setSavedScenes((previous) =>
            previous.includes(sceneId)
                ? previous.filter((id) => id !== sceneId)
                : [...previous, sceneId]
        );
    }

    function openDiscover() {
        setPage("discover");
        resetFilters();
    }

    function openPoses() {
        setPage("poses");
    }

    function openCollection() {
        setPage("saved");
        setCollectionTab("saved");
        resetFilters();
    }

    async function handleAddScene(payload) {
        const response = await fetch(`${API_BASE_URL}/api/scenes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to create scene");
        }

        setScenes((prev) => [data, ...prev]);
        // Auto-save the user's own added scene so it's right in their collection
        setSavedScenes((prev) =>
            prev.includes(data._id) ? prev : [...prev, data._id]
        );
        showToast("Scene added to your archive!");
    }

    async function handleUpdateScene(sceneId, payload) {
        const response = await fetch(`${API_BASE_URL}/api/scenes/${sceneId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const updated = await response.json();
        if (!response.ok) {
            throw new Error(updated.message || "Failed to update scene");
        }

        setScenes((prev) =>
            prev.map((scene) => (scene._id === updated._id ? updated : scene))
        );
        setSelectedScene((prev) =>
            prev && prev._id === updated._id ? updated : prev
        );
        setDailyData((prev) =>
            prev && prev.scene && prev.scene._id === updated._id
                ? { ...prev, scene: updated }
                : prev
        );
        setShowMusicPlayer(false);
        showToast("Scene updated successfully!");
    }

    async function handleAdjustPhoto(sceneId, photoLayout) {
        const response = await fetch(`${API_BASE_URL}/api/scenes/${sceneId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(photoLayout),
        });

        const updated = await response.json();
        if (!response.ok) {
            throw new Error(updated.message || "Failed to save photo layout");
        }

        setScenes((prev) =>
            prev.map((item) => (item._id === sceneId ? updated : item))
        );
        setSelectedScene((prev) =>
            prev && prev._id === sceneId ? updated : prev
        );
        setDailyData((prev) =>
            prev && prev.scene && prev.scene._id === sceneId
                ? { ...prev, scene: updated }
                : prev
        );
        showToast("Photo layout saved!");
    }

    function openSceneDetails(scene) {
        setConfirmDeleteId(null);
        setShowMusicPlayer(false);
        setSelectedScene(scene);
    }

    function openEditScene(scene) {
        setEditingScene(scene);
        setShowAddModal(true);
    }

    async function handleDeleteScene(sceneId) {
        setDeleting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/scenes/${sceneId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete scene.");
            }
            setScenes((prev) => prev.filter((scene) => scene._id !== sceneId));
            setSavedScenes((prev) => prev.filter((id) => id !== sceneId));
            if (selectedScene?._id === sceneId) {
                setSelectedScene(null);
            }
            setConfirmDeleteId(null);

            if (dailyData?.scene?._id === sceneId) {
                const dailyRes = await fetch(`${API_BASE_URL}/api/scenes/daily`);
                setDailyData(dailyRes.ok ? await dailyRes.json() : null);
            }

            showToast("Scene deleted.");
        } catch (err) {
            setError(err.message || "Could not delete scene.");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="app">
            <Navbar
                page={page}
                savedCount={validSavedIds.length}
                onOpenDiscover={openDiscover}
                onOpenLooks={() => setPage("looks")}
                onOpenColorStudio={() => setPage("colors")}
                onOpenPoses={openPoses}
                onOpenMoodboards={() => setPage("moodboards")}
                onOpenDiary={() => setPage("diary")}
                onOpenFutureLife={() => setPage("future")}
                onOpenCollection={openCollection}
                onOpenAddModal={() => {
                    setEditingScene(null);
                    setShowAddModal(true);
                }}
            />

            {toastMessage && (
                <div className="toast-banner" role="status">
                    ✦ {toastMessage}
                </div>
            )}

            <main>
                {page === "looks" && <CreateLook apiBaseUrl={API_BASE_URL} />}
                {page === "colors" && <ColorStudio />}
                {page === "poses" && <PoseStealer apiBaseUrl={API_BASE_URL} />}
                {page === "moodboards" && <Moodboards apiBaseUrl={API_BASE_URL} />}
                {page === "diary" && <SceneDiary apiBaseUrl={API_BASE_URL} />}
                {page === "future" && <FutureLife apiBaseUrl={API_BASE_URL} />}

                {page === "discover" && (
                    <>
                        <section className="hero editorial-hero" id="home">
                            <div className="editorial-hero-grid">
                                <div className="editorial-hero-copy">
                                    <p className="eyebrow">
                                        ISSUE NO. 01 · YOUR LIFE, DIRECTED BY FILM
                                    </p>

                                    <h1 className="editorial-display-title">
                                        STEAL
                                        <br />
                                        <span className="editorial-italic">THE</span> SCENE.
                                    </h1>

                                    <div className="editorial-hero-subblock">
                                        <p className="editorial-hero-kicker">
                                            CINEMATIC ARCHIVE · 2026
                                        </p>
                                        <p className="hero-description">
                                            From iconic silhouettes to unforgettable soundtracks,
                                            curate the scenes that stay with you and wear your own rules.
                                        </p>

                                        <div className="hero-actions">
                                            <button
                                                className="editorial-link-btn"
                                                onClick={() => {
                                                    document
                                                        .getElementById("discover")
                                                        ?.scrollIntoView({ behavior: "smooth" });
                                                }}
                                            >
                                                EXPLORE THE ARCHIVE <span>→</span>
                                            </button>

                                            <button
                                                className="hero-secondary-button"
                                                onClick={() => {
                                                    setEditingScene(null);
                                                    setShowAddModal(true);
                                                }}
                                            >
                                                + ADD YOUR OWN SCENE
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="editorial-hero-visual">
                                    <img
                                        src={editorialHeroImg}
                                        alt="Editorial fashion portrait in tailored black coat"
                                        className="editorial-hero-img"
                                    />
                                    <button
                                        type="button"
                                        className="editorial-hero-crimson-box"
                                        onClick={() => {
                                            if (dailyData?.scene) {
                                                openSceneDetails(dailyData.scene);
                                            } else {
                                                document
                                                    .getElementById("discover")
                                                    ?.scrollIntoView({ behavior: "smooth" });
                                            }
                                        }}
                                        title="Open Today's Daily Scene"
                                    >
                                        <span className="crimson-box-play">▶</span>
                                        <span className="crimson-box-label">DAILY CUT</span>
                                    </button>
                                </div>

                                <div className="editorial-chapter-rail" aria-hidden="true">
                                    <span className="chapter-active">01</span>
                                    <span className="chapter-line" />
                                    <span>02</span>
                                    <span>03</span>
                                    <span>04</span>
                                </div>
                            </div>
                        </section>

                        <section className="vanta-editorial-strip" aria-label="Featured Studio Chapters">
                            <button
                                type="button"
                                className="vanta-strip-item"
                                onClick={() => {
                                    document
                                        .getElementById("daily-scene")
                                        ?.scrollIntoView({ behavior: "smooth" });
                                }}
                            >
                                <div className="vanta-strip-thumb-wrap">
                                    <img
                                        src={stripDailyImg}
                                        alt="Daily Scene editorial pose"
                                        className="vanta-strip-thumb"
                                    />
                                </div>
                                <div className="vanta-strip-meta">
                                    <span className="vanta-strip-num">01</span>
                                    <span className="vanta-strip-cat">DAILY SCENE</span>
                                    <h3>
                                        {dailyData?.scene?.title || "Today's Featured Edit"}
                                    </h3>
                                    <span className="vanta-strip-link">READ MORE →</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="vanta-strip-item"
                                onClick={() => setPage("moodboards")}
                            >
                                <div className="vanta-strip-thumb-wrap">
                                    <img
                                        src={stripMoodboardsImg}
                                        alt="Moodboards editorial portrait"
                                        className="vanta-strip-thumb"
                                    />
                                </div>
                                <div className="vanta-strip-meta">
                                    <span className="vanta-strip-num">02</span>
                                    <span className="vanta-strip-cat">MOODBOARDS</span>
                                    <h3>Curate Your Visual World</h3>
                                    <span className="vanta-strip-link">OPEN BOARDS →</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className="vanta-strip-item"
                                onClick={() => setPage("looks")}
                            >
                                <div className="vanta-strip-thumb-wrap">
                                    <img
                                        src={stripLooksImg}
                                        alt="Create a Look editorial portrait"
                                        className="vanta-strip-thumb"
                                    />
                                </div>
                                <div className="vanta-strip-meta">
                                    <span className="vanta-strip-num">03</span>
                                    <span className="vanta-strip-cat">CREATE A LOOK</span>
                                    <h3>Signature Flat-Lay Studio</h3>
                                    <span className="vanta-strip-link">STYLE NOW →</span>
                                </div>
                            </button>
                        </section>
                    </>
                )}

                {page === "discover" && !loading && !error && dailyData && (
                    <DailyScene
                        dailyData={dailyData}
                        apiBaseUrl={API_BASE_URL}
                        isSaved={savedScenes.includes(dailyData.scene._id)}
                        onToggleSave={toggleSave}
                        onSelect={openSceneDetails}
                    />
                )}

                {page === "discover" && !loading && !error && scenes.length > 0 && (
                    <RandomInspiration
                        apiBaseUrl={API_BASE_URL}
                        scenes={scenes}
                        savedScenes={savedScenes}
                        onToggleSave={toggleSave}
                        onSelect={openSceneDetails}
                    />
                )}

                {(page === "discover" || page === "saved") && (
                <section className="discover-section" id="discover">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                {page === "saved"
                                    ? "YOUR PERSONAL COLLECTION"
                                    : "THE INSPIRATION ARCHIVE"}
                            </p>

                            <h2>
                                {page === "saved"
                                    ? collectionTab === "saved"
                                        ? "Your saved scenes."
                                        : "Scenes you added."
                                    : "Find your next obsession."}
                            </h2>
                        </div>

                        <span className="scene-count">
                            {displayedScenes.length}{" "}
                            {displayedScenes.length === 1 ? "SCENE" : "SCENES"}
                        </span>
                    </div>

                    {page === "saved" && (
                        <div className="collection-tabs">
                            <button
                                className={`category-button ${
                                    collectionTab === "saved" ? "active" : ""
                                }`}
                                onClick={() => setCollectionTab("saved")}
                            >
                                Saved Favorites ({validSavedIds.length})
                            </button>
                            <button
                                className={`category-button ${
                                    collectionTab === "mine" ? "active" : ""
                                }`}
                                onClick={() => setCollectionTab("mine")}
                            >
                                My Added Scenes ({userCreatedCount})
                            </button>
                        </div>
                    )}

                    <div className="filter-controls-row">
                        <div className="search-box">
                            <span>⌕</span>

                            <input
                                placeholder="Search scenes, movies, moods, tags or ideas..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />

                            {search && (
                                <button
                                    className="clear-search"
                                    onClick={() => setSearch("")}
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="movie-filter">
                            <label htmlFor="movie-select" className="sr-only">
                                Filter by Movie or TV Show
                            </label>
                            <select
                                id="movie-select"
                                value={activeMovie}
                                onChange={(e) => setActiveMovie(e.target.value)}
                            >
                                {movieOptions.map((movie) => (
                                    <option key={movie} value={movie}>
                                        {movie === "All"
                                            ? "All Movies & TV Shows"
                                            : movie}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="filter-block">
                        <span className="filter-block-label">CATEGORY</span>
                        <div className="category-list">
                            {CATEGORIES.map((category) => (
                                <button
                                    key={category}
                                    className={`category-button ${
                                        activeCategory === category ? "active" : ""
                                    }`}
                                    onClick={() => setActiveCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-block">
                        <div className="filter-block-header">
                            <span className="filter-block-label">
                                DISCOVER BY MOOD
                            </span>
                            {hasActiveFilters && (
                                <button
                                    className="reset-filters-button"
                                    onClick={resetFilters}
                                >
                                    Reset all filters
                                </button>
                            )}
                        </div>
                        <div className="mood-list">
                            {MOODS.map((mood) => (
                                <button
                                    key={mood}
                                    className={`mood-pill ${
                                        activeMood === mood ? "active" : ""
                                    }`}
                                    onClick={() => setActiveMood(mood)}
                                >
                                    {mood === "All" ? "All Moods" : mood}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading && (
                        <div className="status-state">
                            <div className="loading-spinner" aria-hidden="true" />
                            <h3>Loading your cinematic archive...</h3>
                            <p>Fetching scenes from MongoDB.</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="status-state error-state">
                            <h3>Connection paused.</h3>
                            <p>{error}</p>
                            <button onClick={fetchData}>Try again</button>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="scene-grid">
                            {displayedScenes.map((scene) => (
                                <SceneCard
                                    key={scene._id}
                                    scene={scene}
                                    apiBaseUrl={API_BASE_URL}
                                    isSaved={savedScenes.includes(scene._id)}
                                    onToggleSave={toggleSave}
                                    onSelect={openSceneDetails}
                                    onEdit={openEditScene}
                                    onDelete={handleDeleteScene}
                                    onAdjustPhoto={handleAdjustPhoto}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && !error && displayedScenes.length === 0 && (
                        <div className="empty-state">
                            <h3>
                                {page === "saved"
                                    ? collectionTab === "mine"
                                        ? "You haven't added a scene yet."
                                        : "Your collection is waiting."
                                    : "No scenes found."}
                            </h3>

                            <p>
                                {page === "saved"
                                    ? collectionTab === "mine"
                                        ? "Add your favorite movie or TV inspiration to build your own archive."
                                        : "Save scenes with the heart button to keep them here."
                                    : "Try a different search, category, mood, or movie."}
                            </p>

                            {page === "saved" && collectionTab === "mine" ? (
                                <button onClick={() => setShowAddModal(true)}>
                                    + Add your first scene
                                </button>
                            ) : hasActiveFilters ? (
                                <button onClick={resetFilters}>
                                    Clear filters
                                </button>
                            ) : (
                                <button onClick={openDiscover}>
                                    Explore scenes
                                </button>
                            )}
                        </div>
                    )}
                </section>
                )}

                {page === "discover" && (
                    <section className="collection-section">
                        <p className="eyebrow">YOUR PERSONAL ARCHIVE</p>
                        <h2>Keep the scenes that feel like you.</h2>
                        <p>Your saved inspiration, all in one place.</p>

                        <div className="saved-count">
                            <span>{validSavedIds.length}</span>
                            <p>SCENES SAVED</p>
                        </div>

                        <button
                            className="explore-button"
                            onClick={openCollection}
                        >
                            View my collection →
                        </button>
                    </section>
                )}
            </main>

            <footer className="footer">
                <div className="logo">
                    SCENE<span>STEALER</span>
                </div>

                <p>Inspired by fiction. Created for your reality.</p>

                <span className="footer-end">© 2026 SCENE STEALER</span>
            </footer>

            {selectedScene && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        setSelectedScene(null);
                        setConfirmDeleteId(null);
                    }}
                >
                    <div
                        className="scene-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            className="modal-close"
                            onClick={() => {
                                setSelectedScene(null);
                                setConfirmDeleteId(null);
                            }}
                            aria-label="Close modal"
                        >
                            ×
                        </button>

                        {selectedScene.imageUrl && (
                            <div
                                className="modal-image-wrap"
                                onClick={() =>
                                    setLightboxImage({
                                        src: resolveImageUrl(
                                            selectedScene.imageUrl,
                                            API_BASE_URL
                                        ),
                                        alt: selectedScene.title,
                                    })
                                }
                                title="Click to view full screen"
                            >
                                <img
                                    src={resolveImageUrl(
                                        selectedScene.imageUrl,
                                        API_BASE_URL
                                    )}
                                    alt={selectedScene.title}
                                    className="modal-image"
                                    onError={(e) => {
                                        e.currentTarget.parentElement.style.display =
                                            "none";
                                    }}
                                />
                                <span className="image-zoom-hint">⤢ Click to expand</span>
                            </div>
                        )}

                        <p className="eyebrow">
                            {selectedScene.category} · SCENE: {selectedScene.movie}
                        </p>

                        <div className="modal-title-row">
                            <h2>
                                {selectedScene.title}
                                {selectedScene.musicUrl && (
                                    <span
                                        className="modal-title-music-icon"
                                        title="Music attached to this scene"
                                    >
                                        ♫
                                    </span>
                                )}
                            </h2>
                            <button
                                className="modal-edit-btn"
                                onClick={() => openEditScene(selectedScene)}
                            >
                                ✎ Edit Scene
                            </button>
                        </div>

                        <p className="modal-movie">
                            Inspired by {selectedScene.movie}
                        </p>

                        <p className="modal-description">
                            {selectedScene.description}
                        </p>

                        {selectedScene.musicUrl && (() => {
                            const musicInfo = parseMusicLink(selectedScene.musicUrl);
                            return (
                                <div className="scene-music-section">
                                    <div className="scene-music-header">
                                        <div>
                                            <span className="scene-music-label">
                                                ♫ SCENE SOUNDTRACK
                                            </span>
                                            <span className="scene-music-source">
                                                {musicInfo.platform ||
                                                    selectedScene.musicPlatform ||
                                                    "External Music"}
                                            </span>
                                        </div>

                                        <div className="scene-music-actions">
                                            {musicInfo.isValid && musicInfo.canEmbed ? (
                                                <button
                                                    type="button"
                                                    className="listen-scene-btn"
                                                    onClick={() =>
                                                        setShowMusicPlayer((prev) => !prev)
                                                    }
                                                >
                                                    {showMusicPlayer
                                                        ? "Hide Player"
                                                        : "▶ Listen to This Scene"}
                                                </button>
                                            ) : musicInfo.isValid ? (
                                                <a
                                                    href={musicInfo.originalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="listen-scene-btn"
                                                >
                                                    Open Music Source ↗
                                                </a>
                                            ) : null}

                                            {musicInfo.isValid && musicInfo.canEmbed && (
                                                <a
                                                    href={musicInfo.originalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="open-source-link"
                                                >
                                                    Open Source ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {!musicInfo.isValid && (
                                        <p className="photo-upload-error">
                                            The attached music link looks invalid. Click
                                            &ldquo;Edit Scene&rdquo; to replace or remove it.
                                        </p>
                                    )}

                                    {showMusicPlayer &&
                                        musicInfo.isValid &&
                                        musicInfo.canEmbed && (
                                            <div className="scene-music-embed">
                                                {musicInfo.embedKind === "audio" ? (
                                                    <audio
                                                        src={musicInfo.embedUrl}
                                                        controls
                                                        autoPlay
                                                        style={{ width: "100%", display: "block" }}
                                                    />
                                                ) : (
                                                    <iframe
                                                        src={musicInfo.embedUrl}
                                                        title={`Music for ${selectedScene.title}`}
                                                        width="100%"
                                                        height={musicInfo.embedHeight || 220}
                                                        frameBorder="0"
                                                        referrerPolicy="strict-origin-when-cross-origin"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        loading="lazy"
                                                    />
                                                )}
                                                <p className="music-embed-hint">
                                                    If playback is restricted by the artist or
                                                    label, click <strong>Open Source ↗</strong>{" "}
                                                    above to listen directly.
                                                </p>
                                            </div>
                                        )}
                                </div>
                            );
                        })()}

                        <div className="modal-divider"></div>

                        {selectedScene.moods && selectedScene.moods.length > 0 && (
                            <>
                                <h3>MOOD PALETTE</h3>
                                <div className="modal-tags">
                                    {selectedScene.moods.map((mood) => (
                                        <span className="mood-badge" key={mood}>
                                            ✦ {mood}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}

                        {selectedScene.tags && selectedScene.tags.length > 0 && (
                            <>
                                <h3 className="modal-ideas-heading">
                                    STEAL THIS VIBE
                                </h3>
                                <div className="modal-tags">
                                    {selectedScene.tags.map((tag) => (
                                        <span className="tag" key={tag}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}

                        <h3 className="modal-ideas-heading">
                            TAKE IT INTO YOUR EVERYDAY
                        </h3>

                        <p className="modal-ideas">
                            {selectedScene.everydayInspiration ||
                                "Use this scene as inspiration for your outfits, mood, playlist, beauty choices or everyday routine. Make the aesthetic your own instead of copying it."}
                        </p>

                        {selectedScene.recreateVibe &&
                            (selectedScene.recreateVibe.outfit ||
                                selectedScene.recreateVibe.makeup ||
                                selectedScene.recreateVibe.hairstyle ||
                                selectedScene.recreateVibe.activity ||
                                selectedScene.recreateVibe.music) && (
                                <>
                                    <h3 className="modal-ideas-heading">
                                        RECREATE THE VIBE
                                    </h3>
                                    <div className="vibe-grid">
                                        {selectedScene.recreateVibe.outfit && (
                                            <div className="vibe-item">
                                                <span>OUTFIT</span>
                                                <p>{selectedScene.recreateVibe.outfit}</p>
                                            </div>
                                        )}
                                        {selectedScene.recreateVibe.makeup && (
                                            <div className="vibe-item">
                                                <span>MAKEUP</span>
                                                <p>{selectedScene.recreateVibe.makeup}</p>
                                            </div>
                                        )}
                                        {selectedScene.recreateVibe.hairstyle && (
                                            <div className="vibe-item">
                                                <span>HAIRSTYLE</span>
                                                <p>{selectedScene.recreateVibe.hairstyle}</p>
                                            </div>
                                        )}
                                        {selectedScene.recreateVibe.activity && (
                                            <div className="vibe-item">
                                                <span>ACTIVITY</span>
                                                <p>{selectedScene.recreateVibe.activity}</p>
                                            </div>
                                        )}
                                        {selectedScene.recreateVibe.music && (
                                            <div className="vibe-item">
                                                <span>MUSIC</span>
                                                <p>{selectedScene.recreateVibe.music}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                        {selectedScene.personalNotes && (
                            <>
                                <h3 className="modal-ideas-heading">
                                    PERSONAL NOTES
                                </h3>
                                <p className="modal-notes">
                                    {selectedScene.personalNotes}
                                </p>
                            </>
                        )}

                        <button
                            className="modal-save"
                            onClick={() => toggleSave(selectedScene._id)}
                        >
                            {savedScenes.includes(selectedScene._id)
                                ? "♥  SAVED TO YOUR COLLECTION"
                                : "♡  SAVE TO YOUR COLLECTION"}
                        </button>

                        <div className="modal-delete-area">
                            {confirmDeleteId === selectedScene._id ? (
                                <div className="delete-confirm-row">
                                    <span>Delete this scene permanently?</span>
                                    <div>
                                        <button
                                            className="secondary-button"
                                            onClick={() =>
                                                setConfirmDeleteId(null)
                                            }
                                            disabled={deleting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="danger-button"
                                            onClick={() =>
                                                handleDeleteScene(
                                                    selectedScene._id
                                                )
                                            }
                                            disabled={deleting}
                                        >
                                            {deleting
                                                ? "Deleting..."
                                                : "Confirm Delete"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className="delete-scene-button"
                                    onClick={() =>
                                        setConfirmDeleteId(selectedScene._id)
                                    }
                                >
                                    Delete Scene
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && (
                <AddSceneModal
                    key={editingScene ? editingScene._id : "new-scene"}
                    apiBaseUrl={API_BASE_URL}
                    categories={CATEGORIES.filter((c) => c !== "All")}
                    moods={MOODS.filter((m) => m !== "All")}
                    initialScene={editingScene}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingScene(null);
                    }}
                    onSubmitScene={(payload) =>
                        editingScene
                            ? handleUpdateScene(editingScene._id, payload)
                            : handleAddScene(payload)
                    }
                />
            )}

            <ImageLightbox
                src={lightboxImage?.src}
                alt={lightboxImage?.alt}
                onClose={() => setLightboxImage(null)}
            />

            <AmbientPlayer />
        </div>
    );
}

export default App;
