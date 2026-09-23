/**
 * VML shape module for WordprocessingML documents.
 *
 * Provides functionality for creating VML shape elements with customizable styling and positioning.
 * The shape is the fundamental building block of VML drawings: text boxes, WordArt, pictures
 * and free-form drawings are all shapes with different types and children.
 *
 * References:
 * - https://c-rex.net/samples/ooxml/e1/Part3/OOXML_P3_Primer_OfficeArt_topic_ID0ELU5O.html
 * - http://webapp.docx4java.org/OnlineDemo/ecma376/VML/shape.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { type VmlTrueFalse, vmlTrueFalse } from "../vml-values";
import { type VmlShapeStyle, formatVmlShapeStyle } from "./vml-shape-style";

/**
 * Options for creating a VML shape.
 */
export type IVmlShapeOptions = {
    /** Unique identifier for the shape. */
    readonly id: string;
    /** Reference to a shape type definition, e.g. `#_x0000_t202` for a text box. */
    readonly type?: string;
    /** Styling properties for positioning and sizing the shape. */
    readonly style?: VmlShapeStyle;
    /** Size of the shape's coordinate space, e.g. `21600,21600`. */
    readonly coordinateSize?: string;
    /** Adjustment values for the shape's geometry, e.g. `10800`. */
    readonly adjustment?: string;
    /** Path defining the shape's geometry in VML path syntax. */
    readonly path?: string;
    /** Office preset shape type number (`o:spt`), e.g. `136` for plain WordArt or `75` for a picture frame. */
    readonly presetShapeType?: number;
    /** Whether the shape may be positioned inside a table cell (`o:allowincell`). */
    readonly allowInCell?: boolean;
    /** Alternative text for the shape. */
    readonly alt?: string;
    /** Title of the shape. */
    readonly title?: string;
    /** Fill colour: a named colour or a hex value prefixed with `#`. */
    readonly fillColor?: string;
    /** Whether the shape is filled. */
    readonly filled?: boolean;
    /** Whether the shape's outline is drawn. */
    readonly stroked?: boolean;
    /** Outline colour: a named colour or a hex value prefixed with `#`. */
    readonly strokeColor?: string;
    /** Outline thickness, e.g. `1pt`. */
    readonly strokeWeight?: string;
    /** Child elements such as `v:fill`, `v:textpath`, `v:imagedata` or `v:textbox`. */
    readonly children?: readonly XmlComponent[];
};

type VmlShapeAttributes = {
    readonly id: string;
    readonly type?: string;
    readonly style?: string;
    readonly coordinateSize?: string;
    readonly adjustment?: string;
    readonly path?: string;
    readonly presetShapeType?: number;
    readonly allowInCell?: VmlTrueFalse;
    readonly alt?: string;
    readonly title?: string;
    readonly fillColor?: string;
    readonly filled?: VmlTrueFalse;
    readonly stroked?: VmlTrueFalse;
    readonly strokeColor?: string;
    readonly strokeWeight?: string;
};

/**
 * Creates a VML shape element.
 *
 * The VML shape element (v:shape) represents a vector graphics shape in WordprocessingML documents.
 * The shape's appearance is determined by its type (a reference to a `v:shapetype`), its style,
 * and its children.
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
 * const shape = createVmlShape({
 *   id: "watermark",
 *   type: "#_x0000_t136",
 *   style: { position: "absolute", width: "527.85pt", height: "131.95pt", rotation: 315 },
 *   fillColor: "silver",
 *   stroked: false,
 *   children: [createVmlFill({ opacity: 0.5 }), createVmlTextPath({ text: "DRAFT" })],
 * });
 * ```
 */
export const createVmlShape = ({
    id,
    type,
    style,
    coordinateSize,
    adjustment,
    path,
    presetShapeType,
    allowInCell,
    alt,
    title,
    fillColor,
    filled,
    stroked,
    strokeColor,
    strokeWeight,
    children = [],
}: IVmlShapeOptions): XmlComponent =>
    new BuilderElement<VmlShapeAttributes>({
        name: "v:shape",
        attributes: {
            id: { key: "id", value: id },
            type: { key: "type", value: type },
            style: { key: "style", value: formatVmlShapeStyle(style) },
            coordinateSize: { key: "coordsize", value: coordinateSize },
            adjustment: { key: "adj", value: adjustment },
            path: { key: "path", value: path },
            presetShapeType: { key: "o:spt", value: presetShapeType },
            allowInCell: { key: "o:allowincell", value: vmlTrueFalse(allowInCell) },
            alt: { key: "alt", value: alt },
            title: { key: "title", value: title },
            fillColor: { key: "fillcolor", value: fillColor },
            filled: { key: "filled", value: vmlTrueFalse(filled) },
            stroked: { key: "stroked", value: vmlTrueFalse(stroked) },
            strokeColor: { key: "strokecolor", value: strokeColor },
            strokeWeight: { key: "strokeweight", value: strokeWeight },
        },
        children,
    });
