import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPodcastTime, PodcastContext, PODCASTS, usePodcast } from "./podcastContext.js";

export function PodcastProvider({ children }) {
  const audioRef = useRef(null);
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    const updateTime = () => setCurrentTime(audio.currentTime || 0);
    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const stop = () => setPlaying(false);
    const fail = () => {
      setPlaying(false);
      setError("Audio file unavailable. Add the final podcast recording to continue.");
    };
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", stop);
    audio.addEventListener("error", fail);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", stop);
      audio.removeEventListener("error", fail);
    };
  }, []);

  const selectTrack = useCallback((nextTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    if (track?.id !== nextTrack.id) {
      audio.pause();
      audio.src = nextTrack.src;
      audio.load();
      audio.playbackRate = speed;
      setTrack(nextTrack);
      setCurrentTime(0);
      setDuration(0);
      setPlaying(false);
    }
    setFullPlayerOpen(true);
  }, [speed, track?.id]);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    setError("");
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
        setError("Audio file unavailable. Add the final podcast recording to continue.");
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [track]);

  const seekTo = useCallback((value) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.max(0, Math.min(Number(value), duration || 0));
    audio.currentTime = next;
    setCurrentTime(next);
  }, [duration]);

  const skip = useCallback((seconds) => seekTo(currentTime + seconds), [currentTime, seekTo]);
  const changeSpeed = useCallback((value) => {
    const next = Number(value);
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, []);

  const value = useMemo(() => ({
    track, playing, currentTime, duration, speed, error, fullPlayerOpen,
    selectTrack, togglePlayback, seekTo, skip, changeSpeed,
    openFullPlayer: () => track && setFullPlayerOpen(true),
    closeFullPlayer: () => setFullPlayerOpen(false),
    formatTime: formatPodcastTime,
  }), [track, playing, currentTime, duration, speed, error, fullPlayerOpen, selectTrack, togglePlayback, seekTo, skip, changeSpeed]);

  return (
    <PodcastContext.Provider value={value}>
      {children}
      {track && !fullPlayerOpen && <PodcastMiniPlayer />}
    </PodcastContext.Provider>
  );
}

function PodcastArtwork({ track, compact = false }) {
  return (
    <div className={`podcast-artwork podcast-artwork-${track.accent} ${compact ? "compact" : ""}`} aria-hidden="true">
      <span className="podcast-artwork-live"><i></i> LIVE</span>
      <span className="podcast-artwork-mic">🎙️</span>
      <strong>CITIZENSHIP <em>AI</em></strong>
      {!compact && <small>{track.flag} {track.language.toUpperCase()}</small>}
    </div>
  );
}

function PodcastMiniPlayer() {
  const player = usePodcast();
  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;
  return (
    <aside className="podcast-mini-player" aria-label="Now Playing">
      <button className="podcast-mini-open" onClick={player.openFullPlayer} aria-label="Open full podcast player">
        <PodcastArtwork track={player.track} compact />
        <span><small>NOW PLAYING</small><strong>{player.track.title}</strong></span>
      </button>
      <button className="podcast-mini-toggle" onClick={player.togglePlayback} aria-label={player.playing ? "Pause podcast" : "Play podcast"}>
        {player.playing ? "Ⅱ" : "▶"}
      </button>
      <div className="podcast-mini-progress"><span style={{ width: `${progress}%` }}></span></div>
    </aside>
  );
}

export function PodcastLibrary({ onBack }) {
  const player = usePodcast();
  if (player.fullPlayerOpen && player.track) return <PodcastFullPlayer onBack={onBack} />;
  return (
    <div className="podcast-screen">
      <header className="podcast-header">
        <button onClick={onBack} aria-label="Back to Home">←</button>
        <strong>CITIZENSHIP <span>AI</span></strong>
        <span className="podcast-header-live"><i></i> LIVE</span>
      </header>
      <main className="podcast-library">
        <div className="podcast-library-intro">
          <span>🎙️ PODCASTS EN VIVO</span>
          <h1>Listen. Learn.<br />Become ready.</h1>
          <p>Choose your language and study with Citizenship AI.</p>
        </div>
        <div className="podcast-card-grid">
          {PODCASTS.map((item) => (
            <button className="podcast-card" key={item.id} onClick={() => player.selectTrack(item)}>
              <PodcastArtwork track={item} />
              <span className="podcast-card-copy">
                <small>{item.flag} {item.language}</small>
                <strong>{item.title}</strong>
                <span>Open player <b>▶</b></span>
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function PodcastFullPlayer({ onBack }) {
  const player = usePodcast();
  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;
  const leavePlayer = () => {
    player.closeFullPlayer();
    onBack();
  };
  return (
    <div className="podcast-screen podcast-player-screen">
      <header className="podcast-header">
        <button onClick={player.closeFullPlayer} aria-label="Minimize podcast player">⌄</button>
        <strong>NOW PLAYING</strong>
        <button onClick={leavePlayer} aria-label="Back to Home">×</button>
      </header>
      <main className="podcast-full-player">
        <PodcastArtwork track={player.track} />
        <section className="podcast-track-info">
          <small>{player.track.flag} {player.track.language}</small>
          <h1>{player.track.title}</h1>
          <span><i></i> Citizenship AI Live</span>
        </section>
        <section className="podcast-timeline">
          <input type="range" min="0" max={player.duration || 0} step="0.1" value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seekTo(event.target.value)} aria-label="Podcast progress" style={{ "--podcast-progress": `${progress}%` }} />
          <div><span>{player.formatTime(player.currentTime)}</span><span>{player.formatTime(player.duration)}</span></div>
        </section>
        <section className="podcast-controls">
          <button onClick={() => player.skip(-15)} aria-label="Rewind 15 seconds"><span>↶</span><small>15</small></button>
          <button className="podcast-main-play" onClick={player.togglePlayback} aria-label={player.playing ? "Pause podcast" : "Play podcast"}>{player.playing ? "Ⅱ" : "▶"}</button>
          <button onClick={() => player.skip(15)} aria-label="Forward 15 seconds"><span>↷</span><small>15</small></button>
        </section>
        <section className="podcast-speed" aria-label="Playback speed">
          {[1, 1.25, 1.5, 2].map((value) => <button key={value} className={player.speed === value ? "active" : ""} onClick={() => player.changeSpeed(value)}>{value}x</button>)}
        </section>
        {player.error && <p className="podcast-error" role="alert">{player.error}</p>}
      </main>
    </div>
  );
}
