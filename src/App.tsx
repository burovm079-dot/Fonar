import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flashlight, ShieldCheck, Zap, BatteryFull, ChevronDown, Check, Sparkles } from "lucide-react";

type TorchCaps = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraint = MediaTrackConstraintSet & { torch?: boolean };

function useTorch() {
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isOn, setIsOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const turnOff = useCallback(async () => {
    setBusy(true);
    try {
      const track = trackRef.current;
      if (track?.readyState === "live") {
        try { await track.applyConstraints({ advanced: [{ torch: false } as TorchConstraint] }); }
        catch { /* Stopping the track releases the torch on browsers that reject this constraint. */ }
      }
    } finally {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      trackRef.current = null;
      setIsOn(false);
      setBusy(false);
    }
  }, []);

  const turnOn = useCallback(async () => {
    if (busy || isOn) return;
    setBusy(true);
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Откройте сайт по HTTPS в современном браузере.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      const track = stream.getVideoTracks()[0];
      if (!track) {
        stream.getTracks().forEach((item) => item.stop());
        throw new Error("Не удалось получить доступ к камере.");
      }
      const capabilities = track.getCapabilities() as TorchCaps;
      if (!capabilities.torch) {
        stream.getTracks().forEach((item) => item.stop());
        throw new Error("Этот браузер не поддерживает управление вспышкой. Попробуйте Chrome на Android.");
      }
      await track.applyConstraints({ advanced: [{ torch: true } as TorchConstraint] });
      trackRef.current = track;
      streamRef.current = stream;
      setIsOn(true);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "NotAllowedError") {
        setError("Разрешите доступ к камере в настройках браузера и попробуйте ещё раз.");
      } else {
        setError(cause instanceof Error ? cause.message : "Не получилось включить фонарик.");
      }
    } finally {
      setBusy(false);
    }
  }, [busy, isOn]);

  useEffect(() => {
    const stop = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      trackRef.current = null;
      setIsOn(false);
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") stop(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, []);

  return { isOn, busy, error, turnOn, turnOff };
}

const rise = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function App() {
  const { isOn, busy, error, turnOn, turnOff } = useTorch();
  const [showInfo, setShowInfo] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const proTapRef = useRef(0);
  const toggle = () => { if (busy) return; if (isOn) setShowPro(true); else void turnOn(); };
  const handleProTap = () => {
    const now = Date.now();
    if (now - proTapRef.current < 1200) {
      proTapRef.current = 0;
      setShowPro(false);
      void turnOff();
    } else {
      proTapRef.current = now;
    }
  };

  return (
    <main className={`app ${isOn ? "is-lit" : ""}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grain" />
      <header className="topbar">
        <a className="brand" href="./"><span className="brand-mark"><Flashlight size={19} /></span><span>FONAR<span className="brand-dot">.</span></span></a>
        <div className="top-status"><span className={`status-dot ${isOn ? "online" : ""}`} />{isOn ? "СВЕТ ВКЛЮЧЁН" : "ГОТОВ К РАБОТЕ"}</div>
      </header>

      <section className="hero">
        <motion.div className="eyebrow" variants={rise} initial="hidden" animate="visible"><Sparkles size={13} />СВЕТ ВСЕГДА РЯДОМ</motion.div>
        <motion.h1 variants={rise} initial="hidden" animate="visible" transition={{ delay: 0.08 }}>Когда нужен<br /><span>свет.</span></motion.h1>
        <motion.p className="subtitle" variants={rise} initial="hidden" animate="visible" transition={{ delay: 0.16 }}>Один тап — и темнота больше не проблема.</motion.p>

        <motion.div className={`torch-stage ${isOn ? "torch-stage-on" : ""}`} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18, duration: 0.8 }}>
          <AnimatePresence>{isOn && <motion.div className="light-halo" initial={{ opacity: 0, scale: 0.65 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} />}</AnimatePresence>
          <div className="orbit orbit-a" /><div className="orbit orbit-b" />
          <motion.button className={`power-control ${isOn ? "power-control-on" : ""}`} onClick={toggle} whileTap={{ scale: 0.94 }} aria-label={isOn ? "Выключить фонарик" : "Включить фонарик"} aria-pressed={isOn} disabled={busy}>
            <span className="button-sheen" />
            <span className="power-icon-wrap">{busy ? <span className="loader" /> : <Flashlight size={43} strokeWidth={1.55} />}</span>
            <span className="power-label">{busy ? "СЕКУНДУ" : isOn ? "ВЫКЛЮЧИТЬ" : "ВКЛЮЧИТЬ"}</span>
            <span className="power-sub">{isOn ? "НАЖМИ, ЧТОБЫ ВЫКЛЮЧИТЬ" : "НАЖМИ, ЧТОБЫ ЗАЖЕЧЬ"}</span>
          </motion.button>
          <div className="stage-caption"><span className="caption-line" /><span>{isOn ? "FONAR АКТИВЕН" : "ТВОЙ КАРМАННЫЙ ФОНАРИК"}</span><span className="caption-line" /></div>
        </motion.div>

        <AnimatePresence mode="wait">
          {error ? <motion.div className="notice error-notice" key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}><span className="notice-icon">!</span><span>{error}</span></motion.div>
            : <motion.div className="trust-note" key="trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ShieldCheck size={15} /><span>Бесплатно. Без регистрации. Выключение доступно всегда.</span></motion.div>}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {showPro && isOn && (
          <motion.div className="pro-overlay" role="dialog" aria-modal="true" aria-labelledby="pro-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="pro-dialog" initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}>
              <span className="pro-kicker">FONAR PREMIUM</span>
              <h2 id="pro-title">Включение фонарика было бесплатным</h2>
              <p>Выключение — только с PRO-подпиской</p>
              <strong className="pro-price">19.99$</strong>
              <button className="pro-unlock" onClick={handleProTap}>РАЗБЛОКИРОВАТЬ PRO</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="feature-row">
        <div className="feature"><span className="feature-icon"><Zap size={17} /></span><span><strong>Мгновенно</strong><small>Один тап</small></span></div>
        <div className="feature-divider" />
        <div className="feature"><span className="feature-icon"><ShieldCheck size={17} /></span><span><strong>Просто</strong><small>Без аккаунта</small></span></div>
        <div className="feature-divider" />
        <div className="feature"><span className="feature-icon"><BatteryFull size={17} /></span><span><strong>Под рукой</strong><small>В любой момент</small></span></div>
      </section>

      <footer className="footer">
        <button className="info-toggle" onClick={() => setShowInfo((value) => !value)} aria-expanded={showInfo}>Как это работает <ChevronDown size={15} className={showInfo ? "chevron-open" : ""} /></button>
        <AnimatePresence>{showInfo && <motion.p className="info-copy" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>FONAR использует вспышку камеры телефона. Браузер запросит разрешение на камеру — видеозапись не ведётся и не отправляется. Доступность зависит от модели телефона и браузера.</motion.p>}</AnimatePresence>
        <div className="footer-bottom"><span>© 2026 FONAR</span><span>СДЕЛАНО ДЛЯ ТВОЕГО КОМФОРТА <Check size={12} /></span></div>
      </footer>
    </main>
  );
}
