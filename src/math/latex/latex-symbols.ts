/**
 * LaTeX's math symbols, as the characters Word writes, and what part each plays in an equation.
 *
 * @module
 */
// The tables are LaTeX's command names, which aren't words
/* cspell:disable */
import type { MathAccentName } from "../math-accent";
import type { MathBraceShape } from "../math-brace";
import type { MathLargeOperatorName } from "../math-large-operator";

/**
 * The part a symbol plays, as TeX's classes of atoms, which says where an operator's or function's argument ends:
 *
 * - `"ordinary"`: letters, digits and most symbols;
 * - `"binary"`: operators between two things, such as × and ∪;
 * - `"additive"`: the binary operators + − ± ∓, which end an operator's argument, as in ∑aᵢ + b;
 * - `"relation"`: =, <, ∈, arrows and the like, which end it too;
 * - `"punctuation"`: , and ;, which end it too;
 * - `"open"` and `"close"`: brackets, which an argument holds in pairs.
 */
export type SymbolRole = "ordinary" | "binary" | "additive" | "relation" | "punctuation" | "open" | "close";

/** A symbol: its character or characters, and its part */
export type LatexSymbol = {
    readonly text: string;
    readonly role: SymbolRole;
};

/**
 * Whether a table has an entry of its own for a key. Unlike `in`, it isn't fooled by the names every object has, such as
 * `\constructor`.
 */
export const hasEntry = (table: object, key: string): boolean => Object.prototype.hasOwnProperty.call(table, key);

const withRole = (role: SymbolRole, symbols: Readonly<Record<string, string>>): readonly (readonly [string, LatexSymbol])[] =>
    Object.entries(symbols).map(([name, text]) => [name, { text, role }]);

/** Spaces, which some commands write */
export const QUAD = "\u2003";
export const THICK_SPACE = "\u2004";

const GREEK: Readonly<Record<string, string>> = {
    alpha: "α",
    beta: "β",
    gamma: "γ",
    delta: "δ",
    epsilon: "ϵ",
    varepsilon: "ε",
    zeta: "ζ",
    eta: "η",
    theta: "θ",
    vartheta: "ϑ",
    iota: "ι",
    kappa: "κ",
    varkappa: "ϰ",
    lambda: "λ",
    mu: "μ",
    nu: "ν",
    xi: "ξ",
    omicron: "ο",
    pi: "π",
    varpi: "ϖ",
    rho: "ρ",
    varrho: "ϱ",
    sigma: "σ",
    varsigma: "ς",
    tau: "τ",
    upsilon: "υ",
    phi: "ϕ",
    varphi: "φ",
    chi: "χ",
    psi: "ψ",
    omega: "ω",
    digamma: "ϝ",
};

/** Capital Greek letters, which LaTeX draws upright */
export const UPRIGHT_GREEK: Readonly<Record<string, string>> = {
    Gamma: "Γ",
    Delta: "Δ",
    Theta: "Θ",
    Lambda: "Λ",
    Xi: "Ξ",
    Pi: "Π",
    Sigma: "Σ",
    Upsilon: "Υ",
    Phi: "Φ",
    Psi: "Ψ",
    Omega: "Ω",
};

/** Capital Greek letters in italic, as amsmath's `\varGamma` */
export const ITALIC_GREEK: Readonly<Record<string, string>> = Object.fromEntries(
    Object.entries(UPRIGHT_GREEK).map(([name, text]) => [`var${name}`, text]),
);

