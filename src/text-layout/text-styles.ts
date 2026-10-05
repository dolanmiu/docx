/**
 * Reads the formatting that decides how much room text takes up: the document's default font and paragraph spacing, its
 * paragraph and character styles, and the formatting of each paragraph and run, from formatted XML. Not part of the public
 * API: docx/shapes and docx/layout each bundle it.
 *
 * Formatting is combined as Word combines it: the document's defaults, then the paragraph's style and the styles it is
 * based on, then the run's character style and the styles it is based on, then the paragraph's or run's own formatting.
 *
 * @module
 */
import type { IContext } from "docx";

import { isEastAsian, kinsokuLanguageOf } from "./line-break-rules";
import {
    DEFAULT_FONT_SIZE,
    type Ligatures,
    type LineSpacing,
    type ParagraphAlignment,
    type ParagraphBorder,
    type ParagraphFormat,
    type TabStopSetting,
    type TextBorder,
    type TextFont,
    type TextSpan,
    isEastAsianFont,
} from "./text-width";

export type XmlObject = Readonly<Record<string, unknown>>;

/**
 * Run formatting that changes how much room text takes up.
 */
export type RunFormat = Omit<TextFont, "size" | "lineSize" | "raise" | "border" | "emphasis" | "snapToGrid"> & {
    /** Size in points */
    readonly size?: number;
    readonly allCaps?: boolean;
    readonly smallCaps?: boolean;
    /** Superscript or subscript (`w:vertAlign`), drawn smaller than the run's size, or "baseline" where a style's is turned off */
    readonly verticalAlign?: "baseline" | "superscript" | "subscript";
    /** How far the run is raised (`w:position`), in points, or lowered when it is negative */
    readonly position?: number;
    /** The marks over or under each character (`w:em`): "dot", "comma", "circle" or "underDot", or "none" */
    readonly emphasisMark?: string;
    /** The border around the run (`w:bdr`), written as a paragraph's are, which takes room beside it and above and below it */
    readonly border?: ParagraphBorder;
    /** Hidden text takes up no room */
    readonly hidden?: boolean;
    /** Whether the run is laid out on the characters of its section's document grid (`w:snapToGrid`). Default is on */
    readonly snapToGrid?: boolean;
    /** The font of Chinese, Japanese and Korean text (`w:eastAsia`) */
    readonly eastAsiaFont?: string;
    /**
     * The font, size in points, boldness and italics of complex scripts, such as Arabic, Hebrew and Thai (`w:cs`, `w:szCs`,
     * `w:bCs`, `w:iCs`)
     */
    readonly complexScriptFont?: string;
    readonly complexScriptSize?: number;
    readonly complexScriptBold?: boolean;
    readonly complexScriptItalic?: boolean;
    /** Whether the run is right to left (`w:rtl`), or of a complex script (`w:cs`), so all of it is in the complex script's formatting */
    readonly rightToLeft?: boolean;
    readonly complexScript?: boolean;
    /** The East Asian language of the run (`w:lang w:eastAsia`), which decides which characters can't start or end a line */
    readonly eastAsianLanguage?: string;
    /**
     * The language of the run's other text (`w:lang w:val`), by whose dictionary Word hyphenates its words, and which parts
     * kerned runs, or runs with ligatures, from runs of other languages
     */
    readonly language?: string;
    /** Whether the run isn't checked for spelling and grammar (`w:noProof`), which Word doesn't hyphenate */
    readonly noProof?: boolean;
    /**
     * The other OpenType features Word draws the font with, beside its ligatures, which change the widths of its glyphs:
     * the form and spacing of its numbers (`w14:numForm`, `w14:numSpacing`) when they aren't the font's own, its stylistic
     * sets (`w14:stylisticSets`) and contextual alternates (`w14:cntxtAlts`)
     */
    readonly numberForm?: string;
    readonly numberSpacing?: string;
    readonly stylisticSets?: boolean;
    readonly contextualAlternates?: boolean;
};

/**
 * The fonts for Latin text of the document theme's fonts for headings and body text.
 */
export type ThemeFonts = {
    readonly headings: string;
    readonly body: string;
};

// Office's, which a document's theme has unless the document gives others
const OFFICE_THEME_FONTS: ThemeFonts = { headings: "Calibri Light", body: "Calibri" };

/**
 * The margins of a table's cells, or of one cell, in points.
 */
export type CellMargins = Partial<Record<"top" | "bottom" | "left" | "right", number>>;

/**
 * A part of a table style's formatting that applies to some of a table's cells, such as those of its first row
 * (`w:tblStylePr`): its paragraph and run formatting, and its table, row and cell properties, as they are written.
 */
export type ConditionalFormat = {
    readonly run: RunFormat;
    readonly paragraph: ParagraphFormat;
    readonly tableProperties: readonly XmlObject[];
    readonly rowProperties: readonly XmlObject[];
    readonly cellProperties: readonly XmlObject[];
};

type StyleDefinition = {
    readonly type: string;
    /** Its name, such as "heading 1", by which Word finds its built-in styles */
    readonly name?: string;
    readonly basedOn?: string;
    /**
     * The list a paragraph style numbers its paragraphs in, and the level, when it gives either (`w:numPr`). A style
     * based on another takes what it doesn't give from it
     */
    readonly numbering?: { readonly id?: string; readonly level?: number };
    readonly run: RunFormat;
    readonly paragraph: ParagraphFormat;
    /** The text frame a paragraph style puts its paragraphs in (`w:framePr`), as it is written, when it gives one */
    readonly frame?: unknown;
    /** The margins a table style gives its cells */
    readonly cellMargins?: CellMargins;
    /**
     * A table style's table, row and cell properties (`w:tblPr`, `w:trPr`, `w:tcPr`), as they are written, and the parts
     * of its formatting for some of the cells, by their type (`w:tblStylePr`), such as "firstRow"
     */
    readonly tableProperties?: readonly XmlObject[];
    readonly rowProperties?: readonly XmlObject[];
    readonly cellProperties?: readonly XmlObject[];
    readonly conditional?: ReadonlyMap<string, ConditionalFormat>;
};

