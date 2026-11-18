"use client";

import { useEffect, useRef, useState } from "react";
import { playButtonSound, vibrate } from "@/lib/buttonSounds";

/**
 * Press-and-hold confirmation (e.g. "hold 3 seconds to punch").
 *
 * - Works with mouse, touch, pen (pointer events) and keyboard (Space / Enter).
 * - Plays a press click, an early-release click, and a success sound + vibration.
 * - Several buttons can share one hook; `bind(target)` tags which one is held.
 *
 * @param {object}   opts
 * @param {number}   opts.durationMs      how long the press must last
 * @param {Function} opts.onConfirm       (target) => void, called once the hold completes
 * @param {Function} [opts.onEarlyRelease] (target) => void, called when let go too soon
 * @param {Function} [opts.canStart]      (target) => boolean, return false to refuse the hold
 */
export default function useHoldToConfirm({ durationMs = 3000, onConfirm, onEarlyRelease, canStart }) {
  const [holdTarget, setHoldTarget] = useState(null);
  const [progress, setProgress] = useState(0);
  const state = useRef({ raf: null, start: 0, active: false, target: null });

  // Always call the latest callbacks (they close over fresh component state)
  const callbacks = useRef({ onConfirm, onEarlyRelease, canStart });
  callbacks.current = { onConfirm, onEarlyRelease, canStart };

  const stopLoop = () => {
    if (state.current.raf) cancelAnimationFrame(state.current.raf);
    state.current.raf = null;
    state.current.active = false;
  };

  useEffect(() => () => stopLoop(), []);

  const reset = () => {
    setHoldTarget(null);
    setProgress(0);
  };

  const start = (target) => (e) => {
    if (e?.type === "keydown") {
      if (e.repeat || (e.key !== " " && e.key !== "Enter")) return;
      e.preventDefault();
    }
    if (e?.pointerType === "mouse" && e.button !== 0) return;
    if (state.current.active) return;
    if (callbacks.current.canStart && !callbacks.current.canStart(target)) return;
    try {
      e?.currentTarget?.setPointerCapture?.(e.pointerId);
    } catch (err) {}

    playButtonSound("press");
    vibrate(15);
    state.current = { raf: null, start: performance.now(), active: true, target };
    setHoldTarget(target);
    setProgress(0);

    const tick = (now) => {
      if (!state.current.active) return;
      const p = Math.min(1, (now - state.current.start) / durationMs);
      setProgress(p);
      if (p >= 1) {
        stopLoop();
        playButtonSound("success");
        vibrate([40, 60, 40]);
        reset();
        callbacks.current.onConfirm?.(target);
        return;
      }
      state.current.raf = requestAnimationFrame(tick);
    };
    state.current.raf = requestAnimationFrame(tick);
  };

  const cancel = (e) => {
    if (e?.type === "keyup" && e.key !== " " && e.key !== "Enter") return;
    if (!state.current.active) return;
    const { start: startedAt, target } = state.current;
    stopLoop();
    playButtonSound("release");
    reset();
    if (performance.now() - startedAt < durationMs) callbacks.current.onEarlyRelease?.(target);
  };

  /** Spread onto a <button> to make it hold-to-confirm. */
  const bind = (target) => ({
    onPointerDown: start(target),
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
    onKeyDown: start(target),
    onKeyUp: cancel,
    onBlur: cancel,
    onContextMenu: (e) => e.preventDefault(),
  });

  return {
    holdTarget,
    isHolding: holdTarget !== null,
    progress,
    secondsLeft: Math.max(1, Math.ceil((durationMs * (1 - progress)) / 1000)),
    bind,
  };
}
