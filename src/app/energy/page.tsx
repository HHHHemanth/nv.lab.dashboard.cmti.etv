"use client"
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion"
import { DashboardLayout } from "../../components/dashboard-layout2"
import EngHeroSection from "../../components/EngHeroSection";
import FooterSection from "../../components/FooterSection";
import EnergyTimeDomainGraph from "../../components/EnergyTimeDomain";

export default function EnergyPage() {
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      // no ease needed here typically
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

return(
    <DashboardLayout>
      <ScrollOnHash />        {/* render it here */}

          <motion.div
        className="mt-20 max-w-6xl mx-auto space-y-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
      <section id="eng-hero-section">
        {/* Hero Section */}
        <EngHeroSection itemVariants={itemVariants} />
          </section>
    <EnergyTimeDomainGraph/>
        <FooterSection/>
    </motion.div>

    </DashboardLayout>


)




}