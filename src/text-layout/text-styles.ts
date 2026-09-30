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

import type { LineSpacing, ParagraphFormat, TabStopSetting, TextFont, TextSpan } from "./text-width";

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
    readonly basedOn?: string;
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
        size: scaled(numberOf(attributesOf(find(children, "w:sz"))["w:val"]), 2),
        bold: onOff(children, "w:b"),
        allCaps: onOff(children, "w:caps"),
        smallCaps: onOff(children, "w:smallCaps"),
        hidden: onOff(children, "w:vanish"),
        characterSpacing: scaled(numberOf(attributesOf(find(children, "w:spacing"))["w:val"]), TWIPS_PER_POINT),
        scale: numberOf(attributesOf(find(children, "w:w"))["w:val"]),
    });
};

const readLineSpacing = (spacing: XmlObject): LineSpacing | undefined => {
    const line = numberOf(spacing["w:line"]);
    if (line === undefined) {
        return undefined;
    }
    const rule = spacing["w:lineRule"];
    return rule === "exact" || rule === "atLeast"
        ? { rule, height: line / TWIPS_PER_POINT }
        : { rule: "multiple", multiple: line / SINGLE_LINE };
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
                  position: (numberOf(attributes["w:pos"]) ?? 0) / TWIPS_PER_POINT,
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
        scaled(
            names.map((name) => numberOf(indent[name])).find((value) => value !== undefined),
            TWIPS_PER_POINT,
        );
    const hanging = twips("w:hanging");
    return withoutUndefined({
        spaceBefore: scaled(numberOf(spacing["w:before"]), TWIPS_PER_POINT),
        spaceAfter: scaled(numberOf(spacing["w:after"]), TWIPS_PER_POINT),
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
    });
};

/**
 * Reads the fonts of a document's theme (`a:theme`), once it is formatted.
 */
const readThemeFonts = (xml: XmlObject): ThemeFonts => {
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
            return {
                id: stringOf(attributes["w:styleId"]),
                isDefault: attributes["w:default"] !== undefined && !isOff(attributes["w:default"]),
                definition: {
                    // A style without a type is a paragraph style, as Styles takes it
                    type: stringOf(attributes["w:type"]) ?? "paragraph",
                    basedOn: valueOf(children, "w:basedOn"),
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
    };
};

/**
 * Reads the margins of a table's cells (`w:tblCellMar`), or of one cell (`w:tcMar`), in points.
 */
export const readCellMargins = (element: unknown): CellMargins => {
    const children = childrenOf(element);
    const side = (...names: readonly string[]): number | undefined =>
        names
            .map((name) => scaled(numberOf(attributesOf(find(children, name))["w:w"]), TWIPS_PER_POINT))
            .find((value) => value !== undefined);
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
export const fontOf = ({ font, size, bold, characterSpacing, scale }: RunFormat): TextFont =>
    withoutUndefined({ font, size, bold, characterSpacing, scale });

/**
 * A span of text in its formatting: capitals for all caps, and smaller capitals for the small letters of small caps.
 */
export const spansOf = (text: string, format: RunFormat): readonly TextSpan[] => {
    const { allCaps, smallCaps, hidden } = format;
    const font = fontOf(format);
    if (hidden) {
        return [];
    }
    if (allCaps || !smallCaps) {
        return [{ ...font, text: allCaps ? text.toUpperCase() : text }];
    }
    const small = { ...font, size: (font.size ?? 10) * SMALL_CAPS_SCALE };
    return text
        .split(/(\p{Ll}+)/u)
        .filter((part) => part.length > 0)
        .map((part) => (/^\p{Ll}/u.test(part) ? { ...small, text: part.toUpperCase() } : { ...font, text: part }));
};

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