const ORDINARY: Readonly<Record<string, string>> = {
    ...GREEK,
    infty: "∞",
    partial: "∂",
    nabla: "∇",
    forall: "∀",
    exists: "∃",
    nexists: "∄",
    emptyset: "∅",
    varnothing: "∅",
    neg: "¬",
    lnot: "¬",
    angle: "∠",
    measuredangle: "∡",
    sphericalangle: "∢",
    triangle: "△",
    hbar: "ℏ",
    hslash: "ℏ",
    ell: "ℓ",
    wp: "℘",
    Re: "ℜ",
    Im: "ℑ",
    aleph: "ℵ",
    beth: "ℶ",
    gimel: "ℷ",
    daleth: "ℸ",
    imath: "ı",
    jmath: "ȷ",
    prime: "′",
    backprime: "‵",
    top: "⊤",
    bot: "⊥",
    ldots: "…",
    dots: "…",
    dotsc: "…",
    dotso: "…",
    cdots: "⋯",
    dotsb: "⋯",
    dotsm: "⋯",
    dotsi: "⋯",
    vdots: "⋮",
    ddots: "⋱",
    iddots: "⋰",
    square: "□",
    Box: "□",
    blacksquare: "■",
    Diamond: "◇",
    lozenge: "◊",
    blacklozenge: "⧫",
    clubsuit: "♣",
    diamondsuit: "♢",
    heartsuit: "♡",
    spadesuit: "♠",
    flat: "♭",
    natural: "♮",
    sharp: "♯",
    surd: "√",
    mho: "℧",
    complement: "∁",
    dag: "†",
    ddag: "‡",
    S: "§",
    P: "¶",
    copyright: "©",
    pounds: "£",
    euro: "€",
    yen: "¥",
    degree: "°",
    bigstar: "★",
    checkmark: "✓",
    maltese: "✠",
    backslash: "\\",
    Vert: "‖",
    vert: "|",
};

const BINARY: Readonly<Record<string, string>> = {
    times: "×",
    div: "÷",
    cdot: "⋅",
    centerdot: "⋅",
    ast: "∗",
    star: "⋆",
    circ: "∘",
    bullet: "∙",
    oplus: "⊕",
    ominus: "⊖",
    otimes: "⊗",
    oslash: "⊘",
    odot: "⊙",
    circledast: "⊛",
    circledcirc: "⊚",
    boxplus: "⊞",
    boxminus: "⊟",
    boxtimes: "⊠",
    boxdot: "⊡",
    cup: "∪",
    cap: "∩",
    sqcup: "⊔",
    sqcap: "⊓",
    uplus: "⊎",
    vee: "∨",
    lor: "∨",
    wedge: "∧",
    land: "∧",
    setminus: "∖",
    smallsetminus: "∖",
    wr: "≀",
    amalg: "⨿",
    diamond: "⋄",
    triangleleft: "◁",
    triangleright: "▷",
    bigtriangleup: "△",
    bigtriangledown: "▽",
    lhd: "⊲",
    rhd: "⊳",
    unlhd: "⊴",
    unrhd: "⊵",
    ltimes: "⋉",
    rtimes: "⋊",
    dotplus: "∔",
    Cup: "⋓",
    Cap: "⋒",
    intercal: "⊺",
    barwedge: "⌅",
    veebar: "⊻",
    divideontimes: "⋇",
    leftthreetimes: "⋋",
    rightthreetimes: "⋌",
    curlyvee: "⋎",
    curlywedge: "⋏",
    bigcirc: "◯",
    dagger: "†",
    ddagger: "‡",
};

const ADDITIVE: Readonly<Record<string, string>> = {
    pm: "±",
    mp: "∓",
};

