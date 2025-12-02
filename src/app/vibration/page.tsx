"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../components/dashboard-layout2";
import VibHeroSection from "../../components/VibHeroSection";
import FooterSection from "../../components/FooterSection";
import ParameterGraph from "../../components/parameterGraph";
import TimeDomainGraph from "../../components/timedomainGraph";
import FFTGraph from "../../components/fftGraph";

export default function EnergyPage() {
  // <--- hooks must be INSIDE the component
  const [selectedPoint, setSelectedPoint] = useState<{ assetId:string; assetPartId:string; axis:string; dateTime:number; type:string } | null>(null);
  const [jwtToken, setJwtToken] = useState<string>(""); // set via auth or paste manually

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  function ScrollOnHash() {
    const pathname = usePathname();
    useEffect(() => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      if (!hash) return;
      setTimeout(() => {
        const id = hash.replace("#", "");
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }, [pathname]);
    return null;
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as any,
      },
    },
  };

  return (
    <DashboardLayout>
      <ScrollOnHash />

      <motion.div
        className="mt-20 max-w-6xl mx-auto space-y-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <section id="vib-hero-section">
          <VibHeroSection itemVariants={itemVariants} />
        </section>

        <ParameterGraph onPointSelected={(p) => {
    console.log("[page] onPointSelected received:", p);
    setSelectedPoint(p);
  }}
  onTokenChange={(t) => {
    console.log("[page] token changed:", t ? t.slice(0, 24) + "..." : "<empty>");
    setJwtToken(t);
  }}
/>

        <TimeDomainGraph trigger={selectedPoint} token={jwtToken} />
        <FFTGraph trigger={selectedPoint} token={jwtToken} />
        <FooterSection />
      </motion.div>
    </DashboardLayout>
  );
}
