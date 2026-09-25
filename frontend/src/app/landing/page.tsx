import type { Metadata } from "next";
import TerminalMockup from "./terminal-mockup";
import FaqAccordion from "./faq-accordion";

export const metadata: Metadata = {
  title: "AI Terminal Agent — Command Your Workflow with AI",
  description:
    "An AI-powered terminal companion that turns natural language into shell commands, automates files, fixes bugs, and optimizes your workflow.",
};

const FEATURES = [
  {
    title: "Natural Language Commands",
    desc: "Type what you want in plain English. The agent translates it into precise, safe shell commands.",
    icon: "chat",
  },
  {
    title: "Code Execution",
    desc: "Run scripts, tests, and builds directly from a conversation — with live output streamed back to you.",
    icon: "bolt",
  },
  {
    title: "File Automation",
    desc: "Batch rename, refactor, move, and organize files across your project in seconds.",
    icon: "folder",
  },
  {
    title: "Bug Fixing",
    desc: "Diagnose stack traces, locate root causes, and ship fixes without leaving your terminal.",
    icon: "bug",
  },
  {
    title: "Workflow Optimization",
    desc: "Learns your patterns and suggests faster paths — fewer keystrokes, fewer context switches.",
    icon: "spark",
  },
];

const STEPS = [
  { step: "01", title: "Ask", desc: "Describe your task in natural language, right in the terminal." },
  { step: "02", title: "Plan", desc: "The agent breaks it down into a safe, reviewable execution plan." },
  { step: "03", title: "Execute", desc: "Commands run in real time with full visibility into every step." },
  { step: "04", title: "Verify", desc: "Results are checked automatically — no silent failures." },
];

const WHY = [
  { label: "Speed", value: "10x", desc: "Faster task completion vs. manual CLI workflows." },
  { label: "Accuracy", value: "99.2%", desc: "Command success rate across real dev environments." },
  { label: "Productivity", value: "4.5h", desc: "Average time saved per developer, per week." },
  { label: "Automation", value: "24/7", desc: "Background agents that never stop watching your repo." },
];

const USE_CASES = [
  { title: "Project Setup", desc: "Scaffold new apps, install dependencies, and configure tooling instantly." },
  { title: "Debugging", desc: "Trace errors across logs, stack frames, and source in one pass." },
  { title: "Git Tasks", desc: "Branch, rebase, resolve conflicts, and craft clean commit messages." },
  { title: "Package Installation", desc: "Resolve, install, and audit dependencies without leaving your flow." },
  { title: "Deployment", desc: "Build, ship, and roll back releases with a single conversational command." },
];

const SECURITY = [
  {
    title: "Plan Before Execute",
    desc: "Every command is planned and shown before it runs — no silent or destructive actions.",
    icon: "shield",
  },
  {
    title: "Sandboxed by Default",
    desc: "Commands execute in an isolated environment unless you explicitly grant broader access.",
    icon: "box",
  },
  {
    title: "Full Audit Trail",
    desc: "Every action, prompt, and output is logged so you can trace exactly what happened.",
    icon: "log",
  },
  {
    title: "Local & Private",
    desc: "Your code and credentials never leave your machine unless you opt into cloud sync.",
    icon: "lock",
  },
];

const INTEGRATIONS = [
  "GitHub", "GitLab", "Docker", "Kubernetes", "VS Code", "JetBrains",
  "Slack", "Linear", "AWS", "Vercel", "Postgres", "npm",
];

const FAQS = [
  {
    q: "Does the agent run commands automatically without my approval?",
    a: "No. Every plan is shown before execution, and destructive or irreversible actions always require explicit confirmation.",
  },
  {
    q: "Which shells and operating systems are supported?",
    a: "macOS, Linux, and Windows (via WSL). It works with bash, zsh, and PowerShell out of the box.",
  },
  {
    q: "Can it work with my existing CI/CD and git workflow?",
    a: "Yes — it integrates with GitHub, GitLab, and most CI providers, and can open PRs, review diffs, and run pipelines on request.",
  },
  {
    q: "Is my code sent to external servers?",
    a: "Only the context needed to complete a task is processed, and you control whether execution happens locally or in the cloud.",
  },
  {
    q: "What happens if a command fails mid-plan?",
    a: "The agent halts, reports the failure with context, and proposes a corrected next step instead of continuing blindly.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "It feels like pairing with a senior engineer who's memorized every man page. My terminal sessions are half as long.",
    name: "Priya Nair",
    role: "Staff Engineer, Fintech",
  },
  {
    quote:
      "The plan → execute → verify loop is what sold me. I always know what's about to run before it runs.",
    name: "Marcus Lee",
    role: "DevOps Lead",
  },
  {
    quote:
      "Bug fixing that used to take an hour of grep and guesswork now takes a sentence.",
    name: "Sofia Alvarez",
    role: "Full-Stack Developer",
  },
];

