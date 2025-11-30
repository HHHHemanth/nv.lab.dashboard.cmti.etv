// ./components/ui/ThreeDCard.tsx
"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShimmerButton } from "@/components/ui/shimmer-button"
type CardData = {
  id: number;
  imageSrc: string;
  title: string;
  description: string;
  link?: string;
};

function TiltArea({
  imageSrc,
  altText,
  containerHeight = "220px",
}: {
  imageSrc: string;
  altText?: string;
  containerHeight?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-t-lg"
      style={{ height: containerHeight, transformStyle: "preserve-3d" }}
    >
      <Image
        src={imageSrc}
        alt={altText ?? ""}
        fill
        sizes="(max-width: 600px) 100vw, 800px"
        style={{ objectFit: "cover" }}
        className="block"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}

function TiltCard({ card }: { card: CardData }) {
  const rootRef = useRef<HTMLElement | null>(null);

  const rotateAmplitude = 10;
  const scaleOnHover = 1.03;

  const onMove = (e: React.MouseEvent) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width - 0.5;
    const ry = (e.clientY - rect.top) / rect.height - 0.5;

    const rotateY = rx * rotateAmplitude * 2;
    const rotateX = -ry * rotateAmplitude * 2;

    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleOnHover})`;
    el.style.transition = "transform 0.06s ease";
    el.style.willChange = "transform";
  };

  const onLeave = () => {
    const el = rootRef.current;
    if (!el) return;
    el.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)`;
    el.style.transition = "transform 0.25s cubic-bezier(.2,.8,.2,1)";
  };

  return (
    
    <article
      ref={rootRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="rounded-lg border border-border shadow-xl overflow-hidden bg-card"
      style={{ transformStyle: "preserve-3d", transformOrigin: "center" }}
    >
      <TiltArea imageSrc={card.imageSrc} altText={card.title} containerHeight="260px" />

      {/* CONTENT AREA */}
      <div className="p-6 bg-linear-to-t from-black/60 to-transparent text-white">
        <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
        <p className="text-sm text-muted-foreground leading-6 mb-4">
          {card.description}
        </p>

        {/* BUTTON AREA */}
<ShimmerButton
className="text-black text-base"
  shimmerColor="rgba(0, 0, 0, 1)"
  background="#ffffff"
>
  Explore More
</ShimmerButton>
      </div>
    </article>
  );
}

export default function ThreeDCard() {
  const cards: CardData[] = [
    {
      id: 1,
      imageSrc: "/images/energy2.png",
      title: "Energy Monitoring",
      description:
        "Our system provides real-time visibility into three-phase power performance, helping you understand how your equipment behaves under actual operating conditions. Live voltage, current, and power trends reveal how the load fluctuates over time, allowing you to quickly identify irregular patterns or developing issues.",
      link: "/energy",
    },
    {
      id: 2,
      imageSrc: "/images/temp.png",
      title: "Temperature Monitoring",
      description:
        "Continuous temperature tracking for equipment and environs, enabling early detection of thermal anomalies and improved thermal management.",
      link: "/temperature",
    },
    {
      id: 3,
      imageSrc: "/images/vib.png",
      title: "Vibration Monitoring",
      description:
        "Vibration signatures and trends to catch mechanical degradation early and support predictive maintenance.",
      link: "/vibration",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-6">

      {/* ⭐ SECTION TITLE ADDED HERE ⭐ */}


      {cards.map((c) => (
        <TiltCard key={c.id} card={c} />
      ))}
    </div>
  );
}
