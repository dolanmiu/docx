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
    type LineSpacing,
    type ParagraphAlignment,
    type ParagraphFormat,
    type TabStopSetting,
    type TextFont,
    type TextSpan,
    isEastAsianFont,
} from "./text-width";

export type XmlObject = Readonly<Record<string, unknown>>;

/**
 * Run formatting that changes how much room text takes up.
 */
export type RunFormat = Omit<TextFont, "size"> & {
    /** Size in points */
    readonly size?: number;
    readonly allCaps?: boolean;
    readonly smallCaps?: boolean;
    /** Hidden text takes up no room */
    readonly hidden?: boolean;
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
    /** The margins a table style gives its cells */
    readonly cellMargins?: CellMargins;
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
    /** Why a length in the styles can't be read as Word reads it, when one can't */
    readonly unsupported?: string;
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

// Small capitals are drawn as capitals at 80% of the size of the text, as LibreOffice draws them
const SMALL_CAPS_SCALE = 0.8;
export const TWIPS_PER_POINT = 20;
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
 * A run's size (`w:sz`, or `w:szCs` for complex scripts) in points, from half-points, or from points, which Word rounds down to a half-point:
 * "11.75pt" is 11.5. Word ignores a size in inches, centimeters or millimeters, as if it had none (word-units2).
 */
const sizeOf = (value: unknown): number | undefined => {
    const unit = typeof value === "string" ? MEASURE.exec(value)?.[4] : undefined;
    return unit === undefined || unit === "pt" ? pointsOf(value, 2) : undefined;
};

/**
 * Why how Word reads a length in formatted XML isn't known, when it isn't: a size in picas, which Word's PDFs didn't
 * tell from one it ignores, or in another unit but points, which they showed it ignores only with no style giving a
 * size, and a negative length of a fraction of a centimeter or millimeter, whose minus sign and rounding together they
 * didn't show. Undefined when every length's reading is known.
 */
export const unknownLengthIn = (element: unknown, name = ""): string | undefined => {
    if (Array.isArray(element)) {
        return element.reduce<string | undefined>((found, child) => found ?? unknownLengthIn(child, name), undefined);
    }
    if (!isObject(element)) {
        return undefined;
    }
    return Object.entries(element).reduce<string | undefined>((found, [key, child]) => {
        if (found !== undefined || key !== "_attr") {
            return found ?? unknownLengthIn(child, key);
        }
        return Object.values(child as XmlObject).reduce<string | undefined>((reason, value) => {
            const measure = typeof value === "string" ? MEASURE.exec(value) : null;
            if (reason !== undefined || !measure) {
                return reason;
            }
            const [, minus, , fraction, unit] = measure;
            return (name === "w:sz" || name === "w:szCs") && unit !== "pt"
                ? "a size given in a unit other than points"
                : minus && fraction && METRIC.has(unit)
                  ? "a negative length of a fraction of a centimeter or millimeter"
                  : undefined;
        }, undefined);
    }, undefined);
};

export const isOff = (value: unknown): boolean => value === false || value === 0 || value === "false" || value === "0" || value === "off";

/**
 * An on/off property, such as `w:b`: on when present, unless its value says otherwise.
 */
export const onOff = (children: readonly XmlObject[], name: string): boolean | undefined => {
    const element = children.find((child) => name in child);
    return element ? !isOff(attributesOf(element[name])["w:val"]) : undefined;
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
 * Reads paragraph properties (`w:pPr`).
 */
export const readParagraphFormat = (element: unknown): ParagraphFormat => {
    const children = childrenOf(element);
    const spacing = attributesOf(find(children, "w:spacing"));
    const indent = attributesOf(find(children, "w:ind"));
    const twips = (...names: readonly string[]): number | undefined =>
        names.map((name) => pointsOf(indent[name], TWIPS_PER_POINT)).find((value) => value !== undefined);
    const hanging = twips("w:hanging");
    return withoutUndefined({
        spaceBefore: pointsOf(spacing["w:before"], TWIPS_PER_POINT),
        spaceAfter: pointsOf(spacing["w:after"], TWIPS_PER_POINT),
        lineSpacing: readLineSpacing(spacing),
        indentLeft: twips("w:start", "w:left"),
        indentRight: twips("w:end", "w:right"),
        firstLineIndent: hanging === undefined ? twips("w:firstLine") : -hanging,
        contextualSpacing: onOff(children, "w:contextualSpacing"),
        keepNext: onOff(children, "w:keepNext"),
        keepLines: onOff(children, "w:keepLines"),
        pageBreakBefore: onOff(children, "w:pageBreakBefore"),
        widowControl: onOff(children, "w:widowControl"),
        tabs: readTabs(find(children, "w:tabs")),
        kinsoku: onOff(children, "w:kinsoku"),
        wordWrap: onOff(children, "w:wordWrap"),
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
            const numbering = childrenOf(find(childrenOf(find(children, "w:pPr")), "w:numPr"));
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
                    ...(attributes["w:type"] === "table"
                        ? { cellMargins: readCellMargins(find(childrenOf(find(children, "w:tblPr")), "w:tblCellMar")) }
                        : {}),
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
        ...withoutUndefined({ unsupported: unknownLengthIn(xml) }),
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
 * The parts of run formatting that change the font text is measured in.
 */
export const fontOf = ({ font, size, bold, italic, characterSpacing, scale }: RunFormat): TextFont =>
    withoutUndefined({ font, size, bold, italic, characterSpacing, scale });

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
    const font = fontOf(format);
    if (slot === "latin") {
        return font;
    }
    const { eastAsiaFont, complexScriptFont, complexScriptSize, complexScriptBold, complexScriptItalic } = format;
    return slot === "eastAsian"
        ? { ...font, font: isEastAsianFont(eastAsiaFont) ? eastAsiaFont : FALLBACK_EAST_ASIAN_FONT }
        : withoutUndefined({
              ...font,
              font: complexScriptFont,
              size: complexScriptSize,
              bold: complexScriptBold,
              italic: complexScriptItalic,
          });
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
        const small = { ...font, size: (font.size ?? 10) * SMALL_CAPS_SCALE };
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