function Icon({ name, className }: { name: string; className?: string }) {
  const common = "h-5 w-5";
  switch (name) {
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M4 5h16v10H8l-4 4V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "folder":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M3 6h6l2 2h10v11H3V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "bug":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M9 8V6a3 3 0 0 1 6 0v2M6 9h12v6a6 6 0 0 1-12 0V9Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 11h2M18 11h2M4 17l2-1M18 17l-2-1M12 9v9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M12 3v4M12 17v4M4 12h4M16 12h4M6 6l3 3M18 6l-3 3M6 18l3-3M18 18l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M3 8l9-5 9 5-9 5-9-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M3 8v8l9 5 9-5V8M12 13v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "log":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M5 4h14v16H5V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className ?? common}>
          <path d="M6 11V8a6 6 0 0 1 12 0v3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 11h14v9H5v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden app-shell-bg text-primary">
      {/* Background layers */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(59,130,246,0.15),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(167,139,250,0.18),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.10),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_40%,transparent_100%)]" />
      </div>

      <Nav />
      <Hero />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <WhyChoose />
      <UseCases />
      <Security />
      <Integrations />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-default app-shell-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent-subtle font-mono text-sm text-accent-hover">
            &gt;_
          </div>
          <span className="font-mono text-sm font-semibold tracking-tight text-primary">
            termina<span className="text-accent-hover">.ai</span>
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-secondary md:flex">
          <a href="#features" className="transition hover:text-accent-hover">Features</a>
          <a href="#how-it-works" className="transition hover:text-accent-hover">How it works</a>
          <a href="#use-cases" className="transition hover:text-accent-hover">Use cases</a>
          <a href="#security" className="transition hover:text-accent-hover">Security</a>
          <a href="#testimonials" className="transition hover:text-accent-hover">Testimonials</a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden text-sm text-secondary transition hover:text-primary sm:block"
          >
            Sign in
          </a>
          <a
            href="/register"
            className="rounded-lg border border-accent/40 bg-accent-subtle px-4 py-2 text-sm font-medium text-accent-hover transition hover:bg-[rgb(59_130_246_/_0.2)]"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-default panel-bg px-4 py-1.5 text-xs text-secondary backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Now shipping v2.0 — smarter planning, faster execution
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Command Your Workflow
          <span className="block bg-gradient-to-r from-accent via-accent-hover to-ai bg-clip-text text-transparent">
            with AI
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted">
          Your AI terminal companion. Describe what you need in plain English —
          it plans, executes, and verifies real commands across your codebase.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/register"
            className="group relative inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-primary transition hover:bg-accent-hover"
          >
            Get Started
            <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
          </a>
          <a
            href="#terminal-demo"
            className="inline-flex items-center justify-center rounded-lg border border-default panel-bg px-6 py-3 text-sm font-semibold text-secondary backdrop-blur transition hover:border-strong hover:panel-bg-strong"
          >
            View Demo
          </a>
        </div>
      </div>

      <div id="terminal-demo" className="relative mx-auto mt-16 max-w-4xl">
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-accent/20 via-accent-hover/10 to-ai/20 blur-2xl" />
        <TerminalMockup />
      </div>
    </section>
  );
}

