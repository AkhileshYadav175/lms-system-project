"use client";

/**
 * Live biometric punch desk: clock, 3-second hold-to-punch fingerprint button,
 * campus chip, today's check-in/out times and the small punch-in/out buttons.
 * Purely presentational — all state and the hold logic come from the page.
 */

// Ring geometry (r=96): 603 ≈ full circumference = empty ring, 301 = half, 0 = full
const RING_EMPTY = 603;
const RING_HALF = 301;

export default function PunchStation({
  dateLabel,
  clock,
  campus,
  todayRecord,
  isCheckedIn,
  isCheckedOut,
  isFullyPunched,
  punchLoading,
  hold,
}) {
  const clockState = clock;
  const stationState = isFullyPunched ? "done" : "red";

  // While the big button is held, the ring fills from its current level to full
  const ringBase = isFullyPunched ? 0 : isCheckedIn ? RING_HALF : RING_EMPTY;
  const ringOffset = hold.holdTarget === "main" ? ringBase * (1 - hold.progress) : ringBase;

  // Small buttons fill left-to-right while held
  const holdFillStyle = (target) => ({
    touchAction: "none",
    userSelect: "none",
    ...(hold.holdTarget === target && {
      backgroundImage: `linear-gradient(90deg, rgba(215,29,58,0.45) ${hold.progress * 100}%, transparent ${hold.progress * 100}%)`,
    }),
  });

  return (
    <div className="card station" data-state={stationState}>
      {/* Date & Live Clock */}
      <p className="st-date">
        {dateLabel}
      </p>

      <div className="clock">
        <span className="clk-hm mono">{clockState.hoursMinutes}</span>
        <span className="clk-s mono">{clockState.seconds}</span>
        <span className="clk-ap mono">{clockState.ampm}</span>
      </div>

      {/* Biometric Circular Button */}
      <div className="pbtn-wrap">
        <div className="aura" />
        <button
          type="button"
          className={`pbtn ${hold.holdTarget === "main" ? "is-holding" : ""}`}
          {...hold.bind("main")}
          disabled={punchLoading || isFullyPunched}
          aria-label={
            !isCheckedIn
              ? "Press and hold for 3 seconds to punch in"
              : !isCheckedOut
              ? "Press and hold for 3 seconds to punch out"
              : "Attendance completed for today"
          }
          title={
            !isCheckedIn
              ? "Hold for 3 seconds to Punch In"
              : !isCheckedOut
              ? "Hold for 3 seconds to Punch Out"
              : "Attendance completed for today"
          }
        >
          <svg className="pring" viewBox="0 0 208 208">
            <circle className="pring-track" cx="104" cy="104" r="96" />
            <circle className="pring-ticks" cx="104" cy="104" r="96" />
            <circle
              className="pring-bar"
              cx="104"
              cy="104"
              r="96"
              strokeDasharray={RING_EMPTY}
              strokeDashoffset={ringOffset}
              style={{
                transition: hold.holdTarget === "main" ? "none" : "stroke-dashoffset 0.45s ease-out",
              }}
            />
          </svg>

          <div className="pbtn-core">
            {/* Fingerprint Biometric SVG Icon */}
            <svg
              className="w-11 h-11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
              <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              <path d="M2 16h.01" />
              <path d="M21.8 16c.2-2 .131-5.354 0-6" />
              <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
              <path d="M4 10.95C4.24 6.8 7.37 4 12 4c4.63 0 7.76 2.8 8 6.95" />
              <path d="M8 12a4 4 0 0 1 8 0c0 1.84.1 4.22.4 6" />
              <path d="M18 20c-.5 1-1.5 2-2.8 2" />
              <path d="M6 18c0 .5 0 1 .2 1.5" />
            </svg>

            <b>
              {punchLoading
                ? "WAIT"
                : isFullyPunched
                ? "DONE"
                : isCheckedIn
                ? "PUNCH OUT"
                : "PUNCH IN"}
            </b>

            <small>
              {isFullyPunched
                ? "Completed"
                : hold.holdTarget === "main"
                ? `Keep holding… ${hold.secondsLeft}s`
                : "Hold 3 sec to punch"}
            </small>
          </div>
        </button>
      </div>

      {/* Campus Location Chip */}
      <div className="loc">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <b>{campus}</b>
        <span className="loc-ok">
          <i />
          On campus
        </span>
      </div>

      {/* Check In / Check Out Boxes */}
      <div className="times">
        <div id="tIn" className={`tcard ${todayRecord?.in ? "on" : ""}`}>
          <small>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            CHECK IN
          </small>
          <b className="mono c-ok">
            {todayRecord?.in || "—"}
          </b>
          <span>
            {todayRecord?.in
              ? "On time"
              : "Pending"}
          </span>
        </div>

        <div id="tOut" className={`tcard ${todayRecord?.out ? "on" : ""}`}>
          <small>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
            CHECK OUT
          </small>
          <b className="mono">
            {todayRecord?.out || (isCheckedIn ? "In class" : "--:--")}
          </b>
          <span>
            {todayRecord?.out
              ? "Completed"
              : isCheckedIn
              ? "In session"
              : "Pending"}
          </span>
        </div>
      </div>

      {/* Dual Action Buttons matching Screenshot 2 */}
      <div className="actions">
        <button
          type="button"
          className="act"
          {...hold.bind("in")}
          disabled={isCheckedIn || punchLoading || (hold.isHolding && hold.holdTarget !== "in")}
          style={holdFillStyle("in")}
        >
          <div>
            <b>PUNCH IN</b>
            <small>
              {todayRecord?.in
                ? "Completed"
                : hold.holdTarget === "in"
                ? `Keep holding… ${hold.secondsLeft}s`
                : "Hold 3 sec"}
            </small>
          </div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        <button
          type="button"
          className="act"
          {...hold.bind("out")}
          disabled={!isCheckedIn || isCheckedOut || punchLoading || (hold.isHolding && hold.holdTarget !== "out")}
          style={holdFillStyle("out")}
        >
          <div>
            <b>PUNCH OUT</b>
            <small>
              {todayRecord?.out
                ? "Completed"
                : hold.holdTarget === "out"
                ? `Keep holding… ${hold.secondsLeft}s`
                : "Hold 3 sec"}
            </small>
          </div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