const RELATION: Readonly<Record<string, string>> = {
    le: "≤",
    leq: "≤",
    ge: "≥",
    geq: "≥",
    leqslant: "⩽",
    geqslant: "⩾",
    leqq: "≦",
    geqq: "≧",
    ne: "≠",
    neq: "≠",
    equiv: "≡",
    approx: "≈",
    approxeq: "≊",
    sim: "∼",
    simeq: "≃",
    backsim: "∽",
    cong: "≅",
    propto: "∝",
    varpropto: "∝",
    in: "∈",
    notin: "∉",
    ni: "∋",
    owns: "∋",
    subset: "⊂",
    subseteq: "⊆",
    supset: "⊃",
    supseteq: "⊇",
    subsetneq: "⊊",
    supsetneq: "⊋",
    subseteqq: "⫅",
    supseteqq: "⫆",
    nsubseteq: "⊈",
    nsupseteq: "⊉",
    sqsubset: "⊏",
    sqsupset: "⊐",
    sqsubseteq: "⊑",
    sqsupseteq: "⊒",
    mid: "∣",
    nmid: "∤",
    shortmid: "∣",
    parallel: "∥",
    nparallel: "∦",
    shortparallel: "∥",
    perp: "⊥",
    models: "⊨",
    vdash: "⊢",
    dashv: "⊣",
    vDash: "⊨",
    Vdash: "⊩",
    ll: "≪",
    gg: "≫",
    lll: "⋘",
    ggg: "⋙",
    prec: "≺",
    succ: "≻",
    preceq: "⪯",
    succeq: "⪰",
    doteq: "≐",
    asymp: "≍",
    bowtie: "⋈",
    Join: "⨝",
    smile: "⌣",
    frown: "⌢",
    coloneqq: "≔",
    coloneq: "≔",
    eqqcolon: "≕",
    triangleq: "≜",
    lesssim: "≲",
    gtrsim: "≳",
    lessgtr: "≶",
    gtrless: "≷",
    nless: "≮",
    ngtr: "≯",
    nleq: "≰",
    ngeq: "≱",
    nsim: "≁",
    ncong: "≇",
    lneq: "⪇",
    gneq: "⪈",
    lneqq: "≨",
    gneqq: "≩",
    therefore: "∴",
    because: "∵",
    circeq: "≗",
    bumpeq: "≏",
    Bumpeq: "≎",
    risingdotseq: "≓",
    fallingdotseq: "≒",
    vartriangleleft: "⊲",
    vartriangleright: "⊳",
    trianglelefteq: "⊴",
    trianglerighteq: "⊵",
    between: "≬",
    pitchfork: "⋔",
    colon: ":",
    to: "→",
    rightarrow: "→",
    leftarrow: "←",
    gets: "←",
    leftrightarrow: "↔",
    Rightarrow: "⇒",
    Leftarrow: "⇐",
    Leftrightarrow: "⇔",
    implies: "⟹",
    impliedby: "⟸",
    iff: "⟺",
    longrightarrow: "⟶",
    longleftarrow: "⟵",
    longleftrightarrow: "⟷",
    Longrightarrow: "⟹",
    Longleftarrow: "⟸",
    Longleftrightarrow: "⟺",
    mapsto: "↦",
    longmapsto: "⟼",
    hookrightarrow: "↪",
    hookleftarrow: "↩",
    uparrow: "↑",
    downarrow: "↓",
    updownarrow: "↕",
    Uparrow: "⇑",
    Downarrow: "⇓",
    Updownarrow: "⇕",
    nearrow: "↗",
    searrow: "↘",
    swarrow: "↙",
    nwarrow: "↖",
    rightharpoonup: "⇀",
    rightharpoondown: "⇁",
    leftharpoonup: "↼",
    leftharpoondown: "↽",
    rightleftharpoons: "⇌",
    leftrightharpoons: "⇋",
    upharpoonright: "↾",
    upharpoonleft: "↿",
    downharpoonright: "⇂",
    downharpoonleft: "⇃",
    twoheadrightarrow: "↠",
    twoheadleftarrow: "↞",
    rightarrowtail: "↣",
    leftarrowtail: "↢",
    leadsto: "⇝",
    rightsquigarrow: "⇝",
    leftrightsquigarrow: "↭",
    curvearrowright: "↷",
    curvearrowleft: "↶",
    circlearrowright: "↻",
    circlearrowleft: "↺",
    rightrightarrows: "⇉",
    leftleftarrows: "⇇",
    rightleftarrows: "⇄",
    leftrightarrows: "⇆",
    Rrightarrow: "⇛",
    Lleftarrow: "⇚",
    nrightarrow: "↛",
    nleftarrow: "↚",
    nRightarrow: "⇏",
    nLeftarrow: "⇍",
    nleftrightarrow: "↮",
    nLeftrightarrow: "⇎",
    looparrowright: "↬",
    looparrowleft: "↫",
    multimap: "⊸",
};

/** Brackets, which `\left`, `\right`, `\middle` and `\big` take too */
const OPENING: Readonly<Record<string, string>> = {
    langle: "⟨",
    lceil: "⌈",
    lfloor: "⌊",
    lvert: "|",
    lVert: "‖",
    lbrace: "{",
    lbrack: "[",
    ulcorner: "⌜",
    llcorner: "⌞",
    lgroup: "⟮",
    lmoustache: "⎰",
    llbracket: "⟦",
};

const CLOSING: Readonly<Record<string, string>> = {
    rangle: "⟩",
    rceil: "⌉",
    rfloor: "⌋",
    rvert: "|",
    rVert: "‖",
    rbrace: "}",
    rbrack: "]",
    urcorner: "⌝",
    lrcorner: "⌟",
    rgroup: "⟯",
    rmoustache: "⎱",
    rrbracket: "⟧",
};

// Symbols written with a backslash and a character, such as \{ and \|. The character # is taken literally, as it has
// a meaning in equation arrays
const ESCAPED_ORDINARY: Readonly<Record<string, string>> = Object.fromEntries([
    ["%", "%"],
    ["$", "$"],
    ["_", "_"],
    ["|", "‖"],
]);

