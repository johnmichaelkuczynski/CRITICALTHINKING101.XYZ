import { useState, useEffect } from "react";
import { Delete, Calculator, ChevronDown, ChevronUp } from "lucide-react";

type SymbolKey = string | { label: string; insert: string; action?: "back" | "clear"; wide?: boolean; muted?: boolean };

const NUMBER_PAD: SymbolKey[] = [
  "7", "8", "9", { label: "÷", insert: "/" }, { label: "⌫", insert: "", action: "back", muted: true },
  "4", "5", "6", { label: "×", insert: "*" }, { label: "C", insert: "", action: "clear", muted: true },
  "1", "2", "3", { label: "−", insert: "-" }, "(",
  "0", ".", ",", "+", ")",
  "%", "=", { label: "space", insert: " ", wide: true },
];

const KEYBOARDS: Record<string, SymbolKey[]> = {
  Numbers: NUMBER_PAD,
  Algebra: [
    "x", "y", "z", "a", "b", "c", "=", "≠", "<", ">", "≤", "≥",
    "+", "-", "·", "÷", "±", "√", "∛", "^2", "^3", "^n", "|x|", "!"
  ],
  Statistics: [
    "μ", "σ", "σ²", "s", "s²", "x̄", "p̂", "P(A)", "P(A|B)",
    "∑", "∏", "E(X)", "Var(X)", "N(μ,σ²)", "z", "t", "χ²", "F"
  ],
  Calculus: [
    "∫", "∬", "∭", "∮", "d/dx", "∂/∂x", "lim", "→", "∞",
    "Δ", "∇", "dx", "dy", "dz", "dt", "e", "ln", "log"
  ],
  Discrete: [
    "∀", "∃", "∄", "∴", "∵", "ℕ", "ℤ", "ℚ", "ℝ", "ℂ",
    "≡", "≅", "≈", "∝", "mod", "⌊x⌋", "⌈x⌉", "gcd", "lcm"
  ],
  "Logic & Sets": [
    "∀", "∃", "∄", "∧", "∨", "¬", "→", "↔", "⊕", "⊤", "⊥", "⊢", "⊨",
    "∈", "∉", "⊂", "⊆", "⊄", "∪", "∩", "∅", "∖", "×",
    "A^c", "P(S)", "|S|", "ℵ₀", "ω", "ω₀",
  ],
  Trigonometry: [
    "sin", "cos", "tan", "csc", "sec", "cot", "arcsin", "arccos", "arctan",
    "θ", "α", "β", "γ", "φ", "π", "°", "rad"
  ],
  Geometry: [
    "△", "∠", "⊥", "∥", "≅", "∼", "π", "r", "d", "A", "V", "C"
  ],
  Chemistry: [
    "→", "⇌", "⇋", "⇒", "↑", "↓",
    "Δ", "ΔH", "ΔS", "ΔG", "ΔT", "ΔE",
    "°", "°C", "K",
    "+", "−", "±", "·", "×", "=", "≈", "≠",
    "(s)", "(l)", "(g)", "(aq)",
    "H⁺", "OH⁻", "H₃O⁺", "e⁻",
    "pH", "pOH", "pKa", "pKb", "Ka", "Kb", "Kw", "Keq", "Ksp", "Kc", "Kp",
    "M", "m", "N", "mol", "g", "L", "mL", "atm", "torr", "Pa", "kPa", "J", "kJ", "cal", "kcal",
    "n", "V", "P", "T", "R",
    "c", "λ", "ν", "h", "ℏ",
    "₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉",
    "⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹",
    "α", "β", "γ", "δ", "ε", "μ", "π", "σ", "Σ", "Ω",
    "[ ]", "[X]", "[H⁺]",
    "NA", "kB",
    "σ-bond", "π-bond",
    "∴", "∵",
  ],
  Economics: [
    "$", "€", "£", "¥", "₹", "¢",
    "P", "Q", "D", "S", "Qd", "Qs",
    "MR", "MC", "AC", "ATC", "AVC", "MP", "TR", "TC",
    "π", "C", "I", "G", "X", "M", "Y",
    "GDP", "GNP", "CPI", "U", "W", "L", "K",
    "r", "i",
    "ε", "η", "Δ", "%Δ", "∂",
    "Σ", "∫", "max", "min", "E[ ]", "→", "≈",
    "≿", "≻", "∼", "∈", "argmax", "s.t.",
    "MS", "MD", "AD", "AS", "LRAS", "SRAS", "NX", "MPC", "MPS", "V",
    "_t", "_t-1", "_t+1", "_d", "_s", "_e", "_0",
    "α", "β", "γ", "δ", "λ", "μ", "ρ", "σ",
  ],
  Physics: [
    "v", "v₀", "a", "g", "t", "x", "d", "F", "m", "p",
    "N", "f", "μ", "W", "P", "KE", "PE", "E", "J",
    "→", "·", "×", "|v|", "x̂", "ŷ", "ẑ", "F_net",
    "_0", "_x", "_y", "_z", "_net", "_f", "_i", "_avg", "²", "³",
    "c", "G", "h", "ℏ", "k_B", "N_A", "ε₀", "μ₀", "R", "σ",
    "Q", "q", "B", "V", "I", "C", "L", "Φ", "Ω",
    "λ", "T", "ω", "φ", "n", "Hz",
    "U", "S", "ΔS", "ΔT", "K", "°C", "°F",
    "ψ", "γ", "β", "eV", "MeV",
    "kg", "s", "Pa", "Wb", "mol", "cd", "m/s", "m/s²", "kg·m/s", "N·m",
    "α", "δ", "Δ", "ε", "θ", "ν", "ρ", "τ",
  ],
};

