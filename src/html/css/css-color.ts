/**
 * CSS colours, read into their channels and written as Word writes them: `parseColor` and `toHex`.
 *
 * @module
 */
// cspell:ignore oklab oklch

/** A colour: its red, green and blue from 0 to 255 (not rounded), and its alpha from 0 to 1 */
export type CssColor = { readonly red: number; readonly green: number; readonly blue: number; readonly alpha: number };

type Vector = readonly [number, number, number];
type Matrix = readonly [Vector, Vector, Vector];

/** The units a value can be given in, each with what one of it is worth, or for `%`, what 100% is worth */
type Units = ReadonlyMap<string, number>;

/** A colour function's arguments: its channels, its alpha, and whether they were separated by commas, the legacy way */
type FunctionArguments = { readonly channels: readonly string[]; readonly alpha?: string; readonly legacy: boolean };

/** Reads a colour function's channels into sRGB from 0 to 255, or undefined if they aren't the channels it takes */
type ColorFunction = (channels: readonly string[], legacy: boolean) => Vector | undefined;

/* cspell:disable */
// Each named colour, as hex digits. transparent is the only one with an alpha
const NAMED_COLORS: ReadonlyMap<string, string> = new Map(
    Object.entries({
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "00ffff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000000",
        blanchedalmond: "ffebcd",
        blue: "0000ff",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "00ffff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "ff00ff",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "778899",
        lightslategrey: "778899",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "00ff00",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "ff00ff",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        rebeccapurple: "663399",
        red: "ff0000",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "ffffff",
        whitesmoke: "f5f5f5",
        yellow: "ffff00",
        yellowgreen: "9acd32",
        transparent: "00000000",
    }),
);
/* cspell:enable */

