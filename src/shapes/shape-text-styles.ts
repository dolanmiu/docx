/**
 * Reads the formatting that decides how much room a shape's text takes up: the document's default font and paragraph
 * spacing, its paragraph and character styles, and the formatting of each paragraph and run. Not part of the public API.
 *
 * Formatting is combined as Word combines it: the document's defaults, then the paragraph's style and the styles it is
 * based on, then the run's character style and the styles it is based on, then the paragraph's or run's own formatting.
 *
 * @module
 */
import { ExternalHyperlink, type IContext, type Paragraph, Run, TextRun, XmlComponent } from "docx";

import type { LineSpacing, ParagraphFormat, TextFont, TextParagraph, TextSpan } from "./text-metrics";

type XmlObject = Readonly<Record<string, unknown>>;

/**
 * Run formatting that changes how much room text takes up.
 */
type RunFormat = Omit<TextFont, "size"> & {
    /** Size in points */
    readonly size?: number;
    readonly allCaps?: boolean;
    readonly smallCaps?: boolean;
    /** Hidden text takes up no room */
    readonly hidden?: boolean;
};

type StyleDefinition = {
    readonly type?: string;
    readonly basedOn?: string;
    readonly run: RunFormat;
    readonly paragraph: ParagraphFormat;
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
};

/**
 * No styles: text is measured in Word's own defaults, 10pt Times New Roman with single spacing.
 */
export const WORD_DEFAULT_STYLES: TextStyles = { run: {}, paragraph: {}, styles: new Map() };

// Small capitals are drawn as capitals at 80% of the size of the text, as LibreOffice draws them
const SMALL_CAPS_SCALE = 0.8;
const TWIPS_PER_POINT = 20;
// Single line spacing, in 240ths of a line
const SINGLE_LINE = 240;

/**
 * A context for formatting parts of the document to read them. Formatting paragraph properties that refer to a
 * numbering adds the numbering to the document, so this context's document leaves it out.
 */
const READING_CONTEXT = {
    stack: [],
    file: { Numbering: { createConcreteNumberingInstance: (): void => undefined } },
} as unknown as IContext;

// XmlComponent keeps its children in a protected array. Reading them doesn't change them
const componentChildren = (component: XmlComponent): readonly unknown[] =>
    (component as unknown as { readonly root: readonly unknown[] }).root;

const isObject = (value: unknown): value is XmlObject => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The children of an element in a formatted tree. An element with children is an array, and one without is an object.
 */
const childrenOf = (element: unknown): readonly XmlObject[] => (Array.isArray(element) ? element.filter(isObject) : []);

const attributesOf = (element: unknown): XmlObject => {
    const holder = Array.isArray(element) ? element.find((child) => isObject(child) && "_attr" in child) : element;
    return isObject(holder) && isObject(holder._attr) ? holder._attr : {};
};

const find = (children: readonly XmlObject[], name: string): unknown => children.find((child) => name in child)?.[name];

// Attributes are numbers when the library writes them, and strings when they come from an imported document
const numberOf = (value: unknown): number | undefined => {
    const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : undefined;
};

const stringOf = (value: unknown): string | undefined => (typeof value === "string" && value.length > 0 ? value : undefined);

const scaled = (value: number | undefined, divisor: number): number | undefined => (value === undefined ? undefined : value / divisor);

const isOff = (value: unknown): boolean => value === false || value === 0 || value === "false" || value === "0" || value === "off";

/**
 * An on/off property, such as `w:b`: on when present, unless its value says otherwise.
 */
const onOff = (children: readonly XmlObject[], name: string): boolean | undefined => {
    const element = children.find((child) => name in child);
    return element ? !isOff(attributesOf(element[name])["w:val"]) : undefined;
};

const withoutUndefined = <T extends object>(object: T): T =>
    Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined)) as T;

/**
 * Combines formatting, with later formatting overriding earlier formatting.
 */
const combine = <T extends object>(formats: readonly T[]): T =>
    formats.reduce((all, format) => ({ ...all, ...withoutUndefined(format) }), {} as T);

/**
 * Reads run properties (`w:rPr`). Fonts given by the document theme (`w:asciiTheme`) are left out: the library doesn't
 * write a theme.
 */
const readRunFormat = (element: unknown): RunFormat => {
    const children = childrenOf(element);
    const fonts = attributesOf(find(children, "w:rFonts"));
    return withoutUndefined({
        font: stringOf(fonts["w:ascii"]) ?? stringOf(fonts["w:hAnsi"]),
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

/**
 * Reads paragraph properties (`w:pPr`).
 */
const readParagraphFormat = (element: unknown): ParagraphFormat => {
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
    });
};

const valueOf = (children: readonly XmlObject[], name: string): string | undefined => stringOf(attributesOf(find(children, name))["w:val"]);

/**
 * Reads the document's defaults and styles from its styles part (`w:styles`), once it is formatted.
 */
export const readTextStyles = (xml: XmlObject): TextStyles => {
    const root = childrenOf(xml["w:styles"]);
    // A document given styles of its own can have two sets of defaults: the library's, then the document's
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
                    type: stringOf(attributes["w:type"]),
                    basedOn: valueOf(children, "w:basedOn"),
                    run: readRunFormat(find(children, "w:rPr")),
                    paragraph: readParagraphFormat(find(children, "w:pPr")),
                },
            };
        })
        .filter((style): style is typeof style & { readonly id: string } => style.id !== undefined);
    const defaultStyle = (type: string): string | undefined =>
        styles.find((style) => style.isDefault && style.definition.type === type)?.id;
    const byId = new Map(styles.map((style) => [style.id, style.definition] as const));

    return {
        run: combine(defaults.map((children) => readRunFormat(find(childrenOf(find(children, "w:rPrDefault")), "w:rPr")))),
        paragraph: combine(defaults.map((children) => readParagraphFormat(find(childrenOf(find(children, "w:pPrDefault")), "w:pPr")))),
        styles: byId,
        // Word uses "Normal" for paragraphs when no paragraph style is marked as the default
        defaultParagraphStyle: defaultStyle("paragraph") ?? (byId.get("Normal")?.type === "paragraph" ? "Normal" : undefined),
        defaultCharacterStyle: defaultStyle("character"),
    };
};

