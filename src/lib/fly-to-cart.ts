/**
 * Sends a copy of the product image arcing into the cart icon.
 *
 * This exists to answer "did that work?" without a page change. The clone is
 * fixed-position and pointer-events-none, so it never affects layout or
 * interaction, and it removes itself when the transition ends.
 */
export function flyToCart(source: HTMLElement | null | undefined) {
  if (typeof window === "undefined" || !source) return;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const image = source.querySelector("img") ?? source;
  const src = image instanceof HTMLImageElement ? image.currentSrc || image.src : null;

  const flyer = document.createElement(src ? "img" : "div");
  if (src && flyer instanceof HTMLImageElement) flyer.src = src;

  flyer.className = "bz-flyer";
  flyer.style.left = `${from.left}px`;
  flyer.style.top = `${from.top}px`;
  flyer.style.width = `${from.width}px`;
  flyer.style.height = `${from.height}px`;
  document.body.appendChild(flyer);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  requestAnimationFrame(() => {
    flyer.style.transform = `translate(${dx}px, ${dy}px) scale(0.12) rotate(-12deg)`;
    flyer.style.opacity = "0.25";
  });

  const cleanup = () => flyer.remove();
  flyer.addEventListener("transitionend", cleanup, { once: true });
  // Belt and braces: a dropped transitionend must not leak a node.
  setTimeout(cleanup, 1200);
}