/**
 * The document's default formatting and its paragraph and character styles.
 */
export type TextStyles = {
    /** The document's default run formatting (`w:rPrDefault`) */
    readonly run: RunFormat;
    /** The document's default paragraph formatting (`w:pPrDefault`) */
    readonly paragraph: ParagraphFormat;
    readonly styles: ReadonlyMap<string, StyleDefinition>;
    /** The style of paragraphs that don't give one, usually "Normal" */
    readonly defaultParagraphStyle?: string;
    /** The style of runs that don't give one */
    readonly defaultCharacterStyle?: string;
    /** The style of tables that don't give one, usually "TableNormal" */
    readonly defaultTableStyle?: string;
    /** The theme's fonts, for text in them */
    readonly themeFonts: ThemeFonts;
};

/**
 * Word's own defaults: 10pt Times New Roman with single spacing, Office's theme, and a Normal paragraph style with no
 * formatting as the default, as `docx` writes it.
 */
export const WORD_DEFAULT_STYLES: TextStyles = {
    run: {},
    paragraph: {},
    styles: new Map([["Normal", { type: "paragraph", run: {}, paragraph: {} }]]),
    defaultParagraphStyle: "Normal",
    themeFonts: OFFICE_THEME_FONTS,
};

// Small capitals are drawn as capitals at 80% of the size of the text, to the nearest half-point: 9 points at 11, and 16
// at 20 (scripts/layout-probes/word-watertight-text.ts TX4), and 9.5 at 12, 10.5 at 13 and 5.5 at 7, in Times New Roman,
// Arial and Cambria too, and 80% of superscript's size in superscript (word-run-formatting.ts RF4)
const SMALL_CAPS_SCALE = 0.8;
// Superscript and subscript are drawn at 65% of the size of the text, to the nearest half-point: 7 points at 11, and 13
// at 20 (TX1), in Times New Roman, Arial, Cambria and Courier New too (scripts/layout-probes/word-run-formatting.ts RF1).
// It is the fonts' own size for them: Calibri, Cambria, Arial and Times New Roman each give 1331 of 2048
const SCRIPT_SCALE = 0.65;
export const TWIPS_PER_POINT = 20;
// A border's width is in eighths of a point
const EIGHTHS_PER_POINT = 8;
// Single line spacing, in 240ths of a line
const SINGLE_LINE = 240;

/**
 * A context for formatting parts of the document to read them. Formatting paragraph properties that refer to a
 * numbering adds the numbering to the document, so this context's document leaves it out.
 */
export const READING_CONTEXT = {
    stack: [],
    file: { Numbering: { createConcreteNumberingInstance: (): void => undefined } },
} as unknown as IContext;

export const isObject = (value: unknown): value is XmlObject => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The children of an element in a formatted tree. An element with children is an array, and one without is an object.
 */
export const childrenOf = (element: unknown): readonly XmlObject[] => (Array.isArray(element) ? element.filter(isObject) : []);

export const attributesOf = (element: unknown): XmlObject => {
    const holder = Array.isArray(element) ? element.find((child) => isObject(child) && "_attr" in child) : element;
    return isObject(holder) && isObject(holder._attr) ? holder._attr : {};
};

export const find = (children: readonly XmlObject[], name: string): unknown => children.find((child) => name in child)?.[name];

// Attributes are numbers when the library writes them, and strings when they come from an imported document
export const numberOf = (value: unknown): number | undefined => {
    const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : undefined;
};

export const stringOf = (value: unknown): string | undefined => (typeof value === "string" && value.length > 0 ? value : undefined);

const scaled = (value: number | undefined, divisor: number): number | undefined => (value === undefined ? undefined : value / divisor);

// Points in each unit of OOXML's universal measure (`ST_UniversalMeasure`), in which docx writes a length given as a
// string, such as "1in" or "12pt"
const POINTS_PER_UNIT: Readonly<Record<string, number>> = { mm: 72 / 25.4, cm: 72 / 2.54, in: 72, pt: 1, pc: 12, pi: 12 };
const METRIC = new Set(["mm", "cm"]);
// A universal measure, as the schema writes it: a minus sign, a whole number, a fraction and a unit
const MEASURE = /^\s*(-?)(\d+)(\.\d+)?(mm|cm|in|pt|pc|pi)\s*$/;
// Allows for a length that comes to a whole number of its attribute's unit being a little less in floating point
const ROUNDING = 1e-9;

/**
 * A length in points, from an attribute in its own unit, `perPoint` of which make a point (20 for twips, 2 for
 * half-points), or in a unit of OOXML's universal measure, such as "1in", "2.5cm" or "12pt", as the schema allows for
 * every length docx writes from a string.
 *
 * Word reads a universal measure as a whole number of the attribute's unit (word-units and word-units2): rounded down
 * from inches, points and picas, so "240.7pt" is 4814 twips, and to the nearest from centimeters and millimeters, so
 * "84.67724mm" (4800.6 twips) is 4801. Its minus sign is the whole number's only, and the fraction is added to it:
 * "-10.7pt" is -10 points and 0.7 more, -186 twips, and "-0.16708in" is 240 twips.
 */
