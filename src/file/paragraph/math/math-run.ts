/**
 * Math Run module for Office MathML.
 *
 * This module provides the MathRun class for text content within math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_r-1.html
 *
 * @module
 */
// cspell:ignore mathbb mathbf mathfrak mathrm mathsf mathtt
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { MathText } from "./math-text";

/**
 * How a {@link MathRun}'s letters are drawn (`m:sty`):
 *
 * - `"plain"`: upright, as LaTeX's `\mathrm`;
 * - `"bold"`: bold and upright, as `\mathbf`;
 * - `"italic"`: italic, as `\mathit`;
 * - `"boldItalic"`: bold and italic, as `\boldsymbol`.
 *
 * Word draws letters in italic, and digits and capital Greek letters upright, unless a run has a style. A run in an
 * alphabet other than roman is plain unless given a style, as LaTeX draws its alphabets upright.
 */
export type MathRunStyle = "plain" | "bold" | "italic" | "boldItalic";

/**
 * The alphabet a {@link MathRun}'s letters are drawn in (`m:scr`):
 *
 * - `"roman"`: the math font's own letters, as Word draws them unless a run has an alphabet;
 * - `"script"`: 𝒜, as LaTeX's `\mathcal` and `\mathscr`;
 * - `"fraktur"`: 𝔄, as `\mathfrak`;
 * - `"doubleStruck"`: 𝔸, as `\mathbb`, for sets such as ℝ;
 * - `"sansSerif"`: 𝖠, as `\mathsf`;
 * - `"monospace"`: 𝙰, as `\mathtt`.
 */
export type MathRunScript = "roman" | "script" | "fraktur" | "doubleStruck" | "sansSerif" | "monospace";

/**
 * Options for a {@link MathRun}.
 */
export type MathRunOptions = {
    /** The text */
    readonly text: string;
    /**
     * Writes the text as ordinary text rather than math, as Word's "Normal Text" button does (`m:nor`): upright and in
     * the document's font, with its spaces kept. For words in an equation, such as "if" and "otherwise" in cases. It
     * can't be given with `style` or `script`, which are for math.
     * @default false
     */
    readonly normalText?: boolean;
    /**
     * How the letters are drawn: plain (upright), bold, italic or both (`m:sty`).
     * @default "plain" with a `script` other than roman, as LaTeX draws its alphabets upright; otherwise none, and Word
     * draws letters in italic
     */
    readonly style?: MathRunStyle;
    /**
     * The alphabet the letters are drawn in, such as double-struck for ℝ (`m:scr`).
     */
    readonly script?: MathRunScript;
    /**
     * Takes the text as it is (`m:lit`), rather than as something Word builds up or lines up, such as an `&` in a
     * `MathEquationArray`, which would otherwise be a point the rows line up at.
     * @default false
     */
    readonly literal?: boolean;
};

const STYLES: Readonly<Record<MathRunStyle, string>> = { plain: "p", bold: "b", italic: "i", boldItalic: "bi" };

const SCRIPTS: Readonly<Record<MathRunScript, string>> = {
    roman: "roman",
    script: "script",
    fraktur: "fraktur",
    doubleStruck: "double-struck",
    sansSerif: "sans-serif",
    monospace: "monospace",
};

const createValueElement = (name: string, value: string | number): XmlComponent =>
    new BuilderElement<{ readonly value: string | number }>({ name, attributes: { value: { key: "m:val", value } } });

/**
 * Represents a run of text within a math equation.
 *
 * MathRun is the container for text content in Office MathML,
 * similar to how Run contains text in regular paragraphs.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_r-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_R">
 *   <xsd:sequence>
 *     <xsd:element name="rPr" type="CT_RPR" minOccurs="0"/>
 *     <xsd:group ref="EG_ScriptStyle" minOccurs="0"/>
 *     <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *       <xsd:element ref="w:br"/>
 *       <xsd:element name="t" type="CT_Text"/>
 *     </xsd:choice>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new MathRun("x + y");
 * new MathRun({ text: "if ", normalText: true });
 * new MathRun({ text: "R", script: "doubleStruck" });
 * new MathRun({ text: "d", style: "plain" });
 * ```
 */
export class MathRun extends XmlComponent {
    public constructor(options: string | MathRunOptions) {
        super("m:r");

        const { text, normalText, script, literal, ...rest } = typeof options === "string" ? { text: options } : options;
        // Word draws a run with no style in italic, even in another alphabet, which would make sansSerif italic
        const style = rest.style ?? (script === undefined || script === "roman" ? undefined : "plain");

        if (normalText && (style !== undefined || script !== undefined)) {
            throw new Error("MathRun: normalText can't be given with style or script, which are for math. Give one or the other");
        }
        if (style !== undefined && !Object.keys(STYLES).includes(style)) {
            throw new Error(`MathRun: style is "${style}", which isn't one of ${Object.keys(STYLES).join(", ")}`);
        }
        if (script !== undefined && !Object.keys(SCRIPTS).includes(script)) {
            throw new Error(`MathRun: script is "${script}", which isn't one of ${Object.keys(SCRIPTS).join(", ")}`);
        }

        // In the schema's order: m:lit, then m:nor or m:scr and m:sty
        const properties = [
            ...(literal ? [createValueElement("m:lit", 1)] : []),
            ...(normalText ? [createValueElement("m:nor", 1)] : []),
            ...(script === undefined ? [] : [createValueElement("m:scr", SCRIPTS[script])]),
            ...(style === undefined ? [] : [createValueElement("m:sty", STYLES[style])]),
        ];
        if (properties.length > 0) {
            this.root.push(new BuilderElement({ name: "m:rPr", children: properties }));
        }

        this.root.push(new MathText(text));
    }
}
