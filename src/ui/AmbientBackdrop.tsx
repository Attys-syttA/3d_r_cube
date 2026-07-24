import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface AmbientBackdropProps {
  isMusicRequested: boolean;
  onMusicPlaybackChange: (isPlaying: boolean) => void;
}

export interface AmbientBackdropHandle {
  pauseMusic: () => void;
  playMusic: () => boolean;
  retryMusic: () => void;
}

const VIDEO_ID = "1c3hfdbLZ9c";
const YOUTUBE_API_SRC = "https://www.youtube.com/iframe_api";
const PLAYER_ELEMENT_ID = "ambient-youtube-player";
const PLAYER_VOLUME = 25;
const YOUTUBE_STATE_ENDED = 0;
const YOUTUBE_STATE_PLAYING = 1;
const YOUTUBE_STATE_PAUSED = 2;

interface YouTubePlayer {
  pauseVideo: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
}

interface YouTubeApi {
  Player: new (
    elementId: string,
    options: {
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: { data: number }) => void;
      };
      height?: string;
      playerVars: Record<string, number | string>;
      videoId: string;
      width?: string;
    }
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface Particle {
  alpha: number;
  radius: number;
  speed: number;
  x: number;
  y: number;
}

function createParticles(width: number, height: number): Particle[] {
  return Array.from({ length: 78 }, () => ({
    alpha: 0.18 + Math.random() * 0.4,
    radius: 1 + Math.random() * 2.6,
    speed: 0.25 + Math.random() * 0.75,
    x: Math.random() * width,
    y: Math.random() * height
  }));
}

export const AmbientBackdrop = forwardRef<AmbientBackdropHandle, AmbientBackdropProps>(function AmbientBackdrop(
  { isMusicRequested, onMusicPlaybackChange },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const shouldPlayRef = useRef(false);
  const imageUrl = `${import.meta.env.BASE_URL}assets/esperindex.png`;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let frame = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio));
      height = Math.max(1, Math.floor(rect.height * window.devicePixelRatio));
      canvas.width = width;
      canvas.height = height;
      particles = createParticles(width, height);
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(255, 255, 255, 0.86)";
      for (const particle of particles) {
        particle.y -= particle.speed * window.devicePixelRatio;
        if (particle.y < -10) {
          particle.y = height + 10;
          particle.x = Math.random() * width;
        }
        context.globalAlpha = particle.alpha;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * window.devicePixelRatio, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const createPlayer = () => {
      if (playerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(PLAYER_ELEMENT_ID, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          modestbranding: 1,
          playlist: VIDEO_ID,
          rel: 0
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(PLAYER_VOLUME);
            if (shouldPlayRef.current) {
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            if (event.data === YOUTUBE_STATE_PLAYING) {
              onMusicPlaybackChange(true);
              return;
            }
            if (event.data === YOUTUBE_STATE_PAUSED || event.data === YOUTUBE_STATE_ENDED) {
              onMusicPlaybackChange(false);
            }
          }
        }
      });
    };

    if (window.YT) {
      createPlayer();
      return;
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      createPlayer();
    };

    if (!document.querySelector(`script[src="${YOUTUBE_API_SRC}"]`)) {
      const tag = document.createElement("script");
      tag.src = YOUTUBE_API_SRC;
      document.body.appendChild(tag);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    pauseMusic: () => {
      shouldPlayRef.current = false;
      playerRef.current?.pauseVideo();
    },
    playMusic: () => {
      shouldPlayRef.current = true;
      if (!playerRef.current) return true;
      playerRef.current.setVolume(PLAYER_VOLUME);
      playerRef.current.playVideo();
      return true;
    },
    retryMusic: () => {
      if (!shouldPlayRef.current || !playerRef.current) return;
      playerRef.current.setVolume(PLAYER_VOLUME);
      playerRef.current.playVideo();
    }
  }));

  useEffect(() => {
    shouldPlayRef.current = isMusicRequested;
    if (!isMusicRequested) {
      playerRef.current?.pauseVideo();
    }
  }, [isMusicRequested]);

  return (
    <div className="ambient-backdrop" aria-hidden="true">
      <div className="ambient-backdrop__image" style={{ backgroundImage: `url("${imageUrl}")` }} />
      <div className="ambient-backdrop__light" />
      <div className="ambient-backdrop__scanline" />
      <canvas ref={canvasRef} className="ambient-backdrop__particles" />
      <div id={PLAYER_ELEMENT_ID} className="ambient-backdrop__music" />
    </div>
  );
});
