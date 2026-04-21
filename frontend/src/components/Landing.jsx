import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import LiveCounter from "./LiveCounter.jsx";
import { Reveal, Stagger, StaggerItem } from "./motion.jsx";

export default function Landing({ onLaunch }) {
  return (
    <div className="bg-ink-50 text-ink-900 font-sans">
      <ScrollProgress />
      <Nav onLaunch={onLaunch} />
      <Hero onLaunch={onLaunch} />
      <StatBand />
      <ThreeSteps />
      <Rotator />
      <Benefits />
      <FinalCTA onLaunch={onLaunch} />
      <Footer />
    </div>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 20,
    mass: 0.3,
  });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-lime-400 origin-left z-40"
      style={{ scaleX }}
    />
  );
}

function Nav({ onLaunch }) {
  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-4 z-30 px-4"
    >
      <nav className="mx-auto max-w-6xl bg-white/85 backdrop-blur rounded-full shadow-[0_6px_24px_rgba(10,15,12,0.08)] border border-ink-100 flex items-center justify-between pl-6 pr-2 py-2">
        <a href="#top" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-extrabold tracking-tight text-lg">
            SeamPay
          </span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-900/80">
          <a href="#how" className="hover:text-ink-900">How it works</a>
          <a href="#why" className="hover:text-ink-900">Why USDT0</a>
          <a
            href="https://github.com/ayu-ch/seampay"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink-900"
          >
            GitHub
          </a>
        </div>
        <button
          onClick={onLaunch}
          className="bg-ink-900 text-white rounded-full px-5 py-2.5 font-semibold text-sm hover:bg-ink-950 transition"
        >
          Launch app →
        </button>
      </nav>
    </motion.div>
  );
}

function LogoMark() {
  return (
    <div className="w-8 h-8 rounded-lg bg-ink-900 grid place-items-center">
      <div className="w-2.5 h-2.5 rounded-full bg-lime-400 pulse-dot" />
    </div>
  );
}

function Hero({ onLaunch }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 180]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.82]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  return (
    <section
      id="top"
      ref={ref}
      className="hero-gradient relative overflow-hidden pt-20 pb-28"
    >
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="mx-auto max-w-6xl px-6 text-center"
      >
        <Reveal delay={0.1} y={20}>
          <Pill>The payroll rail for Conflux eSpace</Pill>
        </Reveal>
        <Reveal delay={0.2} y={40} duration={1}>
          <h1 className="display text-[clamp(56px,10vw,168px)] mt-8">
            Paid <span className="text-lime-500">every</span> second.
          </h1>
        </Reveal>
        <Reveal delay={0.35} y={24}>
          <p className="mt-8 max-w-xl mx-auto text-ink-900/70 text-lg leading-relaxed">
            SeamPay streams USDT0 salaries by the second on Conflux
            eSpace. No payday. No SWIFT. Workers withdraw what they've earned,
            whenever they want.
          </p>
        </Reveal>
        <Reveal delay={0.5} y={16}>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={onLaunch}
              className="bg-ink-900 text-white rounded-full px-7 py-4 font-semibold hover:bg-ink-950 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start streaming <span className="text-lime-400">→</span>
            </button>
            <a
              href="#how"
              className="text-ink-900 underline underline-offset-4 font-medium"
            >
              See how it works
            </a>
          </div>
        </Reveal>
      </motion.div>

      <motion.div
        style={{ y: orbY, scale: orbScale }}
        className="relative mt-16 flex items-center justify-center"
      >
        <div className="glass-orb" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.25em] text-white/80 mb-3 font-semibold">
              Live demo worker
            </div>
            <div className="text-white display text-5xl md:text-6xl">
              <LiveCounter
                start={12.473821}
                ratePerSecond={0.000165}
                decimals={6}
              />
              <span className="text-white/70 text-2xl ml-3">USDT0</span>
            </div>
            <div className="mt-3 text-xs text-white/70 font-mono">
              accruing at 165 wei / second
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Pill({ children }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white border border-ink-100 rounded-full px-4 py-1.5 text-sm font-medium text-ink-900/80 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-lime-400 pulse-dot" />
      {children}
    </div>
  );
}

