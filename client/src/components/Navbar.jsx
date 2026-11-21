import ThemePicker from "./ThemePicker";

function Navbar({
    page,
    savedCount,
    onOpenDiscover,
    onOpenLooks,
    onOpenColorStudio,
    onOpenPoses,
    onOpenMoodboards,
    onOpenDiary,
    onOpenFutureLife,
    onOpenCollection,
    onOpenAddModal,
}) {
    return (
        <header className="navbar">
            <button type="button" className="logo" onClick={onOpenDiscover}>
                Scene <span>Stealer</span>
                <i className="logo-crimson-dot" aria-hidden="true" />
            </button>

            <nav>
                <button
                    className={page === "discover" ? "nav-active" : ""}
                    onClick={onOpenDiscover}
                >
                    Discover
                </button>

                <button
                    className={page === "looks" ? "nav-active" : ""}
                    onClick={onOpenLooks}
                >
                    Create a Look
                </button>

                <button
                    className={page === "colors" ? "nav-active" : ""}
                    onClick={onOpenColorStudio}
                >
                    Color Studio
                </button>

                <button
                    className={page === "poses" ? "nav-active" : ""}
                    onClick={onOpenPoses}
                >
                    Pose Stealer
                </button>

                <button
                    className={page === "moodboards" ? "nav-active" : ""}
                    onClick={onOpenMoodboards}
                >
                    Moodboards
                </button>

                <button
                    className={page === "diary" ? "nav-active" : ""}
                    onClick={onOpenDiary}
                >
                    Diary
                </button>

                <button
                    className={page === "future" ? "nav-active" : ""}
                    onClick={onOpenFutureLife}
                >
                    Future Life
                </button>

                <button
                    className={page === "saved" ? "nav-active" : ""}
                    onClick={onOpenCollection}
                >
                    Collection ({savedCount})
                </button>

                <ThemePicker />

                <button className="nav-add-button" onClick={onOpenAddModal}>
                    + Add Scene
                </button>
            </nav>
        </header>
    );
}

export default Navbar;