const stylesRead = new WeakMap<object, TextStyles>();

/**
 * The styles of the document being written, or Word's defaults when the context has no document.
 */
export const getTextStyles = (context: IContext): TextStyles => {
    const styles = (context as Partial<IContext>).file?.Styles;
    if (!styles) {
        return WORD_DEFAULT_STYLES;
    }
    const read = stylesRead.get(styles) ?? readTextStyles(styles.prepForXml(READING_CONTEXT) as XmlObject);
    stylesRead.set(styles, read);
    return read;
};

/**
 * A style and the styles it is based on, from the one at the bottom to the style itself. A style that isn't of the
 * given type, or that is based on itself, ends the chain.
 */
const styleChain = ({ styles }: TextStyles, id: string | undefined, type: string): readonly StyleDefinition[] => {
    const walk = (current: string | undefined, seen: ReadonlySet<string>): readonly StyleDefinition[] => {
        const style = current === undefined || seen.has(current) ? undefined : styles.get(current);
        return style?.type === type ? [...walk(style.basedOn, new Set([...seen, current!])), style] : [];
    };
    return walk(id, new Set());
};

/**
 * The text of a run, with tabs as `"\t"` and line breaks as `"\n"`, and its own formatting and character style.
 */
const readRun = (run: TextRun): { readonly text: string; readonly format: RunFormat; readonly style?: string } => {
    // Formatting a run needs no document, as long as it has no fields or other parts that refer to one
    const xml = run.prepForXml(READING_CONTEXT) as { readonly "w:r": readonly XmlObject[] };
    const children = xml["w:r"];
    const properties = find(children, "w:rPr");
    const text = children
        .map((child) => {
            if ("w:t" in child) {
                return (child["w:t"] as readonly unknown[]).filter((part) => typeof part === "string").join("");
            }
            if ("w:tab" in child) {
                return "\t";
            }
            return "w:br" in child || "w:cr" in child ? "\n" : "";
        })
        .join("");
    return { text, format: readRunFormat(properties), style: valueOf(childrenOf(properties), "w:rStyle") };
};

/**
 * The text runs in a paragraph, including those in hyperlinks. Pictures, shapes and other runs without text are left out.
 */
const runsIn = (children: readonly unknown[]): readonly TextRun[] =>
    children.flatMap((child): readonly TextRun[] => {
        if (child instanceof TextRun) {
            return [child];
        }
        if (child instanceof ExternalHyperlink) {
            return runsIn(child.options.children);
        }
        return child instanceof XmlComponent && !(child instanceof Run) ? runsIn(componentChildren(child)) : [];
    });

/**
 * The parts of run formatting that change the font text is measured in.
 */
const fontOf = ({ font, size, bold, characterSpacing, scale }: RunFormat): TextFont =>
    withoutUndefined({ font, size, bold, characterSpacing, scale });

/**
 * A span of text in its formatting: capitals for all caps, and smaller capitals for the small letters of small caps.
 */
const spansOf = (text: string, format: RunFormat): readonly TextSpan[] => {
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
 * Reads a paragraph's text and formatting, as the document's styles format it.
 */
const readParagraph = (paragraph: Paragraph, styles: TextStyles): TextParagraph => {
    // A paragraph's properties come first. They format to nothing when the paragraph has none
    const [properties, ...children] = componentChildren(paragraph) as readonly XmlComponent[];
    const propertyChildren = childrenOf((properties.prepForXml(READING_CONTEXT) as XmlObject | undefined)?.["w:pPr"]);
    const style = valueOf(propertyChildren, "w:pStyle") ?? styles.defaultParagraphStyle;
    const paragraphStyles = styleChain(styles, style, "paragraph");
    const paragraphRun = combine([styles.run, ...paragraphStyles.map(({ run }) => run)]);

    const spans = runsIn(children).flatMap((run) => {
        const { text, format, style: runStyle } = readRun(run);
        const characterStyles = styleChain(styles, runStyle ?? styles.defaultCharacterStyle, "character");
        return spansOf(text, combine([paragraphRun, ...characterStyles.map(({ run: styleRun }) => styleRun), format]));
    });
    return {
        spans,
        font: fontOf(combine([paragraphRun, readRunFormat(find(propertyChildren, "w:rPr"))])),
        format: combine([
            styles.paragraph,
            ...paragraphStyles.map(({ paragraph: format }) => format),
            readParagraphFormat(propertyChildren),
        ]),
        style,
    };
};

/**
 * Reads the text and formatting of a shape's paragraphs, as the document's styles format them.
 */
export const readTextParagraphs = (paragraphs: readonly Paragraph[], styles: TextStyles): readonly TextParagraph[] =>
    paragraphs.map((paragraph) => readParagraph(paragraph, styles));

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