export const pointsOf = (value: unknown, perPoint: number): number | undefined => {
    const measure = typeof value === "string" ? MEASURE.exec(value) : null;
    if (!measure) {
        return scaled(numberOf(value), perPoint);
    }
    const [, minus, whole, fraction = "", unit] = measure;
    const amount = (minus ? -Number(whole) : Number(whole)) + Number(`0${fraction}`);
    const inUnits = amount * POINTS_PER_UNIT[unit] * perPoint;
    return (METRIC.has(unit) ? Math.round(inUnits) : Math.floor(inUnits + ROUNDING)) / perPoint;
};

/**
 * A run's size (`w:sz`, or `w:szCs` for complex scripts) in points, from half-points, or from a length in any unit, which
 * Word rounds down to a half-point, with or without a style that gives a size: "11.75pt" is 11.5, "0.4in" 28.5, "1cm" and
 * "10mm" 28, and "0.3cm" 8.5, as it reads centimeters and millimeters to the nearest twip first (word-units2.ts V3,
 * scripts/layout-probes/stops2/word-stops-text.ts RF27a to RF27c, word-stops-text2.ts RF27d to RF27g)
 */
const sizeOf = (value: unknown): number | undefined => {
    const unit = typeof value === "string" ? MEASURE.exec(value)?.[4] : undefined;
    return unit === undefined || !METRIC.has(unit) ? pointsOf(value, 2) : Math.floor(pointsOf(value, 20)! * 2 + ROUNDING) / 2;
};

export const isOff = (value: unknown): boolean => value === false || value === 0 || value === "false" || value === "0" || value === "off";

/**
 * An on/off property, such as `w:b`: on when present, unless its value says otherwise.
 */
export const onOff = (children: readonly XmlObject[], name: string): boolean | undefined => {
    const element = children.find((child) => name in child);
    return element ? !isOff(attributesOf(element[name])["w:val"]) : undefined;
};

/** An on/off property of Word 2010's (`w14`), such as `w14:cntxtAlts`, whose value is `w14:val` */
const onOff14 = (children: readonly XmlObject[], name: string): boolean | undefined => {
    const element = children.find((child) => name in child);
    return element ? !isOff(attributesOf(element[name])["w14:val"]) : undefined;
};

export const withoutUndefined = <T extends object>(object: T): T =>
    Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as T;

/**
 * Combines formatting, with later formatting overriding earlier formatting.
 */
export const combine = <T extends object>(formats: readonly T[]): T =>
    formats.reduce((all, format) => ({ ...all, ...withoutUndefined(format) }), {} as T);

export const valueOf = (children: readonly XmlObject[], name: string): string | undefined =>
    stringOf(attributesOf(find(children, name))["w:val"]);

/**
 * The font a theme font refers to: `majorHAnsi` and the other major fonts are the theme's font for headings, and the
 * minor fonts its font for body text.
 */
const themeFontOf = (theme: unknown, themeFonts: ThemeFonts): string | undefined => {
    if (typeof theme !== "string") {
        return undefined;
    }
    if (theme.startsWith("major")) {
        return themeFonts.headings;
    }
    return theme.startsWith("minor") ? themeFonts.body : undefined;
};

const readVerticalAlign = (value: string | undefined): RunFormat["verticalAlign"] =>
    value === "superscript" || value === "subscript" ? value : value === undefined ? undefined : "baseline";

/**
 * Reads run properties (`w:rPr`). A font of the theme (`w:asciiTheme`) takes the place of the font named beside it.
 */
export const readRunFormat = (element: unknown, themeFonts: ThemeFonts): RunFormat => {
    const children = childrenOf(element);
    const fonts = attributesOf(find(children, "w:rFonts"));
    return withoutUndefined({
        font:
            themeFontOf(fonts["w:asciiTheme"], themeFonts) ??
            stringOf(fonts["w:ascii"]) ??
            themeFontOf(fonts["w:hAnsiTheme"], themeFonts) ??
            stringOf(fonts["w:hAnsi"]),
        size: sizeOf(attributesOf(find(children, "w:sz"))["w:val"]),
        bold: onOff(children, "w:b"),
        italic: onOff(children, "w:i"),
        // The size kerning starts at is a size too (`ST_HpsMeasure`), read as Word reads a run's
        kerning: sizeOf(attributesOf(find(children, "w:kern"))["w:val"]),
        allCaps: onOff(children, "w:caps"),
        smallCaps: onOff(children, "w:smallCaps"),
        hidden: onOff(children, "w:vanish"),
        characterSpacing: pointsOf(attributesOf(find(children, "w:spacing"))["w:val"], TWIPS_PER_POINT),
        scale: numberOf(attributesOf(find(children, "w:w"))["w:val"]),
        eastAsiaFont: themeFontOf(fonts["w:eastAsiaTheme"], themeFonts) ?? stringOf(fonts["w:eastAsia"]),
        complexScriptFont: themeFontOf(fonts["w:cstheme"], themeFonts) ?? stringOf(fonts["w:cs"]),
        complexScriptSize: sizeOf(attributesOf(find(children, "w:szCs"))["w:val"]),
        complexScriptBold: onOff(children, "w:bCs"),
        complexScriptItalic: onOff(children, "w:iCs"),
        rightToLeft: onOff(children, "w:rtl"),
        complexScript: onOff(children, "w:cs"),
        eastAsianLanguage: stringOf(attributesOf(find(children, "w:lang"))["w:eastAsia"]),
        language: stringOf(attributesOf(find(children, "w:lang"))["w:val"]),
        noProof: onOff(children, "w:noProof"),
        ligatures: stringOf(attributesOf(find(children, "w14:ligatures"))["w14:val"]) as Ligatures | undefined,
        numberForm: stringOf(attributesOf(find(children, "w14:numForm"))["w14:val"]),
        numberSpacing: stringOf(attributesOf(find(children, "w14:numSpacing"))["w14:val"]),
        stylisticSets:
            find(children, "w14:stylisticSets") === undefined ? undefined : childrenOf(find(children, "w14:stylisticSets")).length > 0,
        contextualAlternates: onOff14(children, "w14:cntxtAlts"),
        verticalAlign: readVerticalAlign(valueOf(children, "w:vertAlign")),
        position: pointsOf(attributesOf(find(children, "w:position"))["w:val"], 2),
        emphasisMark: valueOf(children, "w:em"),
        border: readBorder(find(children, "w:bdr")),
        snapToGrid: onOff(children, "w:snapToGrid"),
    });
};

