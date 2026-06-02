"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * NavController – makes the global <header> behave as a hover-reveal overlay.
 *
 * On mount  : slides the header off-screen (translateY -100%) and raises its
 *             z-index above the full-screen page content.
 * On hover  : slides the header back into view (hover zone at top of viewport
 *             OR hovering the header itself).
 * On unmount: restores all inline styles so other pages are unaffected.
 */
export function NavController() {
  const navRef    = useRef<HTMLElement | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (navRef.current) navRef.current.style.transform = "translateY(0)";
  }, []);

  const scheduleHide = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (navRef.current) navRef.current.style.transform = "translateY(-100%)";
    }, 180);
  }, []);

  useEffect(() => {
    const nav = document.querySelector("header") as HTMLElement | null;
    if (!nav) return;
    navRef.current = nav;

    // Override nav positioning so it floats above the full-screen page
    Object.assign(nav.style, {
      position:   "fixed",
      top:        "0",
      left:       "0",
      right:      "0",
      zIndex:     "200",
      transform:  "translateY(-100%)",
      transition: "transform 0.2s ease",
    });

    nav.addEventListener("mouseenter", show);
    nav.addEventListener("mouseleave", scheduleHide);

    return () => {
      // Restore original styles on unmount (navigating away from this page)
      nav.style.cssText = "";
      nav.removeEventListener("mouseenter", show);
      nav.removeEventListener("mouseleave", scheduleHide);
      navRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show, scheduleHide]);

  // Invisible trigger strip at the very top of the viewport.
  // When the mouse enters this strip the nav slides down.
  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-3 z-[201]"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    />
  );
}
