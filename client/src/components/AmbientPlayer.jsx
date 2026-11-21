import { useState, useEffect } from "react";
import { ambientEngine } from "../utils/ambientAudio";

const SOUND_TRACKS = [
    { id: "rain", label: "Rain", icon: "🌧", subtitle: "Soft window rain" },
    { id: "cafe", label: "Café", icon: "☕", subtitle: "Warm coffeehouse hum" },
    { id: "piano", label: "Piano", icon: "🎹", subtitle: "Gentle cinema chords" },
    { id: "ocean", label: "Ocean", icon: "🌊", subtitle: "Slow shoreline waves" },
    { id: "lofi", label: "Lo-Fi", icon: "🎧", subtitle: "Vinyl chill pad" },
];

function AmbientPlayer() {
    const [expanded, setExpanded] = useState(false);
    const [activeTracks, setActiveTracks] = useState({});
    const [volumes, setVolumes] = useState({
        rain: 0.55,
        cafe: 0.45,
        piano: 0.5,
        ocean: 0.5,
        lofi: 0.5,
    });

    const activeIds = Object.keys(activeTracks).filter((id) => activeTracks[id]);
    const isPlaying = activeIds.length > 0;

    useEffect(() => {
        return () => {
            ambientEngine.stopAll();
        };
    }, []);

    function toggleTrack(id) {
        setActiveTracks((prev) => {
            const nextState = !prev[id];
            if (nextState) {
                ambientEngine.startTrack(id, volumes[id]);
            } else {
                ambientEngine.stopTrack(id);
            }
            return { ...prev, [id]: nextState };
        });
    }

    function handleVolumeChange(id, newVol) {
        const value = Number(newVol);
        setVolumes((prev) => ({ ...prev, [id]: value }));
        if (activeTracks[id]) {
            ambientEngine.setTrackVolume(id, value);
        }
    }

    function handleStopAll() {
        ambientEngine.stopAll();
        setActiveTracks({});
    }

    return (
        <aside className={`ambient-player ${expanded ? "expanded" : ""}`}>
            {expanded && (
                <div className="ambient-drawer">
                    <div className="ambient-drawer-header">
                        <div>
                            <p className="eyebrow">AMBIENT SOUNDTRACK</p>
                            <h4>Mix your cinematic atmosphere</h4>
                        </div>
                        {isPlaying && (
                            <button
                                className="reset-filters-button"
                                onClick={handleStopAll}
                            >
                                Pause all
                            </button>
                        )}
                    </div>

                    <div className="ambient-tracks-grid">
                        {SOUND_TRACKS.map((track) => {
                            const active = Boolean(activeTracks[track.id]);
                            return (
                                <div
                                    key={track.id}
                                    className={`ambient-track-row ${active ? "active" : ""}`}
                                >
                                    <button
                                        className="ambient-track-toggle"
                                        onClick={() => toggleTrack(track.id)}
                                    >
                                        <span className="ambient-track-icon">
                                            {track.icon}
                                        </span>
                                        <span className="ambient-track-info">
                                            <strong>{track.label}</strong>
                                            <small>{track.subtitle}</small>
                                        </span>
                                        <span className="ambient-track-state">
                                            {active ? "ON" : "OFF"}
                                        </span>
                                    </button>

                                    <input
                                        type="range"
                                        min="0.05"
                                        max="1"
                                        step="0.05"
                                        value={volumes[track.id]}
                                        onChange={(e) =>
                                            handleVolumeChange(track.id, e.target.value)
                                        }
                                        aria-label={`${track.label} volume`}
                                        className="ambient-slider"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="ambient-bar">
                <div className="ambient-bar-left">
                    <span className={`ambient-dot ${isPlaying ? "playing" : ""}`} />
                    <div className="ambient-bar-text">
                        <span className="ambient-bar-label">AMBIENT PLAYER</span>
                        <span className="ambient-bar-status">
                            {isPlaying
                                ? `Playing: ${activeIds
                                      .map(
                                          (id) =>
                                              SOUND_TRACKS.find((t) => t.id === id)
                                                  ?.label
                                      )
                                      .join(" + ")}`
                                : "Rain · Café · Piano · Ocean · Lo-Fi"}
                        </span>
                    </div>
                </div>

                <div className="ambient-bar-actions">
                    {!expanded && (
                        <div className="ambient-quick-pills">
                            {SOUND_TRACKS.map((track) => (
                                <button
                                    key={track.id}
                                    className={`ambient-quick-btn ${
                                        activeTracks[track.id] ? "active" : ""
                                    }`}
                                    onClick={() => toggleTrack(track.id)}
                                    title={`Toggle ${track.label}`}
                                >
                                    {track.icon} {track.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {isPlaying && (
                        <button
                            className="ambient-stop-btn"
                            onClick={handleStopAll}
                            title="Pause all sounds"
                        >
                            ❚❚
                        </button>
                    )}

                    <button
                        className="ambient-expand-btn"
                        onClick={() => setExpanded((prev) => !prev)}
                    >
                        {expanded ? "Hide Mixer ↓" : "Mixer ↑"}
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default AmbientPlayer;
