"use client";

import { motion, useReducedMotion } from "framer-motion";

interface AnimatedHeroTitleProps {
  className?: string;
}

export function AnimatedHeroTitle({ className = "" }: AnimatedHeroTitleProps) {
  const shouldReduceMotion = useReducedMotion();

  const words = [
    { text: "Curated", isAccent: false },
    { text: "experiences", isAccent: false },
    { text: "for", isAccent: false },
    { text: "the", isAccent: false },
    { text: "modern", isAccent: true },
    { text: "church.", isAccent: false },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.09,
        delayChildren: shouldReduceMotion ? 0 : 0.12,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 32,
      filter: shouldReduceMotion ? "blur(0px)" : "blur(10px)",
      scale: shouldReduceMotion ? 1 : 0.96,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.75,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.h1
      aria-label="Curated experiences for the modern church."
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((item, idx) => {
        if (item.isAccent) {
          return (
            <motion.span
              key={idx}
              variants={wordVariants}
              className="inline-block relative mr-[0.26em] last:mr-0"
            >
              <span className="relative z-10 italic font-light text-brass-light px-1 inline-block drop-shadow-[0_0_24px_rgba(226,192,115,0.35)]">
                {item.text}
              </span>
              {/* Subtle ambient luxury aura behind 'modern' */}
              {!shouldReduceMotion && (
                <motion.span
                  className="absolute inset-0 bg-brass/20 blur-xl rounded-full -z-10 pointer-events-none"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1.15 }}
                  transition={{ delay: 0.55, duration: 1.2, ease: "easeOut" }}
                />
              )}
            </motion.span>
          );
        }

        return (
          <motion.span
            key={idx}
            variants={wordVariants}
            className="inline-block mr-[0.26em] last:mr-0"
          >
            {item.text}
          </motion.span>
        );
      })}
    </motion.h1>
  );
}