const readLineSpacing = (spacing: XmlObject): LineSpacing | undefined => {
    const line = pointsOf(spacing["w:line"], TWIPS_PER_POINT);
    if (line === undefined) {
        return undefined;
    }
    const rule = spacing["w:lineRule"];
    return rule === "exact" || rule === "atLeast"
        ? { rule, height: line }
        : { rule: "multiple", multiple: (line * TWIPS_PER_POINT) / SINGLE_LINE };
};

const TAB_ALIGNMENTS: Readonly<Record<string, TabStopSetting["alignment"]>> = {
    left: "left",
    start: "left",
    right: "right",
    end: "right",
    center: "center",
    decimal: "decimal",
    bar: "bar",
    clear: "clear",
    // A list's tab stop, which Word writes for lists made in old versions
    num: "left",
};

// `start` and `end` are the left and right of a left-to-right paragraph, and `left` and `right` stay there in a
// right-to-left one, which lines its lines up the other way but breaks them in the same places. A list's tab (`numTab`)
// lines up as the start
const ALIGNMENTS: Readonly<Record<string, ParagraphAlignment>> = {
    start: "left",
    left: "left",
    numTab: "left",
    center: "center",
    end: "right",
    right: "right",
    both: "justified",
    distribute: "distributed",
    lowKashida: "lowKashida",
    mediumKashida: "mediumKashida",
    highKashida: "highKashida",
    thaiDistribute: "thaiDistributed",
};

/**
 * Reads the tab stops of paragraph properties (`w:tabs`).
 */
const readTabs = (element: unknown): readonly TabStopSetting[] | undefined => {
    const tabs = childrenOf(element).filter((child) => "w:tab" in child);
    return tabs.length === 0
        ? undefined
        : tabs.map((tab) => {
              const attributes = attributesOf(tab["w:tab"]);
              return {
                  position: pointsOf(attributes["w:pos"], TWIPS_PER_POINT) ?? 0,
                  alignment: TAB_ALIGNMENTS[String(attributes["w:val"])] ?? "left",
              };
          });
};

/**
 * Reads a border of a paragraph (`w:pBdr`), on one side, or of a run (`w:bdr`).
 */
const readBorder = (element: unknown): ParagraphBorder | undefined => {
    if (element === undefined) {
        return undefined;
    }
    const attributes = attributesOf(element);
    const on = (name: string): boolean => attributes[name] !== undefined && !isOff(attributes[name]);
    return withoutUndefined({
        style: stringOf(attributes["w:val"]) ?? "none",
        size: numberOf(attributes["w:sz"]),
        space: numberOf(attributes["w:space"]) ?? 0,
        shadow: on("w:shadow"),
        frame: on("w:frame"),
        key: JSON.stringify(
            Object.entries(attributes)
                .map(([name, value]) => [name, String(value)])
                .sort(([a], [b]) => (a < b ? -1 : 1)),
        ),
    });
};

/**
 * Reads paragraph properties (`w:pPr`).
 */
export const readParagraphFormat = (element: unknown): ParagraphFormat => {
    const children = childrenOf(element);
    const spacing = attributesOf(find(children, "w:spacing"));
    const indent = attributesOf(find(children, "w:ind"));
    const borders = childrenOf(find(children, "w:pBdr"));
    const twips = (...names: readonly string[]): number | undefined =>
        names.map((name) => pointsOf(indent[name], TWIPS_PER_POINT)).find((value) => value !== undefined);
    const chars = (...names: readonly string[]): number | undefined =>
        names.map((name) => numberOf(indent[name])).find((value) => value !== undefined);
    const automatic = (name: string): boolean | undefined => (spacing[name] === undefined ? undefined : !isOff(spacing[name]));
    const border = (...names: readonly string[]): ParagraphBorder | undefined =>
        names.map((name) => readBorder(find(borders, name))).find((value) => value !== undefined);
    const hanging = twips("w:hanging");
    const hangingChars = chars("w:hangingChars");
    return withoutUndefined({
        spaceBefore: pointsOf(spacing["w:before"], TWIPS_PER_POINT),
        spaceAfter: pointsOf(spacing["w:after"], TWIPS_PER_POINT),
        spaceBeforeLines: numberOf(spacing["w:beforeLines"]),
        spaceAfterLines: numberOf(spacing["w:afterLines"]),
        autoSpaceBefore: automatic("w:beforeAutospacing"),
        autoSpaceAfter: automatic("w:afterAutospacing"),
        lineSpacing: readLineSpacing(spacing),
        indentLeft: twips("w:start", "w:left"),
        indentRight: twips("w:end", "w:right"),
        firstLineIndent: hanging === undefined ? twips("w:firstLine") : -hanging,
        indentLeftChars: chars("w:startChars", "w:leftChars"),
        indentRightChars: chars("w:endChars", "w:rightChars"),
        firstLineChars: hangingChars === undefined ? chars("w:firstLineChars") : -hangingChars,
        borderTop: border("w:top"),
        borderBottom: border("w:bottom"),
        borderLeft: border("w:start", "w:left"),
        borderRight: border("w:end", "w:right"),
        borderBetween: border("w:between"),
        borderBar: border("w:bar"),
        contextualSpacing: onOff(children, "w:contextualSpacing"),
        keepNext: onOff(children, "w:keepNext"),
        keepLines: onOff(children, "w:keepLines"),
        pageBreakBefore: onOff(children, "w:pageBreakBefore"),
        widowControl: onOff(children, "w:widowControl"),
        tabs: readTabs(find(children, "w:tabs")),
        kinsoku: onOff(children, "w:kinsoku"),
        wordWrap: onOff(children, "w:wordWrap"),
        suppressAutoHyphens: onOff(children, "w:suppressAutoHyphens"),
        snapToGrid: onOff(children, "w:snapToGrid"),
        alignment: ALIGNMENTS[valueOf(children, "w:jc") ?? ""],
    });
};