function LogoStrip() {
  const items = ["macOS", "Linux", "WSL", "Docker", "GitHub", "VS Code"];
  return (
    <section className="border-y border-default panel-bg-soft py-8">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-6 text-center text-xs uppercase tracking-widest text-faint">
          Works everywhere developers already are
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium text-muted">
          {items.map((item) => (
            <span key={item} className="font-mono">{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-hover">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-balance text-muted">{desc}</p>}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="Key Features"
        title="Everything your terminal was missing"
        desc="A single agent that understands intent, executes safely, and keeps your workflow moving."
      />
      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`group relative rounded-2xl border border-default panel-bg p-6 backdrop-blur-xl transition hover:border-accent/30 hover:panel-bg-strong ${
              i === 4 ? "sm:col-span-2 lg:col-span-1" : ""
            }`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100" style={{ boxShadow: "0 0 40px rgba(16,185,129,0.15) inset" }} />
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent/30 bg-accent-subtle text-accent-hover">
              <Icon name={f.icon} />
            </div>
            <h3 className="font-semibold text-primary">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-y border-default panel-bg-soft py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="How It Works"
          title="Four steps from intent to result"
          desc="Every action follows the same transparent loop — nothing runs without a plan."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              <div className="rounded-2xl border border-default panel-bg p-6 backdrop-blur-xl">
                <span className="font-mono text-3xl font-bold text-accent-hover/40">{s.step}</span>
                <h3 className="mt-3 font-semibold text-primary">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-accent/50 lg:block">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChoose() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="Why Choose Us"
        title="Built for speed, trusted for accuracy"
        desc="Numbers that matter to developers who ship every day."
      />
      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {WHY.map((w) => (
          <div
            key={w.label}
            className="rounded-2xl border border-default panel-bg-strong p-6 text-center backdrop-blur-xl"
          >
            <div className="bg-gradient-to-r from-accent-hover to-accent bg-clip-text font-mono text-4xl font-bold text-transparent">
              {w.value}
            </div>
            <div className="mt-2 text-sm font-semibold text-secondary">{w.label}</div>
            <p className="mt-1 text-xs leading-relaxed text-faint">{w.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section id="use-cases" className="relative border-y border-default panel-bg-soft py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Supported Use Cases"
          title="From first commit to production"
          desc="Whatever's in your terminal history, the agent already knows the pattern."
        />
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {USE_CASES.map((u) => (
            <div
              key={u.title}
              className="rounded-2xl border border-default panel-bg p-5 backdrop-blur-xl transition hover:border-accent-hover/30"
            >
              <h3 className="font-mono text-sm font-semibold text-accent-hover">{u.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Security() {
  return (
    <section id="security" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="Security & Safety"
        title="Powerful automation, guarded by design"
        desc="Autonomy without surprises — the agent is built to ask before it acts."
      />
      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SECURITY.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-default panel-bg p-6 backdrop-blur-xl transition hover:border-ai/30"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-ai/30 bg-ai-subtle text-ai">
              <Icon name={s.icon} />
            </div>
            <h3 className="font-semibold text-primary">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Integrations() {
  return (
    <section className="relative border-y border-default panel-bg-soft py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Integrations"
          title="Plugs into the tools you already use"
          desc="No new workflow to learn — the agent meets you where you work."
        />
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {INTEGRATIONS.map((name) => (
            <div
              key={name}
              className="flex items-center justify-center rounded-xl border border-default panel-bg px-4 py-5 font-mono text-sm text-secondary backdrop-blur-xl transition hover:border-accent-hover/30 hover:text-accent-hover"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <SectionHeading eyebrow="FAQ" title="Questions developers actually ask" />
      <div className="mt-12">
        <FaqAccordion items={FAQS} />
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="Developer Stories"
        title="Trusted by engineers who live in the terminal"
      />
      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl border border-default panel-bg p-6 backdrop-blur-xl"
          >
            <p className="font-mono text-accent-hover">&ldquo;</p>
            <p className="text-sm leading-relaxed text-secondary">{t.quote}</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-default panel-bg font-mono text-xs text-secondary">
                {t.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="text-sm font-medium text-primary">{t.name}</div>
                <div className="text-xs text-faint">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-accent-subtle p-10 text-center backdrop-blur-xl sm:p-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.2),transparent_60%)]" />
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Your terminal, upgraded.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-balance text-muted">
          Install the agent in under a minute and start commanding your workflow with AI.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-primary transition hover:bg-accent-hover"
          >
            Get Started Free
          </a>
          <code className="rounded-lg border border-default panel-bg-strong px-4 py-3 font-mono text-sm text-accent-hover">
            npx termina init
          </code>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-default py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-faint sm:flex-row">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-accent-hover">&gt;_</span> termina.ai
        </div>
        <p>© {new Date().getFullYear()} termina.ai — All rights reserved.</p>
      </div>
    </footer>
  );
}
