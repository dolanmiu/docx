/**
 * VML text path module for WordprocessingML documents.
 *
 * A text path renders text along, or stretched into, the geometry of a shape. It is
 * the mechanism behind WordArt and text watermarks.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/textpath.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

import { type VmlTrueFalse, vmlTrueFalse } from "./vml-values";

/**
 * CSS-like styling for the text rendered by a text path.
 */
export type VmlTextPathStyle = {
    /** Font family, e.g. `Calibri`. Quoted automatically. */
    readonly fontFamily?: string;
    /** Font size in points. Word uses `1` to mean automatic sizing to the shape. */
    readonly fontSize?: number;
    /** Font weight. */
    readonly fontWeight?: "normal" | "bold";
    /** Font style. */
    readonly fontStyle?: "normal" | "italic";
    /** Horizontal alignment of the text within the shape. */
    readonly textAlign?: "left" | "center" | "right" | "justify" | "letter-justify" | "stretch-justify";
    /** Whether lowercase letters are drawn at the same height as uppercase letters. */
    readonly sameLetterHeights?: boolean;
};

/**
 * Formats a VmlTextPathStyle object into the CSS-like string used by the text path `style` attribute.
 *
 * @param style - The style to format
 * @returns The formatted style, or undefined when no properties were set
 *
 * @example
 * ```typescript
 * formatVmlTextPathStyle({ fontFamily: "Calibri", fontSize: 1 });
 * // 'font-family:"Calibri";font-size:1pt'
 * ```
 */
export const formatVmlTextPathStyle = ({
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    textAlign,
    sameLetterHeights,
}: VmlTextPathStyle = {}): string | undefined => {
    const properties = [
        fontFamily === undefined ? undefined : `font-family:"${fontFamily}"`,
        fontSize === undefined ? undefined : `font-size:${fontSize}pt`,
        fontWeight === undefined ? undefined : `font-weight:${fontWeight}`,
        fontStyle === undefined ? undefined : `font-style:${fontStyle}`,
        textAlign === undefined ? undefined : `v-text-align:${textAlign}`,
        sameLetterHeights === undefined ? undefined : `v-same-letter-heights:${vmlTrueFalse(sameLetterHeights)}`,
    ].filter((property) => property !== undefined);

    return properties.length ? properties.join(";") : undefined;
};

/**
 * Options for creating a VML text path.
 */
export type IVmlTextPathOptions = {
    /** Whether the text path is displayed. */
    readonly on?: boolean;
    /** Whether the text is stretched to fill the shape's bounding box. */
    readonly fitShape?: boolean;
    /** Whether the text is stretched to fill the length of the path. */
    readonly fitPath?: boolean;
    /** Whether extra space at the ends of the path is removed. */
    readonly trim?: boolean;
    /** Whether the text is drawn along a straight path regardless of the shape's path. */
    readonly xScale?: boolean;
    /** The text to render. */
    readonly text?: string;
    /** Styling for the rendered text. */
    readonly style?: VmlTextPathStyle;
};

type VmlTextPathAttributes = {
    readonly on?: VmlTrueFalse;
    readonly fitShape?: VmlTrueFalse;
    readonly fitPath?: VmlTrueFalse;
    readonly trim?: VmlTrueFalse;
    readonly xScale?: VmlTrueFalse;
    readonly style?: string;
    readonly text?: string;
};

/**
 * Creates a VML text path element.
 *
 * The VML text path element (v:textpath) renders text using the geometry of its
 * parent shape. On a shape type it declares that shapes of that type carry text; on
 * a shape it supplies the actual text and its styling.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_TextPath">
 *   <xsd:attributeGroup ref="AG_Id"/>
 *   <xsd:attributeGroup ref="AG_Style"/>
 *   <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="fitshape" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="fitpath" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="trim" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="xscale" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="string" type="xsd:string" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the text path
 * @returns An XmlComponent representing the v:textpath element
 *
 * @example
 * ```typescript
 * createVmlTextPath({ text: "DRAFT", style: { fontFamily: "Calibri", fontSize: 1 } });
 * // <v:textpath style="font-family:&quot;Calibri&quot;;font-size:1pt" string="DRAFT"/>
 * ```
 */
export const createVmlTextPath = ({ on, fitShape, fitPath, trim, xScale, text, style }: IVmlTextPathOptions = {}): XmlComponent =>
    new BuilderElement<VmlTextPathAttributes>({
        name: "v:textpath",
        attributes: {
            on: { key: "on", value: vmlTrueFalse(on) },
            fitShape: { key: "fitshape", value: vmlTrueFalse(fitShape) },
            fitPath: { key: "fitpath", value: vmlTrueFalse(fitPath) },
            trim: { key: "trim", value: vmlTrueFalse(trim) },
            xScale: { key: "xscale", value: vmlTrueFalse(xScale) },
            style: { key: "style", value: formatVmlTextPathStyle(style) },
            text: { key: "string", value: text },
        },
    });
