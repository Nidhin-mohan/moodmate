import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Wind,
  Box,
  Eye,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Heart,
  Brain,
  Leaf,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ToolsGroup } from "@/lib/moods";
import { TOOLS_GROUPS } from "@/lib/supportResources";
import { HelplineCard } from "@/components/support/Support";

/** One calm brand gradient for every exercise (text on it uses primary-foreground). */
const BRAND_GRADIENT = "from-primary to-[hsl(var(--primary)/0.8)]";

/** Grouped by how you feel, not by technique name. */
const GROUP_ORDER: ToolsGroup[] = ["calm", "scattered", "kind"];

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type ToolId =
  | "physiological-sigh"
  | "box-breathing"
  | "grounding-54321"
  | "body-scan"
  | "mindful-moment"
  | "self-compassion";

interface Tool {
  id: ToolId;
  name: string;
  subtitle: string;
  description: string;
  duration: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  bgAccent: string;
  group: ToolsGroup;
}

const tools: Tool[] = [
  {
    id: "physiological-sigh",
    name: "Physiological Sigh",
    subtitle: "Instant calm",
    description:
      "A double inhale followed by a long exhale — the fastest known way to reduce stress in real time. Discovered by neuroscience research at Stanford.",
    duration: "1 min",
    icon: Wind,
    gradient: BRAND_GRADIENT,
    iconColor: "text-accent-foreground",
    bgAccent: "bg-accent",
    group: "calm",
  },
  {
    id: "box-breathing",
    name: "Box Breathing",
    subtitle: "Focus & calm",
    description:
      "Breathe in a 4-4-4-4 pattern used by Navy SEALs and first responders to stay calm under pressure. Balances your nervous system in minutes.",
    duration: "2 min",
    icon: Box,
    gradient: BRAND_GRADIENT,
    iconColor: "text-accent-foreground",
    bgAccent: "bg-accent",
    group: "calm",
  },
  {
    id: "grounding-54321",
    name: "5-4-3-2-1 Grounding",
    subtitle: "Anchor to now",
    description:
      "Engage all five senses to pull yourself out of anxious thoughts and back into the present moment. Simple, powerful, works anywhere.",
    duration: "2 min",
    icon: Eye,
    gradient: BRAND_GRADIENT,
    iconColor: "text-accent-foreground",
    bgAccent: "bg-accent",
    group: "scattered",
  },
  {
    id: "body-scan",
    name: "Quick Body Scan",
    subtitle: "Release tension",
    description:
      "Systematically notice and release tension from head to toe. A fast way to reconnect with your body and let go of physical stress.",
    duration: "3 min",
    icon: Heart,
    gradient: BRAND_GRADIENT,
    iconColor: "text-accent-foreground",
    bgAccent: "bg-accent",
    group: "kind",
  },
  {
    id: "mindful-moment",
    name: "Mindful Moment",
    subtitle: "Pause & notice",
    description:
      "A brief guided pause to observe your thoughts without judgment. Like pressing a gentle reset button for your mind.",
    duration: "1 min",
    icon: Leaf,
    gradient: BRAND_GRADIENT,
    iconColor: "text-accent-foreground",
    bgAccent: "bg-accent",
    group: "scattered",
  },
  {
    id: "self-compassion",
    name: "Self-Compassion Break",
    subtitle: "Be kind to you",
    description:
      "Three simple steps from Dr. Kristin Neff's research: acknowledge difficulty, remember shared humanity, and offer yourself kindness.",
    duration: "2 min",
    icon: Brain,
    gradient: BRAND_GRADIENT,
    iconColor: "text-accent-foreground",
    bgAccent: "bg-accent",
    group: "kind",
  },
];

/* ────────────────────────────────────────────
   Breathing Circle Component
   ──────────────────────────────────────────── */

interface BreathingCircleProps {
  phase: string;
  progress: number;
  gradient: string;
  isPaused: boolean;
}