/**
 * Reads the fonts of a document's theme (`a:theme`), once it is formatted.
 */
export const readThemeFonts = (xml: XmlObject): ThemeFonts => {
    const elements = childrenOf(find(childrenOf(xml["a:theme"]), "a:themeElements"));
    const scheme = childrenOf(find(elements, "a:fontScheme"));
    // Every font of a theme has a font for Latin text
    const latin = (name: string): string => attributesOf(find(childrenOf(find(scheme, name)), "a:latin")).typeface as string;
    return { headings: latin("a:majorFont"), body: latin("a:minorFont") };
};

/**
 * Reads what a table style (`w:style` of type "table") gives its tables beyond paragraph and run formatting: the margins
 * of their cells, its table, row and cell properties, and the parts of its formatting for some of their cells.
 */
const readTableStyle = (
    children: readonly XmlObject[],
    themeFonts: ThemeFonts,
): Pick<StyleDefinition, "cellMargins" | "tableProperties" | "rowProperties" | "cellProperties" | "conditional"> => {
    const tableProperties = childrenOf(find(children, "w:tblPr"));
    return {
        cellMargins: readCellMargins(find(tableProperties, "w:tblCellMar")),
        tableProperties,
        rowProperties: childrenOf(find(children, "w:trPr")),
        cellProperties: childrenOf(find(children, "w:tcPr")),
        conditional: new Map(
            children
                .filter((child) => "w:tblStylePr" in child)
                .map((child) => {
                    const parts = childrenOf(child["w:tblStylePr"]);
                    return [
                        String(attributesOf(child["w:tblStylePr"])["w:type"]),
                        {
                            run: readRunFormat(find(parts, "w:rPr"), themeFonts),
                            paragraph: readParagraphFormat(find(parts, "w:pPr")),
                            tableProperties: childrenOf(find(parts, "w:tblPr")),
                            rowProperties: childrenOf(find(parts, "w:trPr")),
                            cellProperties: childrenOf(find(parts, "w:tcPr")),
                        },
                    ] as const;
                }),
        ),
    };
};

/**
 * Reads the document's defaults and styles from its styles part (`w:styles`), once it is formatted, with the fonts of
 * its theme.
 */
export const readTextStyles = (xml: XmlObject, themeFonts: ThemeFonts = OFFICE_THEME_FONTS): TextStyles => {
    const root = childrenOf(xml["w:styles"]);
    // Styles writes one set of defaults: the library's, or those of the styles a document is given
    const defaults = root.filter((child) => "w:docDefaults" in child).map((child) => childrenOf(child["w:docDefaults"]));
    const styles = root
        .filter((child) => "w:style" in child)
        .map((child) => {
            const children = childrenOf(child["w:style"]);
            const attributes = attributesOf(child["w:style"]);
            const paragraphProperties = childrenOf(find(children, "w:pPr"));
            const numbering = childrenOf(find(paragraphProperties, "w:numPr"));
            const frame = find(paragraphProperties, "w:framePr");
            const list = attributesOf(find(numbering, "w:numId"))["w:val"];
            const level = numberOf(attributesOf(find(numbering, "w:ilvl"))["w:val"]);
            const name = valueOf(children, "w:name");
            return {
                id: stringOf(attributes["w:styleId"]),
                isDefault: attributes["w:default"] !== undefined && !isOff(attributes["w:default"]),
                definition: {
                    // A style without a type is a paragraph style, as Styles takes it
                    type: stringOf(attributes["w:type"]) ?? "paragraph",
                    ...(name === undefined ? {} : { name }),
                    basedOn: valueOf(children, "w:basedOn"),
                    ...(list === undefined && level === undefined
                        ? {}
                        : { numbering: withoutUndefined({ id: list === undefined ? undefined : String(list), level }) }),
                    run: readRunFormat(find(children, "w:rPr"), themeFonts),
                    paragraph: readParagraphFormat(find(children, "w:pPr")),
                    ...(frame === undefined ? {} : { frame }),
                    ...(attributes["w:type"] === "table" ? readTableStyle(children, themeFonts) : {}),
                },
            };
        })
        .filter((style): style is typeof style & { readonly id: string } => style.id !== undefined);
    const defaultStyle = (type: string): string | undefined =>
        styles.find((style) => style.isDefault && style.definition.type === type)?.id;
    const byId = new Map(styles.map((style) => [style.id, style.definition] as const));

    return {
        run: combine(defaults.map((children) => readRunFormat(find(childrenOf(find(children, "w:rPrDefault")), "w:rPr"), themeFonts))),
        paragraph: combine(defaults.map((children) => readParagraphFormat(find(childrenOf(find(children, "w:pPrDefault")), "w:pPr")))),
        styles: byId,
        // Styles marks Normal as the default when no paragraph style is, as Word takes it
        defaultParagraphStyle: defaultStyle("paragraph"),
        defaultCharacterStyle: defaultStyle("character"),
        defaultTableStyle: defaultStyle("table"),
        themeFonts,
    };
};

