import '../../../shared/design-system/citizenship-podcasts.css';
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
      setError("We couldn't play this audio. Please try again.");
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
        setError("We couldn't play this audio. Please try again.");
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

  const dismissPlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
    setPlaying(false); setTrack(null); setFullPlayerOpen(false);
    setCurrentTime(0); setDuration(0); setError("");
  }, []);

  const value = useMemo(() => ({
    track, playing, currentTime, duration, speed, error, fullPlayerOpen,
    selectTrack, togglePlayback, seekTo, skip, changeSpeed, dismissPlayer,
    openFullPlayer: () => track && setFullPlayerOpen(true),
    closeFullPlayer: () => setFullPlayerOpen(false),
    formatTime: formatPodcastTime,
  }), [track, playing, currentTime, duration, speed, error, fullPlayerOpen, selectTrack, togglePlayback, seekTo, skip, changeSpeed, dismissPlayer]);

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
      <span className="podcast-artwork-live">AUDIO</span>
      <span className="podcast-artwork-mic"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" /></svg></span>
      <strong>IMMIGRATION <em>AI</em></strong>
      {!compact && <small>{track.flag} {track.language.toUpperCase()}</small>}
    </div>
  );
}

function PodcastIcon({ kind }) {
  const paths = {
    play: <path d="m9 5 11 7-11 7Z" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    minimize: <path d="m5 9 7 7 7-7" />,
    back: <path d="M20 12H4m7-7-7 7 7 7" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    rewind: <><path d="M4 7v5h5M4 12a8 8 0 1 1 3 6" /></>,
    forward: <><path d="M20 7v5h-5m5 0a8 8 0 1 0-3 6" /></>,
  };
  return <svg className="podcast-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[kind]}</svg>;
}

function PodcastMiniPlayer() {
  const player = usePodcast();
  const [language, setLanguage] = useState(() => typeof document !== "undefined" ? document.documentElement.lang : "en");
  useEffect(() => {
    const observer = new MutationObserver(() => setLanguage(document.documentElement.lang));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);
  const es = language === "es";
  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;
  return (
    <aside className="podcast-mini-player" aria-label={es ? "Reproduciendo" : "Now playing"}>
      <button className="podcast-mini-open" onClick={() => { player.openFullPlayer(); window.location.hash = "podcasts"; }} aria-label={es ? "Abrir reproductor de podcast" : "Open full podcast player"}>
        <PodcastArtwork track={player.track} compact />
        <span><small>{es ? "REPRODUCIENDO" : "NOW PLAYING"}</small><strong>{player.track.title}</strong></span>
      </button>
      <button className="podcast-mini-toggle" onClick={player.togglePlayback} aria-label={player.playing ? (es ? "Pausar podcast" : "Pause podcast") : (es ? "Reproducir podcast" : "Play podcast")}>
        <PodcastIcon kind={player.playing ? "pause" : "play"} />
      </button>
      <button className="podcast-mini-dismiss" onClick={player.dismissPlayer} aria-label={es ? "Cerrar podcast y detener audio" : "Close podcast and stop audio"}><PodcastIcon kind="close" /></button>
      <div className="podcast-mini-progress"><span style={{ width: `${progress}%` }}></span></div>
    </aside>
  );
}

export function PodcastLibrary({ onBack, language = "en" }) {
  const es = language === "es";
  const player = usePodcast();
  if (player.fullPlayerOpen && player.track) return <PodcastFullPlayer onBack={onBack} language={language} />;
  return (
    <div className="podcast-screen">
      <header className="podcast-header">
        <button onClick={onBack} aria-label={es ? "Volver al inicio" : "Back to Home"}><PodcastIcon kind="back" /></button>
        <strong>IMMIGRATION <span>AI</span></strong>
        <span className="podcast-header-live">AUDIO</span>
      </header>
      <main className="podcast-library">
        <div className="podcast-library-intro">
          <span>PODCASTS</span>
          <h1>{es ? "Escucha y aprende." : "Listen and learn."}</h1>
          <p>{es ? "Audios educativos grabados, en inglés y español." : "Recorded educational audio, in English and Spanish."}</p>
        </div>
        <div className="podcast-card-grid">
          {PODCASTS.map((item) => (
            <button className="podcast-card liquid-glass" key={item.id} onClick={() => player.selectTrack(item)}>
              <PodcastArtwork track={item} />
              <span className="podcast-card-copy">
                <small>{item.flag} {item.language}</small>
                <strong>{item.title}</strong>{player.track?.id===item.id&&player.duration>0&&<span className="podcast-card-progress"><progress value={player.currentTime} max={player.duration} aria-label={es?"Progreso del podcast":"Podcast progress"}/><small>{player.formatTime(player.currentTime)} / {player.formatTime(player.duration)}</small></span>}
                <span>{es ? "Abrir reproductor" : "Open player"} <b><PodcastIcon kind="play" /></b></span>
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function PodcastFullPlayer({ onBack, language = "en" }) {
  const es = language === "es";
  const player = usePodcast();
  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;
  const leavePlayer = () => {
    player.closeFullPlayer();
    onBack();
  };
  return (
    <div className="podcast-screen podcast-player-screen">
      <header className="podcast-header">
        <button onClick={player.closeFullPlayer} aria-label={es ? "Minimizar reproductor de podcast" : "Minimize podcast player"}><PodcastIcon kind="minimize" /></button>
        <strong>{es ? "REPRODUCIENDO" : "NOW PLAYING"}</strong>
        <button onClick={leavePlayer} aria-label={es ? "Volver al inicio" : "Back to Home"}><PodcastIcon kind="close" /></button>
      </header>
      <main className="podcast-full-player liquid-glass">
        <PodcastArtwork track={player.track} />
        <section className="podcast-track-info">
          <small>{player.track.flag} {player.track.language}</small>
          <h1>{player.track.title}</h1>
          <span>{es ? "Audio grabado" : "Recorded audio"}</span>
        </section>
        <section className="podcast-timeline">
          <input type="range" min="0" max={player.duration || 0} step="0.1" value={Math.min(player.currentTime, player.duration || 0)} onChange={(event) => player.seekTo(event.target.value)} aria-label={es ? "Progreso del podcast" : "Podcast progress"} style={{ "--podcast-progress": `${progress}%` }} />
          <div><span>{player.formatTime(player.currentTime)}</span><span>{player.formatTime(player.duration)}</span></div>
        </section>
        <section className="podcast-controls">
          <button onClick={() => player.skip(-15)} aria-label={es ? "Retroceder 15 segundos" : "Rewind 15 seconds"}><PodcastIcon kind="rewind" /><small>15</small></button>
          <button className="podcast-main-play" onClick={player.togglePlayback} aria-label={player.playing ? (es ? "Pausar podcast" : "Pause podcast") : (es ? "Reproducir podcast" : "Play podcast")}><PodcastIcon kind={player.playing ? "pause" : "play"} /></button>
          <button onClick={() => player.skip(15)} aria-label={es ? "Avanzar 15 segundos" : "Forward 15 seconds"}><PodcastIcon kind="forward" /><small>15</small></button>
        </section>
        <section className="podcast-speed" aria-label={es ? "Velocidad de reproducción" : "Playback speed"}>
          {[1, 1.25, 1.5, 2].map((value) => <button key={value} aria-pressed={player.speed === value} className={player.speed === value ? "active" : ""} onClick={() => player.changeSpeed(value)}>{value}x</button>)}
        </section>
        {player.error && <p className="podcast-error" role="alert">{es ? "No pudimos reproducir este audio. Inténtalo de nuevo." : player.error}</p>}
      </main>
    </div>
  );
}
