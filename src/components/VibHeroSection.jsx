// ./components/VibHeroSection.tsx
"use client";
import { motion } from "framer-motion";
import DotGrid from "./DotGrid";
import DecryptedText from './DecryptedText';
import { ChartNetwork, ChartArea, ToolCase } from "lucide-react";
import GlitchText from './GlitchText';
export default function VibHeroSection({ itemVariants }) {
  return (
    <motion.div variants={itemVariants} className="relative overflow-hidden">
      <div className="glass-panel p-12 rounded-2xl border border-primary/20 relative overflow-hidden">

        {/* Strong internal glow */}
        <div
          className="
            absolute inset-0 pointer-events-none
            bg-gradient-to-br
            from-primary/40 via-secondary/30 to-accent/40
            opacity-70
            blur-3xl
            rounded-2xl
            mix-blend-overlay
          "
        />

        {/* Dark veil animation */}
        <div className="absolute inset-0 pointer-events-none -z-0">
          <DotGrid
            dotSize={5}
            gap={10}
            baseColor="#0A0A0A"
            activeColor="#8FFF70"
            proximity={120}
            shockRadius={250}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>

        {/* Content */}
        <div className="space-y-4 relative z-10 ">
          <div className="text-center flex justify-center">
            <DecryptedText
              style={{ fontSize: "4rem", fontWeight: 700, textAlign: "center" }}
              text="Vibration Analysis"
              speed={90}
              maxIterations={20}
              characters="ABCD1234!?"
              className="revealed"
              parentClassName="all-letters"
              encryptedClassName="encrypted"
              animateOn="both"
            />

          </div>



          <motion.p
            className="text-lg text-white max-w-2xl justify-self-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Gain insights into machine health by real-time vibration and FFT diagnostics.
          </motion.p>

          {/* Features below title */}
          <motion.div
            className="gap-3 pt-4 content-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-primary text-sm font-medium mt-4"
              whileHover={{ scale: 1.05 }}
            >
              <ChartNetwork className="w-4 h-4" />
              Displacement–Time Monitoring
            </motion.div>

            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-primary text-sm font-medium mt-4"
              whileHover={{ scale: 1.05 }}
            >

              <ChartArea className="w-4 h-4" />
              FFT-Based Frequency Diagnostics
            </motion.div>

            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-primary text-sm font-medium mt-4"
              whileHover={{ scale: 1.05 }}
            >
              <ToolCase className="w-4 h-4" />
              Predictive Maintenance
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}










