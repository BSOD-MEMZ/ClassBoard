// Composable for Android-style ripple animation on class state transitions.
// Extracted from pages/index.vue to keep the page component lean.

export function useRipple() {
  function triggerRipple(): void {
    if (import.meta.server) return;

    let primary = getComputedStyle(document.documentElement)
      .getPropertyValue("--md-sys-color-primary")
      .trim();
    if (!primary || primary.length < 4) primary = "#39c5bb";

    const ripple = document.createElement("div");
    const size = Math.max(window.innerWidth, window.innerHeight) * 3;

    ripple.style.cssText = `
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      border-radius: 50%;
      width: ${size}px;
      height: ${size}px;
      left: ${-size / 2}px;
      bottom: ${-size / 2}px;
      background: ${primary};
      opacity: 0.38;
      transform: scale(0);
    `;
    document.body.appendChild(ripple);

    ripple
      .animate(
        [
          { transform: "scale(0)", opacity: 0.45 },
          { transform: "scale(0.3)", opacity: 0.28, offset: 0.3 },
          { transform: "scale(1)", opacity: 0 },
        ],
        {
          duration: 700,
          easing: "cubic-bezier(0.0, 0.0, 0.2, 1)",
          fill: "forwards",
        },
      )
      .onfinish = () => ripple.remove();
  }

  return { triggerRipple };
}
