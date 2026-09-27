'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView as fmUseInView } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Check, Compass, Sparkles } from 'lucide-react';
import {
  ease,
  duration,
  stagger as staggerTokens,
  fadeUp,
  blurIn,
  slideRight,
  staggerContainer,
  useReducedMotion,
  useIsMobile,
  useCountUp,
} from '@/lib/motion';

/* ─── Shared animation config ─────────────────── */
const sectionTransition = {
  duration: duration.slow,
  ease: ease.outCubic,
};

const headingVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

const eyebrowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

/* ─── Sub-components ──────────────────────────── */

function AnimatedWord({ word, index }: { word: string; index: number }) {
  return (
    <motion.span
      className="inline-block"
      variants={{
        hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
      }}
      transition={{
        duration: duration.slow,
        delay: index * staggerTokens.dramatic,
        ease: ease.outExpo,
      }}
    >
      {word}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function EdurahExperience({ courseCount, quizCount }: { courseCount: number; quizCount: number }) {
  const containerRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  /* Scroll-linked progress for the entire experience */
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  /* Parallax transforms derived from scroll */
  const backdropScale = useTransform(scrollYProgress, [0, 0.15], [1.04, 1.0]);
  const orbitalRotation = useTransform(scrollYProgress, [0, 1], [-18, 5]);
  const orbitalRotation2 = useTransform(scrollYProgress, [0, 1], [42, 4]);
  const productPerspective = useTransform(scrollYProgress, [0.3, 0.55], [1, -1]);

  /* Section refs for in-view triggers */
  const openingRef = useRef<HTMLElement>(null);
  const shiftRef = useRef<HTMLElement>(null);
  const arrivalRef = useRef<HTMLElement>(null);
  const productRef = useRef<HTMLElement>(null);
  const capabilityRef = useRef<HTMLElement>(null);
  const proofRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);

  const openingInView = fmUseInView(openingRef, { once: true, amount: 0.3 });
  const shiftInView = fmUseInView(shiftRef, { once: true, amount: 0.25 });
  const arrivalInView = fmUseInView(arrivalRef, { once: true, amount: 0.25 });
  const productInView = fmUseInView(productRef, { once: true, amount: 0.2 });
  const capabilityInView = fmUseInView(capabilityRef, { once: true, amount: 0.15 });
  const proofInView = fmUseInView(proofRef, { once: true, amount: 0.25 });
  const finalInView = fmUseInView(finalRef, { once: true, amount: 0.3 });

  /* Count up for proof data */
  const animatedCourseCount = useCountUp(courseCount, proofInView);
  const animatedQuizCount = useCountUp(quizCount, proofInView);

  const shouldAnimate = !reducedMotion;

  return (
    <main ref={containerRef} className="edurah-experience" aria-label="EDURAH learning experience">
      <div className="experience-grain" aria-hidden="true" />

      {/* ════════════════════════════════════════
          OPENING SCENE
          ════════════════════════════════════════ */}
      <section className="opening-scene" ref={openingRef}>
        <motion.div
          className="opening-backdrop"
          aria-hidden="true"
          style={shouldAnimate && !isMobile ? { scale: backdropScale } : undefined}
        />
        <motion.div
          className="orbital orbital-one"
          aria-hidden="true"
          style={shouldAnimate && !isMobile ? { rotateZ: orbitalRotation } : undefined}
        />
        <motion.div
          className="orbital orbital-two"
          aria-hidden="true"
          style={shouldAnimate && !isMobile ? { rotateZ: orbitalRotation2 } : undefined}
        />
        <div className="opening-grid" aria-hidden="true" />

        <motion.div
          className="opening-content"
          initial={shouldAnimate ? 'hidden' : undefined}
          animate={openingInView ? 'visible' : 'hidden'}
          variants={staggerContainer(staggerTokens.dramatic)}
        >
          <motion.p className="eyebrow" variants={eyebrowVariants} transition={sectionTransition}>
            <span /> A different place to learn
          </motion.p>

          <motion.h1 variants={staggerContainer(0.08)} initial="hidden" animate={openingInView ? 'visible' : 'hidden'}>
            <AnimatedWord word="Make" index={0} />{' '}
            <AnimatedWord word="room" index={1} />
            <br />
            <motion.em
              variants={{
                hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
              }}
              transition={{
                duration: duration.cinematic,
                delay: 0.35,
                ease: ease.outExpo,
              }}
              className="inline-block"
            >
              for wonder.
            </motion.em>
          </motion.h1>

          <motion.p className="opening-intro" variants={fadeUp} transition={{ ...sectionTransition, delay: 0.5 }}>
            EDURAH is a learning environment for the ideas that change how you see the world.
          </motion.p>

          <motion.div className="opening-actions" variants={fadeUp} transition={{ ...sectionTransition, delay: 0.6 }}>
            <Link href="/courses" className="primary-orbit-button">Begin exploring <ArrowUpRight size={16} /></Link>
            <a className="text-orbit-button" href="#the-shift">See the story <ArrowDownRight size={16} /></a>
          </motion.div>
        </motion.div>

        <motion.div
          className="opening-index"
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={openingInView ? { opacity: 1 } : undefined}
          transition={{ delay: 0.8, duration: duration.medium }}
        >
          <span>01</span><i /><span>08</span>
        </motion.div>

        <motion.div
          className="scroll-notation"
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={openingInView ? { opacity: 1 } : undefined}
          transition={{ delay: 1.0, duration: duration.medium }}
        >
          <span>Scroll to enter</span><i />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          SHIFT SCENE
          ════════════════════════════════════════ */}
      <section className="shift-scene" id="the-shift" ref={shiftRef}>
        <motion.div
          className="section-number"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shiftInView ? { opacity: 1, y: 0 } : undefined}
          transition={sectionTransition}
        >
          / 02
        </motion.div>

        <motion.div
          className="shift-statement"
          initial={shouldAnimate ? 'hidden' : undefined}
          animate={shiftInView ? 'visible' : 'hidden'}
          variants={staggerContainer(staggerTokens.normal)}
        >
          <motion.p className="eyebrow" variants={eyebrowVariants} transition={sectionTransition}>
            Education is changing shape
          </motion.p>
          <motion.h2 variants={headingVariants} transition={{ ...sectionTransition, duration: duration.cinematic }}>
            Not a library<br />of answers.
          </motion.h2>
          <motion.p variants={fadeUp} transition={sectionTransition}>
            Knowledge moves when it is connected, tested, and made your own.
          </motion.p>
        </motion.div>

        <motion.div
          className="signal-field"
          aria-hidden="true"
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shiftInView ? { opacity: 1 } : undefined}
          transition={{ delay: 0.3, duration: duration.slow }}
        >
          {['OBSERVE', 'QUESTION', 'CONNECT', 'RETURN'].map((label, i) => (
            <motion.span
              key={label}
              initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
              animate={shiftInView ? { opacity: 1, scale: 1 } : undefined}
              transition={{ delay: 0.4 + i * 0.12, duration: duration.medium, ease: ease.outCubic }}
            >
              {label}
            </motion.span>
          ))}
          <div className="signal-line" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          ARRIVAL SCENE
          ════════════════════════════════════════ */}
      <section className="arrival-scene" ref={arrivalRef}>
        <motion.div
          className="arrival-copy"
          initial={shouldAnimate ? 'hidden' : undefined}
          animate={arrivalInView ? 'visible' : 'hidden'}
          variants={staggerContainer(staggerTokens.normal)}
        >
          <motion.p className="eyebrow" variants={eyebrowVariants} transition={sectionTransition}>This is EDURAH</motion.p>
          <motion.h2 variants={headingVariants} transition={{ ...sectionTransition, duration: duration.cinematic }}>
            A clear path<br />through complexity.
          </motion.h2>
          <motion.p variants={fadeUp} transition={sectionTransition}>
            Focused courses, active recall, and a personal learning rhythm—designed as one continuous practice.
          </motion.p>
        </motion.div>

        <motion.div
          className="constellation"
          aria-label="EDURAH learning loop"
          initial={shouldAnimate ? { opacity: 0, scale: 0.85 } : undefined}
          animate={arrivalInView ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: duration.cinematic, ease: ease.outExpo }}
        >
          <motion.div
            className="constellation-core"
            initial={shouldAnimate ? { opacity: 0, scale: 0.6 } : undefined}
            animate={arrivalInView ? { opacity: 1, scale: 1 } : undefined}
            transition={{ delay: 0.3, ...ease.spring }}
          >
            <Sparkles size={22} /><span>EDURAH</span>
          </motion.div>
          {[
            { cls: 'node node-a', label: 'SEE' },
            { cls: 'node node-b', label: 'BUILD' },
            { cls: 'node node-c', label: 'TEST' },
            { cls: 'node node-d', label: 'GROW' },
          ].map((node, i) => (
            <motion.span
              key={node.label}
              className={node.cls}
              initial={shouldAnimate ? { opacity: 0, scale: 0.5 } : undefined}
              animate={arrivalInView ? { opacity: 1, scale: 1 } : undefined}
              transition={{ delay: 0.4 + i * 0.1, ...ease.gentleSpring }}
            >
              {node.label}
            </motion.span>
          ))}
          <i className="constellation-ring ring-one" />
          <i className="constellation-ring ring-two" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          PRODUCT SCENE
          ════════════════════════════════════════ */}
      <section className="product-scene" ref={productRef}>
        <motion.div
          className="product-caption"
          initial={shouldAnimate ? { opacity: 0, y: 15 } : undefined}
          animate={productInView ? { opacity: 1, y: 0 } : undefined}
          transition={sectionTransition}
        >
          <span>03 — IN MOTION</span><p>Your next idea is already waiting.</p>
        </motion.div>

        <motion.div
          className="product-frame"
          initial={shouldAnimate ? { opacity: 0, y: 40 } : undefined}
          animate={productInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: duration.cinematic, ease: ease.outExpo }}
          style={shouldAnimate && !isMobile ? {
            perspective: '1400px',
            rotateX: productPerspective,
          } : undefined}
        >
          <div className="frame-topline"><span className="frame-mark">E</span><span>Course space</span><span className="frame-state">In focus</span></div>
          <div className="lesson-surface">
            <motion.div
              className="lesson-code"
              aria-hidden="true"
              initial={shouldAnimate ? { opacity: 0 } : undefined}
              animate={productInView ? { opacity: 1 } : undefined}
              transition={{ delay: 0.4, duration: duration.medium }}
            >
              <span>01</span><b>function</b> understanding() {'{'}<br /><span>02</span>&nbsp;&nbsp;return <i>curiosity</i> + practice;<br /><span>03</span>{'}'}
            </motion.div>
            <div className="lesson-orb" aria-hidden="true"><i /><i /><i /></div>
            <motion.div
              className="lesson-meta"
              initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
              animate={productInView ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5, ...sectionTransition }}
            >
              <span>FOUNDATIONS / 01</span><strong>Patterns, not pages.</strong><small>14 min · Interactive lesson</small>
            </motion.div>
          </div>
          <div className="frame-bottom"><span>Progress 24%</span><div><i /></div><span>01 / 06</span></div>
        </motion.div>

        <motion.div
          className="product-footnote"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={productInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.6, ...sectionTransition }}
        >
          <Compass size={15} /> No passive watching. Follow the thread.
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          CAPABILITY SCENE
          ════════════════════════════════════════ */}
      <section className="capability-scene" ref={capabilityRef}>
        <motion.div
          className="capability-intro"
          initial={shouldAnimate ? 'hidden' : undefined}
          animate={capabilityInView ? 'visible' : 'hidden'}
          variants={staggerContainer(staggerTokens.normal)}
        >
          <motion.p className="eyebrow" variants={eyebrowVariants} transition={sectionTransition}>A living curriculum</motion.p>
          <motion.h2 variants={headingVariants} transition={{ ...sectionTransition, duration: duration.cinematic }}>
            Everything<br /><em>has a place.</em>
          </motion.h2>
        </motion.div>

        <div className="capability-list">
          {[
            ['01', 'Watch with intention', 'Short, deliberate lessons leave room for thought.'],
            ['02', 'Make the connection', 'Build mental models—not just a streak.'],
            ['03', 'Find the gap', 'Practice reveals what deserves another look.'],
            ['04', 'Keep moving', 'Progress bends around your pace, not the other way around.'],
          ].map(([number, title, text], i) => (
            <motion.article
              key={number}
              className="capability-item"
              initial={shouldAnimate ? { opacity: 0, x: 30 } : undefined}
              animate={capabilityInView ? { opacity: 1, x: 0 } : undefined}
              transition={{
                delay: 0.2 + i * staggerTokens.normal,
                duration: duration.medium,
                ease: ease.outCubic,
              }}
            >
              <span>{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
              <ArrowUpRight size={18} />
            </motion.article>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          PROOF SCENE
          ════════════════════════════════════════ */}
      <section className="proof-scene" ref={proofRef}>
        <motion.p
          className="eyebrow"
          initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
          animate={proofInView ? { opacity: 1, x: 0 } : undefined}
          transition={sectionTransition}
        >
          Made for the long view
        </motion.p>

        <div className="proof-words">
          {['Depth', 'Clarity', 'Momentum'].map((word, i) => (
            <motion.span
              key={word}
              initial={shouldAnimate ? { opacity: 0, y: 30, scale: 1.08 } : undefined}
              animate={proofInView ? { opacity: 1, y: 0, scale: 1 } : undefined}
              transition={{
                delay: 0.15 + i * staggerTokens.dramatic,
                duration: duration.cinematic,
                ease: ease.outExpo,
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        <motion.div
          className="proof-data"
          initial={shouldAnimate ? 'hidden' : undefined}
          animate={proofInView ? 'visible' : 'hidden'}
          variants={staggerContainer(staggerTokens.normal)}
        >
          <motion.div variants={fadeUp} transition={sectionTransition}>
            <strong>{shouldAnimate ? animatedCourseCount.toString().padStart(2, '0') : courseCount.toString().padStart(2, '0')}</strong>
            <span>structured courses</span>
          </motion.div>
          <motion.div variants={fadeUp} transition={sectionTransition}>
            <strong>{shouldAnimate ? animatedQuizCount.toString().padStart(2, '0') : quizCount.toString().padStart(2, '0')}</strong>
            <span>active practice sets</span>
          </motion.div>
          <motion.div variants={fadeUp} transition={sectionTransition}>
            <strong>∞</strong>
            <span>ways to connect the dots</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          FINAL SCENE
          ════════════════════════════════════════ */}
      <section className="final-scene" ref={finalRef}>
        <div className="final-moon" aria-hidden="true" />

        <motion.p
          className="eyebrow"
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={finalInView ? { opacity: 1 } : undefined}
          transition={{ delay: 0.1, duration: duration.medium }}
        >
          Your field of view is about to expand
        </motion.p>

        <motion.h2
          initial={shouldAnimate ? { opacity: 0, y: 40, filter: 'blur(8px)' } : undefined}
          animate={finalInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ delay: 0.2, duration: duration.cinematic, ease: ease.outExpo }}
        >
          Learn<br />beautifully.
        </motion.h2>

        <motion.p
          className="final-copy"
          initial={shouldAnimate ? { opacity: 0, y: 15 } : undefined}
          animate={finalInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.4, ...sectionTransition }}
        >
          The future belongs to people who never stop looking closer.
        </motion.p>

        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={finalInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.55, ...sectionTransition }}
        >
          <Link href="/subjects" className="final-cta">Find your starting point <ArrowUpRight size={18} /></Link>
        </motion.div>

        <motion.div
          className="final-footer"
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={finalInView ? { opacity: 1 } : undefined}
          transition={{ delay: 0.7, duration: duration.medium }}
        >
          <span>EDURAH / 2026</span><span>Made for curious minds</span><span><Check size={12} /> Learning, in focus</span>
        </motion.div>
      </section>
    </main>
  );
}