function StatBand() {
  return (
    <section className="py-28 bg-ink-50">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal y={16}>
          <div className="inline-block bg-ink-100 rounded-full px-4 py-1 text-sm font-semibold mb-8">
            Built for
          </div>
        </Reveal>
        <Reveal y={40} duration={1}>
          <h2 className="display text-[clamp(44px,8vw,128px)]">
            $<LiveCounter start={2_184_593} ratePerSecond={4.2} decimals={0} />
          </h2>
        </Reveal>
        <Reveal delay={0.15} y={20}>
          <p className="mt-6 text-2xl md:text-3xl font-medium text-ink-900/80">
            in stablecoin payroll{" "}
            <span className="bg-forest-900 text-lime-400 rounded-xl px-3 py-1">
              streamed to remote workers
            </span>
          </p>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="mt-20">
            <p className="text-xs font-semibold tracking-[0.25em] text-ink-900/50 uppercase">
              Powered by
            </p>
            <Stagger
              className="mt-8 flex items-center justify-center gap-12 flex-wrap opacity-80"
              gap={0.08}
            >
              {["Conflux eSpace", "USDT0", "LayerZero", "Tether"].map((b) => (
                <StaggerItem key={b}>
                  <BrandMark label={b} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BrandMark({ label }) {
  return (
    <div className="text-xl md:text-2xl font-bold tracking-tight text-ink-900/70">
      {label}
    </div>
  );
}

function ThreeSteps() {
  const items = [
    {
      n: "01",
      title: "Employer deposits USDT0",
      body:
        "Fund the vault once. See your full payroll runway in days at the current burn rate — every worker, every stream, on one screen.",
    },
    {
      n: "02",
      title: "Set a per-second rate",
      body:
        "One call sets the worker's salary in wei per second. No batch payroll, no cutoff dates, no wire instructions — the stream runs until you stop it.",
    },
    {
      n: "03",
      title: "Worker withdraws anytime",
      body:
        "The worker's balance ticks up on-chain every 3 seconds. They can pull what they've earned on day 1, day 7, or let it accrue. Their choice.",
    },
  ];

  return (
    <section id="how" className="forest-gradient text-ink-50 py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal y={20}>
          <p className="text-sm uppercase tracking-[0.3em] text-lime-400 font-semibold">
            You scroll, we stream
          </p>
        </Reveal>
        <Reveal y={40} duration={1} delay={0.1}>
          <h2 className="display text-6xl md:text-8xl mt-6 text-white">
            What is <span className="text-lime-400">SeamPay</span>
          </h2>
        </Reveal>
        <Reveal y={20} delay={0.25}>
          <p className="mt-8 max-w-2xl text-white/70 text-lg">
            A single smart contract on Conflux eSpace that turns any USDT0
            balance into a per-second payroll stream. No factory, no proxy, no
            upgradeability — just the primitive.  SeamPay makes global payroll
            seamless.
          </p>
        </Reveal>

        <div className="mt-24 space-y-32">
          {items.map((it, i) => (
            <Step key={it.n} {...it} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, body, reverse }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.2"],
  });
  const visualY = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 50, reduce ? 0 : -50]);
  const visualRotate = useTransform(
    scrollYProgress,
    [0, 1],
    reverse ? [2, -2] : [-2, 2]
  );

  return (
    <div
      ref={ref}
      className={
        "grid md:grid-cols-2 gap-10 items-center " +
        (reverse ? "md:[&>*:first-child]:order-2" : "")
      }
    >
      <Reveal y={30} amount={0.4}>
        <div>
          <div className="text-sm font-mono text-lime-400/80">
            {n} ——— 03
          </div>
          <h3 className="display text-4xl md:text-5xl mt-4 text-white">
            {title}
          </h3>
          <p className="mt-6 text-white/70 text-lg leading-relaxed max-w-md">
            {body}
          </p>
        </div>
      </Reveal>
      <motion.div
        style={{ y: visualY, rotate: visualRotate }}
        className="flex justify-center"
      >
        <StepVisual n={n} />
      </motion.div>
    </div>
  );
}

function StepVisual({ n }) {
  if (n === "01") {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="w-72 h-72 rounded-3xl bg-gradient-to-br from-forest-900 to-ink-950 border border-lime-400/20 p-8 flex flex-col justify-between"
      >
        <div className="text-xs text-lime-400 font-mono">VAULT BALANCE</div>
        <div className="display text-4xl text-white">
          <LiveCounter start={48250.12} ratePerSecond={-0.0423} decimals={2} />
        </div>
        <div className="text-xs text-white/60">
          Runway: 14.2 days · 6 active streams
        </div>
      </motion.div>
    );
  }
  if (n === "02") {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="w-72 h-72 rounded-3xl bg-gradient-to-br from-lime-400 to-lime-600 p-8 flex flex-col justify-between text-ink-900"
      >
        <div className="text-xs font-mono uppercase">
          setStream(worker, rate)
        </div>
        <div>
          <div className="display text-3xl">165 wei/s</div>
          <div className="text-sm font-medium opacity-80">
            ≈ 14.26 USDT0/day
          </div>
        </div>
        <div className="text-xs font-mono">0x7a…c2bE</div>
      </motion.div>
    );
  }
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
      className="w-72 h-72 rounded-3xl bg-white text-ink-900 p-8 flex flex-col justify-between shadow-xl"
    >
      <div className="text-xs font-mono text-ink-900/60">YOU'VE EARNED</div>
      <div className="display text-4xl">
        <LiveCounter start={3.284915} ratePerSecond={0.000165} decimals={6} />
      </div>
      <button className="bg-ink-900 text-white rounded-full py-2 font-semibold text-sm">
        Withdraw →
      </button>
    </motion.div>
  );
}

function Rotator() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [1, 1, 1] : [0.88, 1, 1.05]);

  return (
    <section ref={ref} className="bg-ink-50 py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal y={20}>
          <p className="text-ink-900/70 text-xl md:text-2xl font-medium max-w-2xl mx-auto">
            With SeamPay, working onchain becomes{" "}
            <span className="italic">a completely novel experience.</span>
          </p>
        </Reveal>

        <motion.div
          style={{ scale }}
          className="mt-16 display text-[clamp(72px,13vw,220px)]"
        >
          <div className="text-ink-900">
            <RotatorWords />
          </div>
          <div className="text-lime-500 leading-[0.85]">every second</div>
        </motion.div>
      </div>
    </section>
  );
}