// The matrices of CSS Color 4's sample code, for its conversions between colour spaces
const XYZ_TO_LINEAR_SRGB: Matrix = [
    [12831 / 3959, -329 / 214, -1974 / 3959],
    [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
    [705 / 12673, -2585 / 12673, 705 / 667],
];

const LINEAR_P3_TO_XYZ: Matrix = [
    [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
    [35783 / 156275, 247089 / 357200, 198249 / 2500400],
    [0, 32229 / 714400, 5220557 / 5000800],
];

// Bradford chromatic adaptation, from lab()'s D50 white to sRGB's D65 white
const D50_TO_D65: Matrix = [
    [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
    [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
    [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
];

const OKLAB_TO_LMS: Matrix = [
    [1, 0.3963377773761749, 0.2158037573099136],
    [1, -0.1055613458156586, -0.0638541728258133],
    [1, -0.0894841775298119, -1.2914855480194092],
];

const LMS_TO_XYZ: Matrix = [
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];

const D50_WHITE_X = 0.3457 / 0.3585;
const D50_WHITE_Z = (1 - 0.3457 - 0.3585) / 0.3585;
const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;

const WHITE: CssColor = { red: 255, green: 255, blue: 255, alpha: 1 };

// A number, such as -1.5, .5 or 1e3, then its unit, if it has one
const VALUE = /^([+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn|)$/;
// A function's arguments can't have brackets of their own, as calc() and var() are left out
const FUNCTION_CALL = /^([a-z-]+)\(([^()]*)\)$/;
const HEX_DIGITS = /^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/;

const numberOrPercentage = (hundredPercent: number): Units =>
    new Map([
        ["", 1],
        ["%", hundredPercent],
    ]);

const ONE = numberOrPercentage(1);
const HUNDRED = numberOrPercentage(100);
const BYTE = numberOrPercentage(255);
const ONLY_NUMBER: Units = new Map([["", 1]]);
const ONLY_PERCENTAGE: Units = new Map([["%", 100]]);
const ONLY_PERCENTAGE_OF_BYTE: Units = new Map([["%", 255]]);
// A hue, in degrees
const HUE: Units = new Map([
    ["", 1],
    ["deg", 1],
    ["rad", 180 / Math.PI],
    ["grad", 0.9],
    ["turn", 360],
]);

/** Keeps a value from 0 to the most it can be, with NaN, which huge values can come to, as 0 */
const clamp = (value: number, most: number): number => (value > 0 ? Math.min(value, most) : 0);

const dot = ([a, b, c]: Vector, [x, y, z]: Vector): number => a * x + b * y + c * z;

const multiply = ([first, second, third]: Matrix, vector: Vector): Vector => [dot(first, vector), dot(second, vector), dot(third, vector)];

const each = ([a, b, c]: Vector, change: (value: number) => number): Vector => [change(a), change(b), change(c)];

// sRGB's transfer function, from its channels to linear light and back, extended to negative values as CSS Color 4 does
const toLinear = (value: number): number => {
    const size = Math.abs(value);
    return size <= 0.04045 ? value / 12.92 : Math.sign(value) * ((size + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (value: number): number => {
    const size = Math.abs(value);
    return size <= 0.0031308 ? value * 12.92 : Math.sign(value) * (1.055 * size ** (1 / 2.4) - 0.055);
};

const toBytes = (rgb: Vector): Vector => each(rgb, (value) => value * 255);

const fromXyz = (xyz: Vector): Vector => toBytes(each(multiply(XYZ_TO_LINEAR_SRGB, xyz), fromLinear));

const fromXyzD50 = (xyz: Vector): Vector => fromXyz(multiply(D50_TO_D65, xyz));

const fromHsl = (hue: number, saturation: number, lightness: number): Vector => {
    const degrees = ((hue % 360) + 360) % 360;
    const amount = saturation * Math.min(lightness, 1 - lightness);
    const channel = (offset: number): number => {
        const k = (offset + degrees / 30) % 12;
        return lightness - amount * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [channel(0), channel(8), channel(4)];
};

const fromHwb = (hue: number, whiteness: number, blackness: number): Vector => {
    if (whiteness + blackness >= 1) {
        const gray = whiteness / (whiteness + blackness);
        return [gray, gray, gray];
    }
    return each(fromHsl(hue, 1, 0.5), (value) => value * (1 - whiteness - blackness) + whiteness);
};

// lab() lightens with a cube root, except near black, where it is linear
const undoLabCurve = (f: number): number => (f ** 3 > LAB_EPSILON ? f ** 3 : (116 * f - 16) / LAB_KAPPA);

const fromLab = (lightness: number, a: number, b: number): Vector => {
    const y = (clamp(lightness, 100) + 16) / 116;
    return fromXyzD50([undoLabCurve(y + a / 500) * D50_WHITE_X, undoLabCurve(y), undoLabCurve(y - b / 200) * D50_WHITE_Z]);
};

const fromOklab = (lightness: number, a: number, b: number): Vector =>
    fromXyz(
        multiply(
            LMS_TO_XYZ,
            each(multiply(OKLAB_TO_LMS, [clamp(lightness, 1), a, b]), (value) => value ** 3),
        ),
    );

/** The a and b of a colour given by its chroma and hue, as lch() and oklch() give it */
const fromPolar = (chroma: number, hue: number): readonly [number, number] => {
    const angle = (hue * Math.PI) / 180;
    const length = Math.max(chroma, 0);
    return [length * Math.cos(angle), length * Math.sin(angle)];
};

/** Reads a value, such as `50%` or `0.5turn`, in the units it can be given in. `none` is 0, but not in the legacy syntax */
const readValue = (text: string, units: Units, legacy: boolean): number | undefined => {
    if (text === "none") {
        return legacy ? undefined : 0;
    }
    const [, amount, unit] = VALUE.exec(text) ?? [];
    const worth = units.get(unit);
    if (worth === undefined) {
        return undefined;
    }
    // Multiplying before dividing keeps 50% of 255 at exactly 127.5, so it rounds as browsers round it
    return unit === "%" ? (Number(amount) * worth) / 100 : Number(amount) * worth;
};

const readChannels = (texts: readonly string[], units: readonly Units[], legacy: boolean): readonly number[] | undefined => {
    if (texts.length !== units.length) {
        return undefined;
    }
    const values = units.map((unitsOfChannel, index) => readValue(texts[index], unitsOfChannel, legacy));
    return values.every((value): value is number => value !== undefined) ? values : undefined;
};

/**
 * A colour function, which reads its channels in the units given for each, then turns them into sRGB. Only the
 * functions with a legacy syntax have legacy units: some have more than one way, such as rgb(), which takes all
 * numbers or all percentages.
 */
const colorFunction =
    (
        toRgb: (channels: readonly number[]) => Vector,
        units: readonly Units[],
        legacyUnits: readonly (readonly Units[])[] = [],
    ): ColorFunction =>
    (texts: readonly string[], legacy: boolean): Vector | undefined => {
        const channels = legacy
            ? legacyUnits.map((way) => readChannels(texts, way, true)).find((read) => read !== undefined)
            : readChannels(texts, units, false);
        return channels && toRgb(channels);
    };

const RGB = colorFunction(
    ([red, green, blue]) => [red, green, blue],
    [BYTE, BYTE, BYTE],
    [
        [ONLY_NUMBER, ONLY_NUMBER, ONLY_NUMBER],
        [ONLY_PERCENTAGE_OF_BYTE, ONLY_PERCENTAGE_OF_BYTE, ONLY_PERCENTAGE_OF_BYTE],
    ],
);

// A saturation below 0 is taken as 0, as CSS Color 4 says
const HSL = colorFunction(
    ([hue, saturation, lightness]) => toBytes(fromHsl(hue, Math.max(saturation, 0) / 100, lightness / 100)),
    [HUE, HUNDRED, HUNDRED],
    [[HUE, ONLY_PERCENTAGE, ONLY_PERCENTAGE]],
);

const FUNCTIONS: ReadonlyMap<string, ColorFunction> = new Map([
    ["rgb", RGB],
    ["rgba", RGB],
    ["hsl", HSL],
    ["hsla", HSL],
    [
        "hwb",
        colorFunction(([hue, whiteness, blackness]) => toBytes(fromHwb(hue, whiteness / 100, blackness / 100)), [HUE, HUNDRED, HUNDRED]),
    ],
    ["lab", colorFunction(([lightness, a, b]) => fromLab(lightness, a, b), [HUNDRED, numberOrPercentage(125), numberOrPercentage(125)])],
    [
        "lch",
        colorFunction(([lightness, chroma, hue]) => fromLab(lightness, ...fromPolar(chroma, hue)), [HUNDRED, numberOrPercentage(150), HUE]),
    ],
    ["oklab", colorFunction(([lightness, a, b]) => fromOklab(lightness, a, b), [ONE, numberOrPercentage(0.4), numberOrPercentage(0.4)])],
    [
        "oklch",
        colorFunction(([lightness, chroma, hue]) => fromOklab(lightness, ...fromPolar(chroma, hue)), [ONE, numberOrPercentage(0.4), HUE]),
    ],
]);

const XYZ = colorFunction(([x, y, z]) => fromXyz([x, y, z]), [ONE, ONE, ONE]);

// The colour spaces color() takes, after its name
const COLOR_SPACES: ReadonlyMap<string, ColorFunction> = new Map([
    ["srgb", colorFunction(([red, green, blue]) => toBytes([red, green, blue]), [ONE, ONE, ONE])],
    ["srgb-linear", colorFunction(([red, green, blue]) => toBytes(each([red, green, blue], fromLinear)), [ONE, ONE, ONE])],
    [
        "display-p3",
        colorFunction(([red, green, blue]) => fromXyz(multiply(LINEAR_P3_TO_XYZ, each([red, green, blue], toLinear))), [ONE, ONE, ONE]),
    ],
    ["xyz", XYZ],
    ["xyz-d65", XYZ],
    ["xyz-d50", colorFunction(([x, y, z]) => fromXyzD50([x, y, z]), [ONE, ONE, ONE])],
]);

// Colours outside sRGB, such as the most vivid in display-p3 or oklch(), are clipped to it channel by channel, rather
// than gamut mapped as CSS Color 4 suggests. It's simpler, and the same for every colour sRGB has
const colorOf = ([red, green, blue]: Vector, alpha: number): CssColor => ({
    red: clamp(red, 255),
    green: clamp(green, 255),
    blue: clamp(blue, 255),
    alpha: clamp(alpha, 1),
});

const parseHex = (digits: string): CssColor | undefined => {
    if (!HEX_DIGITS.test(digits)) {
        return undefined;
    }
    // #f80 is short for #ff8800
    const long = digits.length < 6 ? [...digits].map((digit) => digit.repeat(2)).join("") : digits;
    const [red, green, blue, alpha = 255] = Array.from({ length: long.length / 2 }, (_, index) =>
        parseInt(long.slice(index * 2, index * 2 + 2), 16),
    );
    return colorOf([red, green, blue], alpha / 255);
};

const argumentsOf = (body: string): FunctionArguments | undefined => {
    if (body.includes(",")) {
        const parts = body.split(",").map((part) => part.trim());
        return parts.length <= 4 ? { channels: parts.slice(0, 3), alpha: parts[3], legacy: true } : undefined;
    }
    const [channels, alpha, ...more] = body.split("/");
    return more.length === 0 ? { channels: channels.trim().split(/\s+/), alpha: alpha?.trim(), legacy: false } : undefined;
};

const parseFunction = (name: string, body: string): CssColor | undefined => {
    const parsed = argumentsOf(body);
    if (parsed === undefined) {
        return undefined;
    }
    const { channels, alpha = "1", legacy } = parsed;
    // color() names its colour space first, as in color(display-p3 1 0 0)
    const [space, ...spaceChannels] = channels;
    const rgb = name === "color" ? COLOR_SPACES.get(space)?.(spaceChannels, legacy) : FUNCTIONS.get(name)?.(channels, legacy);
    const opacity = readValue(alpha, ONE, legacy);
    return rgb && opacity !== undefined ? colorOf(rgb, opacity) : undefined;
};

/**
 * Reads a CSS colour value, as CSS Color 4 writes it: hex such as `#f80` or `#ff880080`, `rgb()`, `rgba()`, `hsl()`,
 * `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()` in sRGB, linear sRGB, Display P3 or XYZ, the
 * 148 named colours, and `transparent`. Case and the whitespace around it don't matter.
 *
 * Colours outside sRGB are clipped to it.
 *
 * @param value - The value, such as `"rgb(255 128 0 / 50%)"`
 * @returns The colour, `"currentcolor"` for the `currentcolor` keyword in any case, or undefined for anything it
 * doesn't read as a colour, including `inherit`, `initial`, `unset`, `var(...)`, `color-mix(...)` and system colours
 *
 * @example
 * ```typescript
 * parseColor("hsl(30 100% 50%)"); // { red: 255, green: 127.5, blue: 0, alpha: 1 }
 * ```
 */
export const parseColor = (value: string): CssColor | "currentcolor" | undefined => {
    const text = value.trim().toLowerCase();
    if (text === "currentcolor") {
        return "currentcolor";
    }
    const hex = text.startsWith("#") ? text.slice(1) : NAMED_COLORS.get(text);
    if (hex !== undefined) {
        return parseHex(hex);
    }
    const call = FUNCTION_CALL.exec(text);
    return call ? parseFunction(call[1], call[2]) : undefined;
};

/**
 * The colour as Word writes it: six uppercase hex digits with no `#`, such as `"FF8000"`.
 *
 * A partly transparent colour is blended over the background, as Word's text and shading have no transparency.
 *
 * @param color - The colour
 * @param background - What the colour is blended over if it's partly transparent, taken as opaque. White, unless given
 * @returns The hex digits, or undefined for a fully transparent colour (alpha 0), which has none
 *
 * @example
 * ```typescript
 * toHex({ red: 255, green: 0, blue: 0, alpha: 0.5 }); // "FF8080"
 * ```
 */
export const toHex = ({ red, green, blue, alpha }: CssColor, background: CssColor = WHITE): string | undefined => {
    if (alpha <= 0) {
        return undefined;
    }
    const blend = (front: number, back: number): string =>
        Math.round(clamp(alpha * front + (1 - alpha) * back, 255))
            .toString(16)
            .padStart(2, "0");
    return `${blend(red, background.red)}${blend(green, background.green)}${blend(blue, background.blue)}`.toUpperCase();
};
