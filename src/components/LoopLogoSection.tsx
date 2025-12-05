// ./components/LoopLogoSection.tsx
"use client";

import LogoLoop from "./LogoLoop"; // <-- use exact filename / casing
import Image from "next/image";

export default function LoopLogoSection() {
  const techLogos = [
    {
      node: (
        <Image
          src="/logos/logo1.1.png"
          alt="L1"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo1",
      href: "#",
    },
    {
      node: (
        <Image
          src="/logos/logo2.1.png"
          alt="L2"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo2",
      href: "#",
    },
    {
      node: (
        <Image
          src="/logos/logo3.1.png"
          alt="L3"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo3",
      href: "#",
    },
    {
      node: (
        <Image
          src="/logos/logo4.1.png"
          alt="L4"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo4",
      href: "#",
    },
        {
      node: (
        <Image
          src="/logos/logo5.1.png"
          alt="L5"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo5",
      href: "#",
    },
            {
      node: (
        <Image
          src="/logos/logo6.1.png"
          alt="L6"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo6",
      href: "#",
    },
            {
      node: (
        <Image
          src="/logos/logo7.1.png"
          alt="L7"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo7",
      href: "#",
    },
    {
      node: (
        <Image
          src="/logos/logo8.1.png"
          alt="L8"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo8",
      href: "#",
    },
    {
      node: (
        <Image
          src="/logos/logo9.1.png"
          alt="L9"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo9",
      href: "#",
    },
    {
      node: (
        <Image
          src="/logos/logo10.1.png"
          alt="L10"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo10",
      href: "#",
    },
    {
      node: (
        <Image
          src="/logos/logo11.1.png"
          alt="L11"
          width={100}
          height={100}
          className="object-contain"
        />
      ),
      title: "logo11",
      href: "#",
    },
  ];

  return (
    <section className="w-full py-16 m-60">
      {/* <h2 className="text-3xl font-bold text-white mb-6">Technologies We Use</h2> */}

      <div className="relative h-[100px] overflow-hidden rounded-xl">
        <LogoLoop
          logos={techLogos}
          speed={50}
          direction="left"
          logoHeight={60}
          gap={40}
          hoverSpeed={0}
          scaleOnHover
          fadeOut
          fadeOutColor="#0a0a0a"
          ariaLabel="Scrolling company logos"
        />
      </div>
    </section>
  );
}
