/**
 * VML text box shape module for WordprocessingML documents.
 *
 * Provides functionality for creating the VML shape that hosts a text box. The shape
 * itself is built by the generic VML module; this module configures it with the
 * text box shape type and content.
 *
 * References:
 * - https://c-rex.net/samples/ooxml/e1/Part3/OOXML_P3_Primer_OfficeArt_topic_ID0ELU5O.html
 * - http://webapp.docx4java.org/OnlineDemo/ecma376/VML/shape.html
 *
 * @module
 */
import type { ParagraphChild } from "@file/paragraph";
import { type VmlShapeStyle, createVmlShape } from "@file/vml";
import type { XmlComponent } from "@file/xml-components";

import { createVmlTextbox } from "../vml-textbox/vml-texbox";

export type { VmlShapeStyle } from "@file/vml";

/** Identifier of the text box shape type as referenced by shapes. */
const SHAPE_TYPE = "#_x0000_t202";

/**
 * Options for creating a VML shape.
 *
 * @property id - Unique identifier for the shape
 * @property children - Array of paragraph children to include in the shape's textbox
 * @property type - VML shape type identifier (default: "#_x0000_t202" for text rectangle)
 * @property style - Styling properties for the shape
 */
type ShapeOptions = {
    /** Unique identifier for the shape */
    readonly id: string;
    /** Array of paragraph children to include in the shape's textbox */
    readonly children?: readonly ParagraphChild[];
    /** VML shape type identifier (default: "#_x0000_t202" for text rectangle) */
    readonly type?: string;
    /** Styling properties for the shape */
    readonly style?: VmlShapeStyle;
};

/**
 * Creates a VML shape element with textbox content.
 *
 * The VML shape element (v:shape) represents a vector graphics shape in WordprocessingML documents.
 * This function creates shapes configured for text display (textbox shapes), which are commonly
 * used for creating floating text boxes with custom positioning and styling.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Shape">
 *   <xsd:choice maxOccurs="unbounded">
 *     <xsd:group ref="EG_ShapeElements"/>
 *     <xsd:element ref="o:ink"/>
 *     <xsd:element ref="pvml:iscomment"/>
 *     <xsd:element ref="o:equationxml"/>
 *   </xsd:choice>
 *   <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
 *   <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
 *   <xsd:attributeGroup ref="AG_Type"/>
 *   <xsd:attributeGroup ref="AG_Adj"/>
 *   <xsd:attributeGroup ref="AG_Path"/>
 *   <xsd:attribute ref="o:gfxdata"/>
 *   <xsd:attribute name="equationxml" type="xsd:string" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the shape
 * @returns An XmlComponent representing the v:shape element
 *
 * @example
 * ```typescript
 * const shape = createShape({
 *   id: "textbox1",
 *   children: [new TextRun("Hello World")],
 *   style: {
 *     width: "3in",
 *     height: "1in",
 *     position: "absolute",
 *     left: "1in",
 *     top: "1in"
 *   }
 * });
 * ```
 */
export const createShape = ({ id, children, type = SHAPE_TYPE, style }: ShapeOptions): XmlComponent =>
    createVmlShape({
        id,
        type,
        style,
        children: [createVmlTextbox({ style: "mso-fit-shape-to-text:t;", children })],
    });
