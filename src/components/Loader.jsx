import { useId } from "react";
import "./Loader.css";

/**
 * Reusable branded loading spinner (Uiverse.io design by andrew-manzyk).
 * Drop this in anywhere you currently show a "Loading..." message.
 *
 *   <Loader />                          full-size, centered, no label
 *   <Loader size={0.4} />               smaller, for inline/small areas
 *   <Loader label="Loading dashboard" /> keeps a text label underneath
 *
 * Each instance gets its own SVG mask id via useId(), so several loaders
 * can appear on the same page at once without fighting over one #clipping id.
 */
export function Loader({ size = 0.45, label, className = "" }) {
  const maskId = `today-loader-mask-${useId()}`;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-6 ${className}`}>
      <div className="today-loader" style={{ transform: `scale(${size})` }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <mask id={maskId}>
            <polygon points="0,0 100,0 100,100 0,100" fill="black" />
            <polygon points="25,25 75,25 50,75" fill="white" />
            <polygon points="50,25 75,75 25,75" fill="white" />
            <polygon points="35,35 65,35 50,65" fill="white" />
            <polygon points="35,35 65,35 50,65" fill="white" />
            <polygon points="35,35 65,35 50,65" fill="white" />
            <polygon points="35,35 65,35 50,65" fill="white" />
          </mask>
        </svg>
        <div
          className="today-loader-box"
          style={{ WebkitMask: `url(#${maskId})`, mask: `url(#${maskId})` }}
        />
      </div>
      {label && <p className="text-sm font-medium text-neutral-400">{label}</p>}
    </div>
  );
}