/** The symbols LaTeX writes with a command, by the command's name without its backslash */
export const SYMBOLS: ReadonlyMap<string, LatexSymbol> = new Map([
    ...withRole("ordinary", { ...ORDINARY, ...ESCAPED_ORDINARY }),
    ...withRole("binary", BINARY),
    ...withRole("additive", ADDITIVE),
    ...withRole("relation", RELATION),
    ...withRole("open", { ...OPENING, ...Object.fromEntries([["{", "{"]]) }),
    ...withRole("close", { ...CLOSING, ...Object.fromEntries([["}", "}"]]) }),
]);

/** Characters typed as they are, which Word writes as another character or which play a part */
export const CHARACTERS: ReadonlyMap<string, LatexSymbol> = new Map<string, LatexSymbol>([
    ["+", { text: "+", role: "additive" }],
    // The minus sign, not the hyphen, as LaTeX draws it
    ["-", { text: "−", role: "additive" }],
    ["*", { text: "∗", role: "binary" }],
    ["=", { text: "=", role: "relation" }],
    ["<", { text: "<", role: "relation" }],
    [">", { text: ">", role: "relation" }],
    [":", { text: ":", role: "relation" }],
    [",", { text: ",", role: "punctuation" }],
    [";", { text: ";", role: "punctuation" }],
    ["(", { text: "(", role: "open" }],
    ["[", { text: "[", role: "open" }],
    [")", { text: ")", role: "close" }],
    ["]", { text: "]", role: "close" }],
]);

// The part a character plays when it is typed as it is, such as ≤ in place of \le
const ROLES_OF_CHARACTERS: ReadonlyMap<string, SymbolRole> = new Map(
    [...SYMBOLS.values(), ...CHARACTERS.values()]
        .filter(({ text, role }) => role !== "ordinary" && text !== "|" && text !== "‖")
        .map(({ text, role }) => [text, role]),
);

/** The part a character plays, whether it was typed as it is or written with a command */
export const roleOf = (character: string): SymbolRole => ROLES_OF_CHARACTERS.get(character) ?? "ordinary";

/** The delimiters typed as they are, which `\left`, `\right`, `\middle` and `\big` take. A dot is none */
export const DELIMITER_CHARACTERS: ReadonlyMap<string, string> = new Map([
    ["(", "("],
    [")", ")"],
    ["[", "["],
    ["]", "]"],
    ["|", "|"],
    ["/", "/"],
    ["<", "⟨"],
    [">", "⟩"],
    [".", ""],
]);

/** The delimiters `\left`, `\right`, `\middle` and `\big` take, by their command's name */
export const DELIMITER_COMMANDS: ReadonlyMap<string, string> = new Map([
    ...Object.entries(OPENING),
    ...Object.entries(CLOSING),
    ["{", "{"],
    ["}", "}"],
    ["|", "‖"],
    ...Object.entries({
        vert: "|",
        Vert: "‖",
        backslash: "\\",
        uparrow: "↑",
        downarrow: "↓",
        updownarrow: "↕",
        Uparrow: "⇑",
        Downarrow: "⇓",
        Updownarrow: "⇕",
    }),
]);

/** Relations with a line through them, for `\not`: the character Unicode has for each */
export const NEGATIONS: ReadonlyMap<string, string> = new Map([
    ["=", "≠"],
    ["<", "≮"],
    [">", "≯"],
    ["≤", "≰"],
    ["≥", "≱"],
    ["≡", "≢"],
    ["∼", "≁"],
    ["≃", "≄"],
    ["≈", "≉"],
    ["≅", "≇"],
    ["∈", "∉"],
    ["∋", "∌"],
    ["⊂", "⊄"],
    ["⊃", "⊅"],
    ["⊆", "⊈"],
    ["⊇", "⊉"],
    ["∣", "∤"],
    ["∥", "∦"],
    ["≺", "⊀"],
    ["≻", "⊁"],
    ["⊢", "⊬"],
    ["⊨", "⊭"],
    ["∃", "∄"],
    ["→", "↛"],
    ["←", "↚"],
    ["↔", "↮"],
    ["⇒", "⇏"],
    ["⇐", "⇍"],
    ["⇔", "⇎"],
]);

