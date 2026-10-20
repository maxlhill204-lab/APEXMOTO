"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const finishes = [
  { name: "Matte black", image: "/products/apex-moto-rally-helmet-black/side.png", href: "/product/apex-moto-rally-helmet-matte-black", alt: "APEX MOTO rally helmet in matte black" },
  { name: "White / blue", image: "/products/apex-moto-rally-helmet-white/side.png", href: "/product/apex-moto-rally-helmet-white-blue", alt: "APEX MOTO rally helmet in white and blue" },
];

export function HelmetStage() {
  const [finish, setFinish] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * 12;
    const y = ((event.clientY - box.top) / box.height - 0.5) * -10;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setTilt({ x, y }));
  };

  return (
    <div className="lux-stage" onPointerMove={move} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className="lux-stage__halo" aria-hidden="true" />
      <div className="lux-stage__axis lux-stage__axis--one" aria-hidden="true" />
      <div className="lux-stage__axis lux-stage__axis--two" aria-hidden="true" />
      <span className="lux-stage__index">01 / 02 — RALLY HELMET</span>
      <div className="lux-stage__object" style={{ transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}>
        <Image key={finishes[finish].image} src={finishes[finish].image} alt={finishes[finish].alt} fill priority sizes="(max-width: 900px) 100vw, 54vw" />
      </div>
      <div className="lux-stage__bottom">
        <div className="lux-stage__finish" aria-label="Choose helmet finish">
          {finishes.map((item, index) => (
            <button key={item.name} type="button" className={finish === index ? "is-active" : ""} onClick={() => setFinish(index)} aria-pressed={finish === index}>
              <span className={`lux-stage__swatch lux-stage__swatch--${index}`} />{item.name}
            </button>
          ))}
        </div>
        <Link href={finishes[finish].href} className="lux-stage__link">Explore helmet <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
