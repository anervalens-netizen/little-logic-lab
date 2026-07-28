import { useEffect } from "react";
import { ContentPackStatusPortal } from "../screens/ContentPackStatusPortal";

export function AppShell() {
  useEffect(() => {
    let lastTouchEnd = 0;
    const preventAccidentalZoom = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 350) event.preventDefault();
      lastTouchEnd = now;
    };

    document.addEventListener("touchend", preventAccidentalZoom, {
      passive: false,
    });
    void import("../screens/splash").then(({ showSplash }) => showSplash());

    return () => {
      document.removeEventListener("touchend", preventAccidentalZoom);
    };
  }, []);

  return (
    <>
      <main
        id="screen-root"
        aria-live="polite"
        aria-label="Minte în joacă"
      />
      <ContentPackStatusPortal />
    </>
  );
}
