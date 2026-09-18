"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import styles from "./page.module.css";

const NAV_LINKS = [
  { label: "Home", href: "/", active: true },
  { label: "Product", href: "#" },
  { label: "Blender Add-on", href: "#" },
  { label: "Contact", href: "#" },
];

const STATS = [
  { icon: "<", target: 50, suffix: "ms", decimals: 0, label: "Push Sync Time" },
  { icon: "%", target: 99.99, suffix: "%", decimals: 2, label: "Checksum Integrity" },
  { icon: "*", target: 24, suffix: "/7", decimals: 0, label: "Version History" },
  { icon: "#", target: 9, suffix: "+", decimals: 0, label: "3D Formats Supported" },
];

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState<number[]>(STATS.map(() => 0));
  const started = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            STATS.forEach((stat, i) => {
              const startOffset = 480 + i * 90;
              const duration = 1500 + i * 80;
              window.setTimeout(() => {
                const startTime = performance.now();
                const tick = (now: number) => {
                  const progress = Math.min(1, (now - startTime) / duration);
                  const eased = easeOutCubic(progress);
                  setValues((prev) => {
                    const next = [...prev];
                    next[i] = stat.target * eased;
                    return next;
                  });
                  if (progress < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
              }, startOffset);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, values };
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { containerRef, values } = useCountUp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 720) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.body.classList.toggle("menu-open", menuOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <video className={styles.bgVideo} autoPlay muted loop playsInline>
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
        <div className={styles.bgFade} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logoBtn} aria-label="MeshHub">
          <Logo size={26} />
        </Link>

        <nav className={styles.navPill} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`${styles.navLink} ${link.active ? styles.navLinkActive : ""}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link href="/auth/login" className={styles.signIn}>
          Sign in
        </Link>

        <button
          type="button"
          className={styles.burger}
          data-open={menuOpen}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={styles.burgerBar} />
          <span className={styles.burgerBar} />
          <span className={styles.burgerBar} />
        </button>
      </header>

      {menuOpen && (
        <>
          <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
          <div className={styles.sheet} role="menu">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                role="menuitem"
                className={`${styles.sheetLink} ${link.active ? styles.sheetLinkActive : ""}`}
                style={{ animationDelay: `${0.05 + i * 0.05}s` }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/auth/login"
              className={styles.sheetSignIn}
              style={{ animationDelay: `${0.05 + NAV_LINKS.length * 0.05}s` }}
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
          </div>
        </>
      )}

      {/* Hero */}
      <main className={styles.hero}>
        <div className={`${styles.trustRow} ${styles.anim}`} style={{ "--d": "0.05s" } as React.CSSProperties}>
          <div className={styles.avatarRing}>
            <div className={styles.avatarInner}>
              <i className="fa-solid fa-cube" />
            </div>
          </div>
          <div className={styles.avatarRing}>
            <div className={styles.avatarInner}>
              <i className="fa-solid fa-layer-group" />
            </div>
          </div>
          <div className={styles.avatarRing}>
            <div className={styles.avatarInner}>
              <i className="fa-brands fa-github" />
            </div>
          </div>
          <div className={styles.trustPill}>Built for studios &amp; solo creators</div>
        </div>

        <h1 className={styles.headline}>
          <span className={styles.headlineLine}>Version Control</span>
          <span className={styles.headlineLine}>Designed For 3D</span>
        </h1>

        <p className={`${styles.subhead} ${styles.anim}`} style={{ "--d": "0.28s" } as React.CSSProperties}>
          Push, track and restore every Blender project with a modular
          version control platform built for creative production.
        </p>

        <Link
          href="/auth/register"
          className={`${styles.cta} ${styles.animPulse}`}
          style={{ "--d": "0.4s" } as React.CSSProperties}
        >
          Get Started
        </Link>
      </main>

      {/* Stats footer */}
      <div className={styles.stats} ref={containerRef}>
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`${styles.statItem} ${styles.anim}`}
            style={{ "--d": `${0.5 + i * 0.08}s` } as React.CSSProperties}
          >
            <span className={styles.statIcon}>{stat.icon}</span>
            <span className={styles.statValue}>
              {values[i].toFixed(stat.decimals)}
              {stat.suffix}
            </span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