function RotatorWords() {
  return (
    <span className="rotator h-[1em] align-bottom" style={{ height: "1em" }}>
      <span>Paid</span>
      <span>Earned</span>
      <span>Remitted</span>
      <span>Paid</span>
    </span>
  );
}

function Benefits() {
  return (
    <section id="why" className="bg-ink-50 py-32">
      <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-[auto_1fr] gap-10">
        <Reveal y={20}>
          <div className="inline-block bg-ink-100 rounded-full px-4 py-1 text-sm font-semibold">
            Why USDT0
          </div>
        </Reveal>
        <Reveal y={40} duration={1}>
          <p className="display text-3xl md:text-5xl leading-[1.05] text-ink-900">
            <mark className="bg-forest-900 text-lime-400 px-3 rounded-lg">
              SeamPay replaces
            </mark>{" "}
            the 3–5% fees and multi-day waits of SWIFT payroll with a
            transparent USDT0 stream that settles in 3 seconds on Conflux
            eSpace. For the first time, cross-border remote workers get paid
            the moment their work happens.
          </p>
        </Reveal>
      </div>

      <Stagger
        className="mt-28 mx-auto max-w-6xl px-6 grid md:grid-cols-3 gap-6"
        gap={0.12}
      >
        <StaggerItem>
          <Feature
            title="Per-second accrual"
            body="Workers see their USDT0 balance tick up in real time — no batched pay runs, no end-of-month wait."
          />
        </StaggerItem>
        <StaggerItem>
          <Feature
            title="Omnichain dollar"
            body="USDT0 is backed 1:1 by USDT on Ethereum, bridged via LayerZero OFT. The most credible USD asset on Conflux."
          />
        </StaggerItem>
        <StaggerItem>
          <Feature
            title="3-second finality"
            body="Conflux eSpace finalizes in ~3s at fees fractions of a cent. Viable for sub-dollar weekly settlements."
          />
        </StaggerItem>
      </Stagger>
    </section>
  );
}

function Feature({ title, body }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="bg-white rounded-3xl border border-ink-100 p-8 h-full"
    >
      <div className="w-10 h-10 rounded-xl bg-lime-400 grid place-items-center mb-6">
        <div className="w-2.5 h-2.5 rounded-full bg-ink-900" />
      </div>
      <h4 className="font-bold text-xl tracking-tight">{title}</h4>
      <p className="mt-3 text-ink-900/70 leading-relaxed">{body}</p>
    </motion.div>
  );
}

function FinalCTA({ onLaunch }) {
  return (
    <section className="forest-gradient text-white py-28">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal y={40} duration={1}>
          <h2 className="display text-5xl md:text-7xl text-white">
            Open the vault.
            <br />
            <span className="text-lime-400">Start streaming.</span>
          </h2>
        </Reveal>
        <Reveal y={20} delay={0.2}>
          <p className="mt-8 text-white/70 text-lg max-w-xl mx-auto">
            Connect MetaMask on Conflux eSpace, deposit USDT0, and pay your
            first worker by the second — live on-chain with SeamPay.
          </p>
        </Reveal>
        <Reveal y={16} delay={0.35}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLaunch}
            className="mt-10 bg-lime-400 text-ink-900 rounded-full px-8 py-4 font-bold hover:bg-lime-300 transition"
          >
            Launch app →
          </motion.button>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-ink-50 border-t border-ink-100">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-900/60">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-bold text-ink-900">SeamPay</span>
          <span>· Conflux eSpace</span>
        </div>
        <div className="flex gap-6 font-medium">
          <a
            href="https://doc.confluxnetwork.org/"
            target="_blank"
            rel="noreferrer"
          >
            Conflux docs
          </a>
          <a
            href="https://evm.confluxscan.io"
            target="_blank"
            rel="noreferrer"
          >
            ConfluxScan
          </a>
          <a
            href="https://efaucet.confluxnetwork.org/"
            target="_blank"
            rel="noreferrer"
          >
            Faucet
          </a>
        </div>
      </div>
    </footer>
  );
}