type KeyboardKey = keyof typeof KEYBOARDS;

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  onBackspace?: () => void;
  onClear?: () => void;
  /** When true, the whole keyboard is hidden behind a toggle and starts closed. */
  collapsible?: boolean;
  className?: string;
}

export function MathKeyboard({
  onInsert,
  onBackspace,
  onClear,
  collapsible = false,
  className,
}: MathKeyboardProps) {
  const [open, setOpen] = useState(false);
  const showBody = !collapsible || open;
  const [activeTabs, setActiveTabs] = useState<KeyboardKey[]>(() => {
    const saved = localStorage.getItem("math-keyboard-tabs-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        return parsed.filter((t): t is KeyboardKey => t in KEYBOARDS);
      } catch {}
    }
    return ["Numbers"];
  });

  useEffect(() => {
    localStorage.setItem("math-keyboard-tabs-v2", JSON.stringify(activeTabs));
  }, [activeTabs]);

  const toggleTab = (tab: KeyboardKey) => {
    setActiveTabs(prev =>
      prev.includes(tab) ? prev.filter(t => t !== tab) : [...prev, tab]
    );
  };

  const handleKey = (key: SymbolKey) => {
    if (typeof key === "string") {
      onInsert(key);
      return;
    }
    if (key.action === "back") {
      onBackspace ? onBackspace() : onInsert("");
      return;
    }
    if (key.action === "clear") {
      onClear ? onClear() : onInsert("");
      return;
    }
    onInsert(key.insert);
  };

  if (collapsible && !showBody) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-secondary transition-colors"
          data-testid="button-toggle-math-keyboard"
        >
          <Calculator className="w-3.5 h-3.5" />
          Math keyboard
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-secondary/50 border rounded-md p-3 flex flex-col gap-3 ${className ?? ""}`}>
      {collapsible && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="self-start inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-1 py-0.5 rounded-md transition-colors"
          data-testid="button-toggle-math-keyboard"
        >
          <Calculator className="w-3.5 h-3.5" />
          Math keyboard
          <ChevronUp className="w-3 h-3" />
        </button>
      )}
      <div className="flex flex-wrap gap-1">
        {(Object.keys(KEYBOARDS) as KeyboardKey[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => toggleTab(tab)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeTabs.includes(tab)
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted border border-border"
            }`}
            data-testid={`mathkb-tab-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {activeTabs.map(tab => {
          if (!KEYBOARDS[tab]) return null;
          const isNumbers = tab === "Numbers";
          return (
            <div key={tab} className="flex flex-col gap-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
                {tab}
              </div>
              <div className={isNumbers ? "grid grid-cols-5 gap-1.5" : "flex flex-wrap gap-1.5"}>
                {KEYBOARDS[tab].map((key, i) => {
                  const isObj = typeof key !== "string";
                  const label = isObj ? key.label : key;
                  const muted = isObj && key.muted;
                  const wide = isObj && key.wide;
                  return (
                    <button
                      key={`${tab}-${i}-${label}`}
                      type="button"
                      onClick={() => handleKey(key)}
                      className={`min-w-9 h-10 px-2 rounded border shadow-sm flex items-center justify-center font-mono text-sm hover:bg-muted hover:border-primary/50 transition-all active:scale-95 ${
                        muted ? "bg-muted/40 text-muted-foreground" : "bg-background"
                      } ${wide ? "col-span-3 text-xs" : ""}`}
                      data-testid={`mathkb-key-${tab}-${label}`}
                    >
                      {isObj && key.action === "back" ? <Delete className="w-4 h-4" /> : label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {activeTabs.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Select a keyboard category above to show symbols.
          </div>
        )}
      </div>
    </div>
  );
}