const BreathingCircle: React.FC<BreathingCircleProps> = ({
  phase,
  progress,
  gradient,
  isPaused,
}) => {
  const scale =
    phase === "Inhale" || phase === "Double Inhale"
      ? 0.6 + 0.4 * progress
      : phase === "Exhale"
        ? 1.0 - 0.4 * progress
        : 1.0;

  return (
    <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
      <div
        className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-10", gradient)}
        style={{ transform: `scale(${scale * 1.15})`, transition: isPaused ? "none" : "transform 0.3s ease-out" }}
      />
      <div
        className={cn("absolute inset-4 rounded-full bg-gradient-to-br opacity-20", gradient)}
        style={{ transform: `scale(${scale * 1.08})`, transition: isPaused ? "none" : "transform 0.3s ease-out" }}
      />
      <div
        className={cn("absolute inset-8 rounded-full bg-gradient-to-br shadow-2xl flex items-center justify-center", gradient)}
        style={{ transform: `scale(${scale})`, transition: isPaused ? "none" : "transform 0.3s ease-out" }}
      >
        <span className="text-primary-foreground text-xl sm:text-2xl font-semibold tracking-wide select-none">
          {phase}
        </span>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────
   Physiological Sigh Exercise
   ──────────────────────────────────────────── */

const SIGH_PHASES = [
  { name: "Double Inhale", duration: 3500 },
  { name: "Exhale", duration: 6500 },
] as const;
const SIGH_CYCLES = 6;

const PhysiologicalSighExercise: React.FC<{
  onComplete: () => void;
  onBack: () => void;
  gradient: string;
}> = ({ onComplete, onBack: _onBack, gradient }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentPhase = SIGH_PHASES[phaseIdx];

  const tick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / currentPhase.duration, 1);
    setPhaseProgress(progress);

    if (progress >= 1) {
      const nextPhaseIdx = (phaseIdx + 1) % SIGH_PHASES.length;
      const nextCycle = nextPhaseIdx === 0 ? cycle + 1 : cycle;

      if (nextCycle >= SIGH_CYCLES) {
        setCompleted(true);
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setPhaseIdx(nextPhaseIdx);
      setCycle(nextCycle);
      setPhaseProgress(0);
      startTimeRef.current = Date.now();
    }
  }, [phaseIdx, cycle, currentPhase.duration]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(tick, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const start = () => { setHasStarted(true); setIsRunning(true); };
  const togglePause = () => setIsRunning((r) => !r);
  const reset = () => {
    setIsRunning(false); setHasStarted(false); setCycle(0);
    setPhaseIdx(0); setPhaseProgress(0); setCompleted(false);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-8 animate-in fade-in duration-500">
        <div className={cn("w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg", gradient)}>
          <Sparkles className="text-primary-foreground" size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">Well done</h3>
          <p className="text-muted-foreground max-w-xs">
            You completed 6 cycles of physiological sighing. Notice how your body feels now.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw size={16} /> Again
          </Button>
          <Button onClick={onComplete} className={cn("bg-gradient-to-r text-primary-foreground border-0", gradient)}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-xl font-semibold text-foreground">How it works</h3>
          <div className="space-y-3 text-left">
            {[
              { n: 1, text: <><strong>Double inhale</strong> through your nose — one deep breath in, then a quick second sip of air on top</> },
              { n: 2, text: <><strong>Long exhale</strong> slowly through your mouth — let it be twice as long as the inhale</> },
              { n: 3, text: <><strong>Repeat 6 times</strong> — about one minute total</> },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                  {n}
                </span>
                <p className="text-foreground text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={start} size="lg" className={cn("bg-gradient-to-r text-primary-foreground border-0 gap-2 px-8 shadow-lg hover:shadow-xl transition-shadow", gradient)}>
          <Play size={18} /> Begin
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in duration-300">
      <BreathingCircle phase={currentPhase.name} progress={phaseProgress} gradient={gradient} isPaused={!isRunning} />
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground font-medium">
          Cycle {cycle + 1} of {SIGH_CYCLES}
        </p>
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-300", gradient)}
            style={{ width: `${((cycle * SIGH_PHASES.length + phaseIdx + phaseProgress) / (SIGH_CYCLES * SIGH_PHASES.length)) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={reset} className="gap-2"><RotateCcw size={14} /> Reset</Button>
        <Button variant="outline" size="sm" onClick={togglePause} className="gap-2">
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? "Pause" : "Resume"}
        </Button>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────
   Box Breathing Exercise
   ──────────────────────────────────────────── */

const BOX_PHASES = [
  { name: "Inhale", duration: 4000 },
  { name: "Hold", duration: 4000 },
  { name: "Exhale", duration: 4000 },
  { name: "Hold", duration: 4000 },
] as const;
const BOX_CYCLES = 8;

const BoxBreathingExercise: React.FC<{
  onComplete: () => void;
  onBack: () => void;
  gradient: string;
}> = ({ onComplete, onBack: _onBack, gradient }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [countdown, setCountdown] = useState(4);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentPhase = BOX_PHASES[phaseIdx];

  const tick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / currentPhase.duration, 1);
    setPhaseProgress(progress);
    setCountdown(Math.ceil((1 - progress) * 4) || 1);

    if (progress >= 1) {
      const nextPhaseIdx = (phaseIdx + 1) % BOX_PHASES.length;
      const nextCycle = nextPhaseIdx === 0 ? cycle + 1 : cycle;

      if (nextCycle >= BOX_CYCLES) {
        setCompleted(true);
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setPhaseIdx(nextPhaseIdx);
      setCycle(nextCycle);
      setPhaseProgress(0);
      setCountdown(4);
      startTimeRef.current = Date.now();
    }
  }, [phaseIdx, cycle, currentPhase.duration]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(tick, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  const start = () => { setHasStarted(true); setIsRunning(true); };
  const togglePause = () => setIsRunning((r) => !r);
  const reset = () => {
    setIsRunning(false); setHasStarted(false); setCycle(0);
    setPhaseIdx(0); setPhaseProgress(0); setCountdown(4); setCompleted(false);
  };

  const boxSide = phaseIdx;

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-8 animate-in fade-in duration-500">
        <div className={cn("w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg", gradient)}>
          <Sparkles className="text-primary-foreground" size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">Great work</h3>
          <p className="text-muted-foreground max-w-xs">
            You completed {BOX_CYCLES} cycles of box breathing. Your nervous system is more balanced now.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw size={16} /> Again</Button>
          <Button onClick={onComplete} className={cn("bg-gradient-to-r text-primary-foreground border-0", gradient)}>Done</Button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-xl font-semibold text-foreground">How it works</h3>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {["Inhale 4s", "Hold 4s", "Exhale 4s", "Hold 4s"].map((label, i) => (
              <div key={i} className="flex items-center justify-center gap-2 py-3 px-4 bg-accent rounded-xl text-accent-foreground text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-accent-foreground flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {label}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Repeat for {BOX_CYCLES} cycles (about 2 minutes)
          </p>
        </div>
        <Button onClick={start} size="lg" className={cn("bg-gradient-to-r text-primary-foreground border-0 gap-2 px-8 shadow-lg hover:shadow-xl transition-shadow", gradient)}>
          <Play size={18} /> Begin
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in duration-300">
      <div className="relative w-56 h-56 sm:w-64 sm:h-64">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect x="20" y="20" width="160" height="160" rx="16" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
          {[
            { x1: 20, y1: 20, x2: 180, y2: 20 },
            { x1: 180, y1: 20, x2: 180, y2: 180 },
            { x1: 180, y1: 180, x2: 20, y2: 180 },
            { x1: 20, y1: 180, x2: 20, y2: 20 },
          ].map((line, i) => {
            const isActive = boxSide === i;
            const isPast = i < boxSide || (i === 0 && boxSide === 0 && cycle > 0);
            return (
              <line
                key={i}
                x1={line.x1} y1={line.y1}
                x2={isActive ? line.x1 + (line.x2 - line.x1) * phaseProgress : isPast ? line.x2 : line.x1}
                y2={isActive ? line.y1 + (line.y2 - line.y1) * phaseProgress : isPast ? line.y2 : line.y1}
                stroke={isActive ? "url(#boxGrad)" : isPast ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))"}
                strokeWidth={isActive ? "6" : "4"}
                strokeLinecap="round"
              />
            );
          })}
          {(() => {
            const lines = [
              { x1: 20, y1: 20, x2: 180, y2: 20 },
              { x1: 180, y1: 20, x2: 180, y2: 180 },
              { x1: 180, y1: 180, x2: 20, y2: 180 },
              { x1: 20, y1: 180, x2: 20, y2: 20 },
            ];
            const l = lines[boxSide];
            const cx = l.x1 + (l.x2 - l.x1) * phaseProgress;
            const cy = l.y1 + (l.y2 - l.y1) * phaseProgress;
            return (
              <>
                <circle cx={cx} cy={cy} r="12" fill="url(#boxGrad)" opacity="0.3" />
                <circle cx={cx} cy={cy} r="7" fill="url(#boxGrad)" />
              </>
            );
          })()}
          <defs>
            <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-primary">{countdown}</span>
          <span className="text-sm font-medium text-muted-foreground mt-1">{currentPhase.name}</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground font-medium">Cycle {cycle + 1} of {BOX_CYCLES}</p>
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-300", gradient)}
            style={{ width: `${((cycle * BOX_PHASES.length + phaseIdx + phaseProgress) / (BOX_CYCLES * BOX_PHASES.length)) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={reset} className="gap-2"><RotateCcw size={14} /> Reset</Button>
        <Button variant="outline" size="sm" onClick={togglePause} className="gap-2">
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? "Pause" : "Resume"}
        </Button>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────
   5-4-3-2-1 Grounding Exercise
   ──────────────────────────────────────────── */

const GROUNDING_STEPS = [
  { count: 5, sense: "See", instruction: "Look around and name 5 things you can see", examples: "A window, a pen, your hands, a shadow, a color on the wall...", emoji: "👁", color: "emerald" },
  { count: 4, sense: "Touch", instruction: "Notice 4 things you can physically feel", examples: "Your feet on the floor, fabric on your skin, air on your face, the chair beneath you...", emoji: "✋", color: "teal" },
  { count: 3, sense: "Hear", instruction: "Listen for 3 sounds around you", examples: "Traffic, a fan humming, birds, your own breathing...", emoji: "👂", color: "cyan" },
  { count: 2, sense: "Smell", instruction: "Notice 2 things you can smell", examples: "Coffee, soap, fresh air, your clothing...", emoji: "👃", color: "sky" },
  { count: 1, sense: "Taste", instruction: "Notice 1 thing you can taste", examples: "Toothpaste, coffee, the inside of your mouth...", emoji: "👅", color: "indigo" },
];

const GroundingExercise: React.FC<{
  onComplete: () => void;
  onBack: () => void;
  gradient: string;
}> = ({ onComplete, gradient }) => {
  const [step, setStep] = useState(-1);
  const [completed, setCompleted] = useState(false);

  const current = GROUNDING_STEPS[step];

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-8 animate-in fade-in duration-500">
        <div className={cn("w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg", gradient)}>
          <Sparkles className="text-primary-foreground" size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">You're grounded</h3>
          <p className="text-muted-foreground max-w-xs">
            You've reconnected with the present moment through all five senses. Notice the calm.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setStep(-1); setCompleted(false); }} className="gap-2">
            <RotateCcw size={16} /> Again
          </Button>
          <Button onClick={onComplete} className={cn("bg-gradient-to-r text-primary-foreground border-0", gradient)}>Done</Button>
        </div>
      </div>
    );
  }

  if (step === -1) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-xl font-semibold text-foreground">How it works</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You'll engage each of your five senses, one at a time, to anchor yourself
            in the present moment. Take your time with each step.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {GROUNDING_STEPS.map((s) => (
              <span key={s.count} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-soft text-soft-foreground rounded-full text-xs font-medium">
                <span>{s.emoji}</span> {s.count} {s.sense}
              </span>
            ))}
          </div>
        </div>
        <Button onClick={() => setStep(0)} size="lg" className={cn("bg-gradient-to-r text-primary-foreground border-0 gap-2 px-8 shadow-lg hover:shadow-xl transition-shadow", gradient)}>
          <Play size={18} /> Begin
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in slide-in-from-right-4 duration-300" key={step}>
      <div className="flex gap-2">
        {GROUNDING_STEPS.map((_, i) => (
          <div key={i} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", i < step ? "bg-primary/50" : i === step ? "bg-primary w-8" : "bg-border")} />
        ))}
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-hero rounded-2xl p-8 text-center space-y-5 border border-border">
          <span className="text-5xl">{current.emoji}</span>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-card/80 rounded-full text-foreground text-xs font-bold tracking-wider uppercase">
              {current.count} things you can {current.sense.toLowerCase()}
            </div>
            <p className="text-foreground font-medium text-lg">{current.instruction}</p>
            <p className="text-muted-foreground text-sm italic">{current.examples}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>Back</Button>
        )}
        <Button
          onClick={() => { if (step < GROUNDING_STEPS.length - 1) { setStep(step + 1); } else { setCompleted(true); } }}
          size="sm"
          className={cn("bg-gradient-to-r text-primary-foreground border-0 gap-1", gradient)}
        >
          {step < GROUNDING_STEPS.length - 1 ? "Next" : "Finish"} <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────
   Guided Steps Exercise (Body Scan, Mindful Moment, Self-Compassion)
   ──────────────────────────────────────────── */

interface GuidedStep {
  title: string;
  instruction: string;
  duration: number;
}

const BODY_SCAN_STEPS: GuidedStep[] = [
  { title: "Settle in", instruction: "Close your eyes or soften your gaze. Take three slow, deep breaths to settle into stillness.", duration: 15 },
  { title: "Head & face", instruction: "Bring attention to your forehead, eyes, jaw. Notice any tension. Imagine it softening like warm butter melting.", duration: 20 },
  { title: "Neck & shoulders", instruction: "Notice your neck and shoulders — where most of us hold stress. Let them drop an inch. Release.", duration: 20 },
  { title: "Arms & hands", instruction: "Feel the weight of your arms, the temperature of your hands. Let them be completely heavy and still.", duration: 20 },
  { title: "Chest & belly", instruction: "Notice the rise and fall of your breath. Don't change it — just witness it. Feel your belly soften.", duration: 25 },
  { title: "Legs & feet", instruction: "Feel the contact of your legs against the chair, your feet on the ground. You are supported. You are here.", duration: 20 },
  { title: "Whole body", instruction: "Expand awareness to your whole body at once. Breathe in calm, breathe out tension. You are safe.", duration: 20 },
];

const MINDFUL_MOMENT_STEPS: GuidedStep[] = [
  { title: "Pause", instruction: "Stop what you're doing. Right now, in this exact moment, you have nowhere to be and nothing to fix. Just be here.", duration: 15 },
  { title: "Notice thoughts", instruction: "What's on your mind? Don't judge the thoughts — just watch them pass like clouds in the sky. You are not your thoughts.", duration: 20 },
  { title: "Notice feelings", instruction: "What emotion is present right now? Name it gently. 'I notice I'm feeling...' There's no wrong answer.", duration: 20 },
  { title: "Return to breath", instruction: "Take three slow, deliberate breaths. Feel the air enter and leave. This moment is enough. You are enough.", duration: 15 },
];

const SELF_COMPASSION_STEPS: GuidedStep[] = [
  { title: "Acknowledge", instruction: "Think of something that's been difficult for you lately. Place a hand on your heart and say: 'This is a moment of suffering. This is hard.'", duration: 20 },
  { title: "Common humanity", instruction: "Remind yourself: 'Suffering is a part of being human. I am not alone in this. Others feel this way too.' You are not broken — you are human.", duration: 25 },
  { title: "Kindness", instruction: "Ask yourself: 'What would I say to a close friend going through this?' Now say those exact words to yourself. You deserve the same kindness.", duration: 25 },
  { title: "Affirm", instruction: "Take a deep breath and repeat: 'May I be kind to myself. May I give myself the compassion I need.' Let the warmth settle in.", duration: 20 },
];

const STEP_DATA: Record<string, GuidedStep[]> = {
  "body-scan": BODY_SCAN_STEPS,
  "mindful-moment": MINDFUL_MOMENT_STEPS,
  "self-compassion": SELF_COMPASSION_STEPS,
};

const GuidedExercise: React.FC<{
  toolId: string;
  onComplete: () => void;
  onBack: () => void;
  gradient: string;
}> = ({ toolId, onComplete, gradient }) => {
  const steps = STEP_DATA[toolId] || [];
  const [stepIdx, setStepIdx] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[stepIdx];

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            if (stepIdx < steps.length - 1) {
              setStepIdx((s) => s + 1);
              return steps[stepIdx + 1].duration;
            } else {
              setIsRunning(false);
              setCompleted(true);
              return 0;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, stepIdx, steps, timeLeft]);

  const start = () => { setStepIdx(0); setTimeLeft(steps[0].duration); setIsRunning(true); };
  const reset = () => { setIsRunning(false); setStepIdx(-1); setTimeLeft(0); setCompleted(false); };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-8 animate-in fade-in duration-500">
        <div className={cn("w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg", gradient)}>
          <Sparkles className="text-primary-foreground" size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">Beautiful</h3>
          <p className="text-muted-foreground max-w-xs">
            Take a moment to notice how you feel now compared to when you started.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw size={16} /> Again</Button>
          <Button onClick={onComplete} className={cn("bg-gradient-to-r text-primary-foreground border-0", gradient)}>Done</Button>
        </div>
      </div>
    );
  }

  if (stepIdx === -1) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-xl font-semibold text-foreground">
            {steps.length} guided steps
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Each step will display for a set time, then gently transition to the next.
            Find a comfortable position and let yourself be guided.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Timer size={14} />
            About {Math.ceil(steps.reduce((a, s) => a + s.duration, 0) / 60)} min total
          </div>
        </div>
        <Button onClick={start} size="lg" className={cn("bg-gradient-to-r text-primary-foreground border-0 gap-2 px-8 shadow-lg hover:shadow-xl transition-shadow", gradient)}>
          <Play size={18} /> Begin
        </Button>
      </div>
    );
  }

  const progressPercent = ((stepIdx + (1 - timeLeft / currentStep.duration)) / steps.length) * 100;

  return (
    <div className="flex flex-col items-center gap-8 py-4 animate-in fade-in duration-300" key={stepIdx}>
      <div className="w-full max-w-sm">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-1000 ease-linear", gradient)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Step {stepIdx + 1} of {steps.length}</span>
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500" key={`card-${stepIdx}`}>
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border text-center space-y-4">
          <h4 className="text-lg font-bold text-foreground">{currentStep.title}</h4>
          <p className="text-foreground leading-relaxed text-sm">{currentStep.instruction}</p>
        </div>
      </div>

      <div className="relative w-16 h-16">
        <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
          <circle cx="30" cy="30" r="26" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="30" cy="30" r="26" fill="none" stroke="url(#timerGrad)" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 26}
            strokeDashoffset={2 * Math.PI * 26 * (1 - timeLeft / currentStep.duration)}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
          {timeLeft}
        </span>
      </div>

      <Button variant="outline" size="sm" onClick={reset} className="gap-2">
        <RotateCcw size={14} /> Reset
      </Button>
    </div>
  );
};

