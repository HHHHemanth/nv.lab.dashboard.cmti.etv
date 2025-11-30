// ./app/dashboard/page.tsx
"use client"

import { motion } from "framer-motion"
import { DashboardLayout } from "../components/dashboard-layout"
import HeroSection from "../components/HeroSection";
import ThreeDCard from "../components/threeDcard"; // <-- new import
import BlurText from "../components/BlurText";
import CaseStudy from "../components/caseStudy";
const handleAnimationComplete = () => {
  console.log('Animation completed!');
};
import LoopLogoSection from "../components/LoopLogoSection";
import ContactUs from "../components/contactUs";
import FooterSection from "../components/FooterSection";
export default function DashboardPage() {
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
      <motion.div
        className="mt-20 max-w-6xl mx-auto space-y-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Section */}
        <HeroSection itemVariants={itemVariants} />

        {/* Insert formatted ThreeDCard component here */}

        <motion.div variants={itemVariants} className="space-y-4">

          <BlurText
            text="Monitoring Features"
            delay={300}
            animateBy="words"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className="text-5xl mb-10 font-bold mt-20"
          />

          <ThreeDCard />
        </motion.div>

        {/* --- add CaseStudy right after --- */}
        <motion.div variants={itemVariants}>
          <CaseStudy />
        </motion.div>


        {/* ---- Technology Logo Loop ---- */}
        <motion.div variants={itemVariants}>
          <LoopLogoSection />
        </motion.div>

        {/* ---- Contact Us Section ---- */}
        <motion.div variants={itemVariants}>
          <BlurText
            text="Contact Us"
            delay={300}
            animateBy="words"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className="text-5xl font-bold mt-20 text-center flex justify-center"
          />
          <ContactUs />
        </motion.div>

        {/* ---- Footer Section ---- */}

        <FooterSection/>


      </motion.div>
    </DashboardLayout>
  )
}