/** Spaces, by their command's name */
export const SPACES: ReadonlyMap<string, string> = new Map([
    [",", "\u2009"],
    ["thinspace", "\u2009"],
    [":", "\u2005"],
    [">", "\u2005"],
    ["medspace", "\u2005"],
    [";", "\u2004"],
    ["thickspace", "\u2004"],
    [" ", "\u2004"],
    ["space", "\u2004"],
    ["enspace", "\u2002"],
    ["quad", "\u2003"],
    ["qquad", "\u2003\u2003"],
    // Negative spaces, which Word has no way to write
    ["!", ""],
    ["negthinspace", ""],
    ["negmedspace", ""],
    ["negthickspace", ""],
]);

/** Functions, which LaTeX writes upright with a thin space after them */
export const FUNCTIONS: Readonly<Record<string, string>> = {
    arccos: "arccos",
    arcsin: "arcsin",
    arctan: "arctan",
    arg: "arg",
    cos: "cos",
    cosh: "cosh",
    cot: "cot",
    coth: "coth",
    csc: "csc",
    deg: "deg",
    dim: "dim",
    exp: "exp",
    hom: "hom",
    ker: "ker",
    lg: "lg",
    ln: "ln",
    log: "log",
    sec: "sec",
    sin: "sin",
    sinh: "sinh",
    tan: "tan",
    tanh: "tanh",
};

/** Functions whose limits go below them in a display, such as lim with x → 0 below it */
export const FUNCTIONS_WITH_LIMITS: Readonly<Record<string, string>> = {
    det: "det",
    gcd: "gcd",
    inf: "inf",
    lim: "lim",
    liminf: "lim\u2009inf",
    limsup: "lim\u2009sup",
    max: "max",
    min: "min",
    Pr: "Pr",
    sup: "sup",
};

/** Large operators, by their command's name */
export const LARGE_OPERATOR_COMMANDS: Readonly<Record<string, MathLargeOperatorName>> = {
    sum: "sum",
    prod: "product",
    coprod: "coproduct",
    bigcup: "union",
    bigcap: "intersection",
    bigsqcup: "squareUnion",
    biguplus: "multisetUnion",
    bigvee: "logicalOr",
    bigwedge: "logicalAnd",
    bigoplus: "directSum",
    bigotimes: "tensorProduct",
    bigodot: "circledDot",
    int: "integral",
    iint: "doubleIntegral",
    iiint: "tripleIntegral",
    iiiint: "quadrupleIntegral",
    oint: "contourIntegral",
    oiint: "surfaceIntegral",
    oiiint: "volumeIntegral",
};

/** Accents, by their command's name */
export const ACCENT_COMMANDS: Readonly<Record<string, MathAccentName>> = {
    hat: "hat",
    widehat: "hat",
    check: "check",
    widecheck: "check",
    tilde: "tilde",
    widetilde: "tilde",
    acute: "acute",
    grave: "grave",
    dot: "dot",
    ddot: "doubleDot",
    dddot: "tripleDot",
    breve: "breve",
    bar: "bar",
    mathring: "ring",
    vec: "rightArrow",
    overrightarrow: "rightArrow",
    overleftarrow: "leftArrow",
    overleftrightarrow: "leftRightArrow",
    overrightharpoon: "rightHarpoon",
    overleftharpoon: "leftHarpoon",
};

/** Braces over and under math, by their command's name */
export const BRACE_COMMANDS: Readonly<Record<string, { readonly brace: MathBraceShape; readonly position: "above" | "below" }>> = {
    overbrace: { brace: "curly", position: "above" },
    underbrace: { brace: "curly", position: "below" },
    overbracket: { brace: "square", position: "above" },
    underbracket: { brace: "square", position: "below" },
    overparen: { brace: "round", position: "above" },
    underparen: { brace: "round", position: "below" },
};

/** Arrows that stretch to fit text above and below them, by their command's name */
export const EXTENSIBLE_ARROWS: Readonly<Record<string, string>> = {
    xrightarrow: "→",
    xleftarrow: "←",
    xleftrightarrow: "↔",
    xRightarrow: "⇒",
    xLeftarrow: "⇐",
    xLeftrightarrow: "⇔",
    xmapsto: "↦",
    xhookrightarrow: "↪",
    xhookleftarrow: "↩",
    xrightharpoonup: "⇀",
    xrightleftharpoons: "⇌",
};
/* cspell:enable */