/**
 * Reads the margins of a table's cells (`w:tblCellMar`), or of one cell (`w:tcMar`), in points.
 */
export const readCellMargins = (element: unknown): CellMargins => {
    const children = childrenOf(element);
    const side = (...names: readonly string[]): number | undefined =>
        names.map((name) => pointsOf(attributesOf(find(children, name))["w:w"], TWIPS_PER_POINT)).find((value) => value !== undefined);
    return Object.fromEntries(
        Object.entries({
            top: side("w:top"),
            bottom: side("w:bottom"),
            left: side("w:start", "w:left"),
            right: side("w:end", "w:right"),
        }).filter(([, value]) => value !== undefined),
    );
};

const stylesRead = new WeakMap<object, TextStyles>();

/**
 * The styles of the document being written, with the fonts of its theme, or Word's defaults when the context has no
 * document.
 */
export const getTextStyles = (context: IContext): TextStyles => {
    const { file } = context as Partial<IContext>;
    const styles = file?.Styles;
    if (!styles) {
        return WORD_DEFAULT_STYLES;
    }
    const read =
        stylesRead.get(styles) ??
        readTextStyles(
            styles.prepForXml(READING_CONTEXT) as XmlObject,
            readThemeFonts(file.Theme.prepForXml(READING_CONTEXT) as XmlObject),
        );
    stylesRead.set(styles, read);
    return read;
};

/**
 * A style and the styles it is based on, from the one at the bottom to the style itself. A style that isn't of the
 * given type, or that is based on itself, ends the chain.
 */
export const styleChain = ({ styles }: TextStyles, id: string | undefined, type: string): readonly StyleDefinition[] => {
    const walk = (current: string | undefined, seen: ReadonlySet<string>): readonly StyleDefinition[] => {
        const style = current === undefined || seen.has(current) ? undefined : styles.get(current);
        return style?.type === type ? [...walk(style.basedOn, new Set([...seen, current!])), style] : [];
    };
    return walk(id, new Set());
};

/**
 * A share of a size in points, to the nearest half-point, and down from a quarter, as Word draws superscript and small
 * capitals: superscript is 3 points at 5, 9.5 at 15 and 16 at 25 (scripts/layout-probes/word-run-formatting.ts RF1)
 */
const nearestHalfPoint = (size: number, share: number): number => Math.ceil(size * 2 * share - 0.5 - ROUNDING) / 2;

/**
 * Text in superscript or subscript, drawn smaller, in a line of its own size: a superscript or subscript doesn't make a line
 * of its size taller, though Word raises its top above the line's (scripts/layout-probes/word-watertight-text.ts TX1a)
 */
const scripted = (font: TextFont, { verticalAlign }: RunFormat): TextFont => {
    if (verticalAlign !== "superscript" && verticalAlign !== "subscript") {
        return font;
    }
    const size = font.size ?? DEFAULT_FONT_SIZE;
    return { ...font, size: nearestHalfPoint(size, SCRIPT_SCALE), lineSize: size };
};

// The room each style of border takes as Word draws it, in eighths of a point, from the width it is given, at 6 and 18
// eighths (`word-paragraph-formats.docx` B6), and round a run at 4 eighths, and 6 for waves
// (scripts/layout-probes/word-run-formatting2.ts RF12). Lines of one stroke are as wide as they are given, a double line
// 3 times and a triple 5, waves and dash-dot strokes are as wide whatever they are given, and lines thin and thick with a
// small gap 12 or 24 eighths more, which Word was seen to draw only from 4 eighths to 18. Those with a medium or large gap
// take what they take beside a table's cells, where Word drew them from 4 eighths to 24 (`word-table-formats.docx` BS),
// as it did a thin, thick and thin line with a large gap around a paragraph at 24 (`word-stops-text.docx` PB4b)
export const BORDER_WIDTHS: Readonly<Record<string, (size: number) => number | undefined>> = {
    ...Object.fromEntries(
        ["single", "thick", "dotted", "dashed", "dotDash", "dotDotDash", "dashSmallGap", "inset", "outset"].map((style) => [
            style,
            (size: number) => size,
        ]),
    ),
    double: (size) => 3 * size,
    triple: (size) => 5 * size,
    wave: () => 24,
    dashDotStroked: () => 24,
    doubleWave: () => 42,
    ...Object.fromEntries(
        (
            [
                ["thinThickSmallGap", 12],
                ["thickThinSmallGap", 12],
                ["threeDEmboss", 12],
                ["threeDEngrave", 12],
                ["thinThickThinSmallGap", 24],
            ] as const
        ).map(([style, more]) => [style, (size: number) => (size >= 4 && size <= 18 ? size + more : undefined)]),
    ),
    ...Object.fromEntries(
        (
            [
                ["thinThickMediumGap", 2, 0],
                ["thickThinMediumGap", 2, 0],
                ["thinThickThinMediumGap", 3, 0],
                ["thinThickLargeGap", 1, 18],
                ["thickThinLargeGap", 1, 18],
                ["thinThickThinLargeGap", 2, 24],
            ] as const
        ).map(([style, times, more]) => [style, (size: number) => (size >= 4 && size <= 24 ? times * size + more : undefined)]),
    ),
};
// The narrowest and widest borders Word draws, in eighths of a point, and the furthest from the text, in points
export const NARROWEST_BORDER = 2;
export const WIDEST_BORDER = 96;
export const FURTHEST_BORDER = 31;

