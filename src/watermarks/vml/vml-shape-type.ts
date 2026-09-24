/**
 * VML shape type module for WordprocessingML documents.
 *
 * A shape type defines reusable geometry (path, formulas, handles and default
 * properties) that shapes reference through their `type` attribute. Word emits a
 * shape type for each kind of VML shape it uses, such as text boxes, WordArt or
 * picture frames.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/shapetype.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

import { type VmlTrueFalse, vmlTrueFalse } from "./vml-values";

/**
 * Options for creating a VML shape type.
 */
export type IVmlShapeTypeOptions = {
    /** Unique identifier for the shape type. Shapes reference it as `#id`. */
    readonly id: string;
    /** Size of the shape type's coordinate space, e.g. `21600,21600`. */
    readonly coordinateSize?: string;
    /** Office preset shape type number (`o:spt`). */
    readonly presetShapeType?: number;
    /** Whether the shape's size is relative to the original image size (`o:preferrelative`). */
    readonly preferRelative?: boolean;
    /** Default adjustment values for the shape's geometry. */
    readonly adjustment?: string;
    /** Path defining the shape's geometry in VML path syntax. */
    readonly path?: string;
    /** Whether shapes of this type are filled by default. */
    readonly filled?: boolean;
    /** Whether shapes of this type have their outline drawn by default. */
    readonly stroked?: boolean;
    /** Child elements such as `v:formulas`, `v:path`, `v:handles` and `o:lock`. */
    readonly children?: readonly XmlComponent[];
};

type VmlShapeTypeAttributes = {
    readonly id: string;
    readonly coordinateSize?: string;
    readonly presetShapeType?: number;
    readonly preferRelative?: VmlTrueFalse;
    readonly adjustment?: string;
    readonly path?: string;
    readonly filled?: VmlTrueFalse;
    readonly stroked?: VmlTrueFalse;
};

/**
 * Creates a VML shape type element.
 *
 * The VML shape type element (v:shapetype) declares geometry and defaults that
 * can be shared by several shapes.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Shapetype">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_ShapeElements" minOccurs="0" maxOccurs="unbounded"/>
 *     <xsd:element ref="o:complex" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attributeGroup ref="AG_AllCoreAttributes"/>
 *   <xsd:attributeGroup ref="AG_AllShapeAttributes"/>
 *   <xsd:attributeGroup ref="AG_Adj"/>
 *   <xsd:attributeGroup ref="AG_Path"/>
 *   <xsd:attribute ref="o:master"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the shape type
 * @returns An XmlComponent representing the v:shapetype element
 *
 * @example
 * ```typescript
 * const shapeType = createVmlShapeType({
 *   id: "_x0000_t136",
 *   coordinateSize: "21600,21600",
 *   presetShapeType: 136,
 *   adjustment: "10800",
 *   path: "m@7,l@8,m@5,21600l@6,21600e",
 * });
 * ```
 */
export const createVmlShapeType = ({
    id,
    coordinateSize,
    presetShapeType,
    preferRelative,
    adjustment,
    path,
    filled,
    stroked,
    children = [],
}: IVmlShapeTypeOptions): XmlComponent =>
    new BuilderElement<VmlShapeTypeAttributes>({
        name: "v:shapetype",
        attributes: {
            id: { key: "id", value: id },
            coordinateSize: { key: "coordsize", value: coordinateSize },
            presetShapeType: { key: "o:spt", value: presetShapeType },
            preferRelative: { key: "o:preferrelative", value: vmlTrueFalse(preferRelative) },
            adjustment: { key: "adj", value: adjustment },
            path: { key: "path", value: path },
            filled: { key: "filled", value: vmlTrueFalse(filled) },
            stroked: { key: "stroked", value: vmlTrueFalse(stroked) },
        },
        children,
    });