/* ────────────────────────────────────────────
   Tool Detail View (wrapper) — full-screen and distraction-free on phones
   ──────────────────────────────────────────── */

const ToolDetail: React.FC<{
  tool: Tool;
  onBack: () => void;
}> = ({ tool, onBack }) => {
  const handleComplete = () => onBack();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tool.name}
      className="fixed inset-0 z-[60] overflow-y-auto bg-background px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] animate-in fade-in duration-300 sm:static sm:z-auto sm:mx-auto sm:max-w-xl sm:bg-transparent sm:p-0"
    >
      <button
        onClick={onBack}
        className="group mb-4 flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Back to tools
      </button>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className={cn("bg-gradient-to-r p-6 sm:p-8", tool.gradient)}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/20">
              <tool.icon className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-medium text-primary-foreground sm:text-2xl">{tool.name}</h2>
              <p className="text-sm text-primary-foreground">{tool.duration} guided exercise</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {tool.id === "physiological-sigh" && (
            <PhysiologicalSighExercise onComplete={handleComplete} onBack={onBack} gradient={tool.gradient} />
          )}
          {tool.id === "box-breathing" && (
            <BoxBreathingExercise onComplete={handleComplete} onBack={onBack} gradient={tool.gradient} />
          )}
          {tool.id === "grounding-54321" && (
            <GroundingExercise onComplete={handleComplete} onBack={onBack} gradient={tool.gradient} />
          )}
          {(tool.id === "body-scan" || tool.id === "mindful-moment" || tool.id === "self-compassion") && (
            <GuidedExercise toolId={tool.id} onComplete={handleComplete} onBack={onBack} gradient={tool.gradient} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────
   Tool Card
   ──────────────────────────────────────────── */

const ToolCard: React.FC<{
  tool: Tool;
  onClick: () => void;
}> = ({ tool, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full rounded-3xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
  >
    <div className="flex items-start gap-4">
      <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl", tool.bgAccent)}>
        <tool.icon className={tool.iconColor} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-foreground">{tool.name}</h3>
          <ChevronRight size={16} className="flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {tool.subtitle} · {tool.duration}
        </p>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{tool.description}</p>
      </div>
    </div>
  </button>
);

/* ────────────────────────────────────────────
   Main Tools Page
   ──────────────────────────────────────────── */

const Tools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const { hash } = useLocation();

  // The support nudge links to /tools#calm etc. — bring that group into view.
  useEffect(() => {
    if (activeTool || !hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [hash, activeTool]);

  if (activeTool) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-8 sm:py-10">
        <ToolDetail tool={activeTool} onBack={() => setActiveTool(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-24 pt-6 animate-in fade-in duration-500 sm:px-8 sm:pt-10">
      <h1 className="font-serif text-[30px] font-medium text-foreground sm:text-[38px]">Tools for right now</h1>
      <p className="mt-2 max-w-lg leading-relaxed text-muted-foreground">
        Short, guided exercises. Pick whatever matches how you feel. There's no wrong choice.
      </p>

      <div className="mt-10 space-y-12">
        {GROUP_ORDER.map((group) => (
          <section key={group} id={group} aria-labelledby={`group-${group}`} className="scroll-mt-24">
            <h2 id={`group-${group}`} className="font-serif text-xl text-foreground">
              {TOOLS_GROUPS[group].title}
            </h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">{TOOLS_GROUPS[group].blurb}</p>
            <div className="grid grid-cols-1 gap-3">
              {tools
                .filter((t) => t.group === group)
                .map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool)} />
                ))}
            </div>
          </section>
        ))}

        <section id="support" aria-labelledby="support-heading" className="scroll-mt-24">
          <h2 id="support-heading" className="font-serif text-xl text-foreground">
            Need support?
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            You don't have to handle everything on your own. Reaching out is a strong thing to do.
          </p>
          <HelplineCard />
        </section>
      </div>
    </div>
  );
};

export default Tools;