// The schema's borders of lines (`ST_Border`), each with its width above; the rest of its borders are art borders, but for
// "custom"
const LINE_BORDERS = new Set(["nil", "none", ...Object.keys(BORDER_WIDTHS), "custom"]);
// The widest art border, in points
export const WIDEST_ART_BORDER = 31;

/** Whether a style of border is an art border's, of pictures, whose size is in points, rather than a line's */
export const isArtBorder = (style: string): boolean => !LINE_BORDERS.has(style);
// Widths of a run's border, in eighths of a point, seen at one size only past those of its style Word drew beside a table's
// cells: thickThinLargeGap of 4.5 points 6.75 wide, as those make it (scripts/layout-probes/stops2/word-stops-text.ts
// RF25b). Word drew thinThickThinMediumGap of 3 points 9 points wide in a run, as beside a table's cells too (RF25a)
const SEEN_RUN_BORDERS: Readonly<Record<string, Readonly<Record<number, number>>>> = {
    thickThinLargeGap: { 36: 54 },
};

/**
 * How wide a run's border is as Word draws it, in eighths of a point: as a paragraph's of its style. A border of no style
 * ("none") takes its space still, but no width (scripts/layout-probes/word-run-formatting.ts RF7h). An art border's size
 * is in points, so apples of 12 take 12 points (scripts/layout-probes/stops2/word-stops-text.ts RF25c), and Word draws a
 * single border of an eighth of a point, and a double one of none, as given (RF25f, RF25e). A shadow doubles a single
 * line, as a paragraph's (`word-paragraph-formats.docx` B6), and one drawn as a frame is as wide: one of 1.5 points 2
 * points from the text takes 100 twips beside and above and below it with a shadow, and 70 as a frame
 * (scripts/layout-probes/stops2/word-stops-text2.ts RF24c, RF24d). Undefined when Word hasn't been seen to draw it.
 */
const runBorderWidth = ({ style, size, shadow, frame }: ParagraphBorder): number | undefined => {
    if (size === undefined) {
        return style === "none" && !shadow && !frame ? 0 : undefined;
    }
    if (shadow || frame) {
        return style === "single" && size >= NARROWEST_BORDER && size <= WIDEST_BORDER ? (shadow ? 2 : 1) * size : undefined;
    }
    if (isArtBorder(style)) {
        return size >= 1 && size <= WIDEST_ART_BORDER ? size * EIGHTHS_PER_POINT : undefined;
    }
    if ((style === "single" && size === 1) || (style === "double" && size === 0)) {
        return BORDER_WIDTHS[style](size);
    }
    return style === "none"
        ? 0
        : size < NARROWEST_BORDER || size > WIDEST_BORDER
          ? undefined
          : (BORDER_WIDTHS[style]?.(size) ?? SEEN_RUN_BORDERS[style]?.[size]);
};

/**
 * The room a run's border takes, beside the run and above and below it: its space and its width, as Word gives it room (a
 * single border of half a point 4 points away takes 90 twips on each side and above and below, RF7a). Word keeps a space
 * in five bits, so one of 40 points is 8 (RF25d). Undefined when it takes none, as one of "nil" takes none at all
 * (word-run-formatting2.ts RF12), and when how much isn't known: see {@link unknownRunFormatting}.
 */
const textBorderOf = (border: ParagraphBorder | undefined): TextBorder | undefined => {
    const width = border === undefined || border.style === "nil" ? undefined : runBorderWidth(border);
    const room = width === undefined ? 0 : width / EIGHTHS_PER_POINT + (border!.space % (FURTHEST_BORDER + 1));
    return room > 0 ? { room, key: border!.key } : undefined;
};

// Emphasis marks over the text, or under it
const EMPHASIS: Readonly<Record<string, TextFont["emphasis"]>> = { dot: "above", comma: "above", circle: "above", underDot: "below" };

const plainFontOf = ({
    font,
    size,
    bold,
    italic,
    kerning,
    ligatures,
    language,
    characterSpacing,
    scale,
    position,
    border,
    emphasisMark,
    snapToGrid,
}: RunFormat): TextFont =>
    withoutUndefined({
        font,
        size,
        bold,
        italic,
        kerning,
        ligatures: ligatures === "none" ? undefined : ligatures,
        // Only where it parts kerning and ligatures
        language: kerning !== undefined || (ligatures !== undefined && ligatures !== "none") ? language : undefined,
        characterSpacing,
        scale,
        raise: position === 0 ? undefined : position,
        border: textBorderOf(border),
        emphasis: emphasisMark === undefined ? undefined : EMPHASIS[emphasisMark],
        snapToGrid: snapToGrid === false ? false : undefined,
    });

// The number forms and spacing that are as wide as a font's own figures, in its regular face: lining tabular figures in
// Calibri and Cambria, and old-style tabular ones in Calibri (scripts/layout-probes/stops2/word-stops-kerning.ts KE7b, KE7d,
// KE7f). Their proportional figures, and Cambria's old-style tabular ones, are narrower (KE7a, KE7c, KE7e, KE7g, KE7h)
const DEFAULT_FIGURES: Readonly<Record<string, readonly string[]>> = {
    calibri: ["lining tabular", "oldStyle tabular"],
    cambria: ["lining tabular"],
};

/**
 * Why a run's formatting can't be laid out as Word lays it out, when it can't: OpenType features other than ligatures,
 * whose widths the width tables don't have, a border of a style, width or space Word hasn't been seen to draw, or of a style
 * other than single with a shadow or drawn as a frame, and emphasis marks of a kind the schema doesn't have.
 */
export const unknownRunFormatting = ({
    font,
    bold,
    italic,
    border,
    emphasisMark,
    numberForm,
    numberSpacing,
    stylisticSets,
    contextualAlternates,
}: RunFormat): string | undefined => {
    const forms = `${numberForm ?? "default"} ${numberSpacing ?? "default"}`;
    if (
        forms !== "default default" &&
        (bold === true || italic === true || !DEFAULT_FIGURES[(font ?? "").toLowerCase()]?.includes(forms))
    ) {
        return "OpenType number forms or spacing";
    }
    if (stylisticSets === true || contextualAlternates === true) {
        return "OpenType stylistic sets or contextual alternates";
    }
    if (border !== undefined && border.style !== "nil" && border.style !== "single" && (border.shadow || border.frame)) {
        return "a run border of a style other than single with a shadow or drawn as a frame";
    }
    if (border !== undefined && border.style !== "nil" && runBorderWidth(border) === undefined) {
        return "a run border of a style, width or space not yet followed";
    }
    return emphasisMark === undefined || emphasisMark === "none" || EMPHASIS[emphasisMark] !== undefined
        ? undefined
        : "emphasis marks of a kind that isn't known";
};

/**
 * The parts of run formatting that change the font text is measured in: its font, size, boldness, character spacing and
 * scale, superscript and subscript, which draw it smaller, how far it is raised, its border, and its emphasis marks.
 */
export const fontOf = (format: RunFormat): TextFont => scripted(plainFontOf(format), format);

type FontSlot = "latin" | "eastAsian" | "complex";

/**
 * Which of a run's fonts Word draws a character in: the font for complex scripts, in their size, boldness and italics, for
 * all of a run that is right to left or of a complex script; the East Asian font for Chinese, Japanese and Korean; the
 * run's font for the rest. Hebrew in a run that isn't right to left is in the run's size, as Word lays it out. A mark is
 * drawn in the font of the character it is on.
 */
const slotOf = (character: string, previous: FontSlot, complexRun: boolean): FontSlot => {
    if (complexRun) {
        return "complex";
    }
    if (isEastAsian(character)) {
        return "eastAsian";
    }
    return /\p{M}/u.test(character) ? previous : "latin";
};

// The font Word draws Chinese, Japanese and Korean in when the run's East Asian font has none, such as Calibri
const FALLBACK_EAST_ASIAN_FONT = "MS Mincho";

/**
 * The font of a character of a run, by the run's font Word draws it in. Complex scripts have their own size, boldness and
 * italics, and Word's defaults where the run doesn't give them.
 */
const fontOfSlot = (format: RunFormat, slot: FontSlot): TextFont => {
    const font = plainFontOf(format);
    if (slot === "latin") {
        return scripted(font, format);
    }
    const { eastAsiaFont, complexScriptFont, complexScriptSize, complexScriptBold, complexScriptItalic } = format;
    return scripted(
        slot === "eastAsian"
            ? { ...font, font: isEastAsianFont(eastAsiaFont) ? eastAsiaFont : FALLBACK_EAST_ASIAN_FONT }
            : withoutUndefined({
                  ...font,
                  font: complexScriptFont,
                  size: complexScriptSize,
                  bold: complexScriptBold,
                  italic: complexScriptItalic,
              }),
        format,
    );
};

/**
 * A span of text in its formatting: in the run's font for its script, capitals for all caps, and smaller capitals for the
 * small letters of small caps.
 */
export const spansOf = (text: string, format: RunFormat): readonly TextSpan[] => {
    const { allCaps, smallCaps, hidden, rightToLeft, complexScript } = format;
    if (hidden) {
        return [];
    }
    const complexRun = rightToLeft === true || complexScript === true;
    // The parts of the text in each of the run's fonts
    const parts = [...text].reduce<readonly { readonly slot: FontSlot; readonly text: string }[]>((all, character) => {
        const last = all[all.length - 1];
        const slot = slotOf(character, last?.slot ?? "latin", complexRun);
        return last?.slot === slot ? [...all.slice(0, -1), { slot, text: last.text + character }] : [...all, { slot, text: character }];
    }, []);
    return parts.flatMap(({ slot, text: part }) => {
        const font = fontOfSlot(format, slot);
        if (allCaps || !smallCaps) {
            return [{ ...font, text: allCaps ? part.toUpperCase() : part }];
        }
        // The small letters are capitals in the line of the run's size
        const size = font.size ?? DEFAULT_FONT_SIZE;
        const small = { ...font, size: nearestHalfPoint(size, SMALL_CAPS_SCALE), lineSize: font.lineSize ?? size };
        return part
            .split(/(\p{Ll}+)/u)
            .filter((piece) => piece.length > 0)
            .map((piece) => (/^\p{Ll}/u.test(piece) ? { ...small, text: piece.toUpperCase() } : { ...font, text: piece }));
    });
};

/**
 * Whether a run is East Asian, by its East Asian font or language, so its words break anywhere with word wrap off, as
 * Word breaks them.
 */
export const isEastAsianRun = ({ eastAsiaFont, eastAsianLanguage }: RunFormat): boolean =>
    isEastAsianFont(eastAsiaFont) || kinsokuLanguageOf(eastAsianLanguage) !== undefined;

/**
 * Whether a paragraph in the default style, without formatting of its own, has space before or after it.
 */
export const hasDefaultParagraphSpacing = (styles: TextStyles): boolean => {
    const { spaceBefore = 0, spaceAfter = 0 } = combine([
        styles.paragraph,
        ...styleChain(styles, styles.defaultParagraphStyle, "paragraph").map(({ paragraph }) => paragraph),
    ]);
    return spaceBefore !== 0 || spaceAfter !== 0;
};
