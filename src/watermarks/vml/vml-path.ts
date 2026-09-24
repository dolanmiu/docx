/**
 * VML path module for WordprocessingML documents.
 *
 * The path element refines the geometry declared on a shape or shape type: which
 * features (text, fill, gradients) the geometry supports and where connectors attach.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/path.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

import { type VmlTrueFalse, vmlTrueFalse } from "./vml-values";

/**
 * Kinds of connection points exposed by a shape.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_ConnectType">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="none"/>
 *     <xsd:enumeration value="rect"/>
 *     <xsd:enumeration value="segments"/>
 *     <xsd:enumeration value="custom"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export type VmlConnectType = "none" | "rect" | "segments" | "custom";

/**
 * Options for creating a VML path.
 */
export type IVmlPathOptions = {
    /** Path geometry in VML path syntax (`v`). Overrides the parent's `path` attribute. */
    readonly value?: string;
    /** Whether the shape may be filled. */
    readonly fillOk?: boolean;
    /** Whether the shape may be stroked. */
    readonly strokeOk?: boolean;
    /** Whether the shape may cast a shadow. */
    readonly shadowOk?: boolean;
    /** Whether the shape may be used with arrowheads. */
    readonly arrowOk?: boolean;
    /** Whether the shape may use a gradient fill that follows its geometry. */
    readonly gradientShapeOk?: boolean;
    /** Whether the shape may render text along its path. */
    readonly textPathOk?: boolean;
    /** Whether the shape may be extruded into 3D (`o:extrusionok`). */
    readonly extrusionOk?: boolean;
    /** Kind of connection points exposed (`o:connecttype`). */
    readonly connectType?: VmlConnectType;
    /** Custom connection point locations (`o:connectlocs`). */
    readonly connectLocations?: string;
    /** Custom connection point angles (`o:connectangles`). */
    readonly connectAngles?: string;
};

type VmlPathAttributes = {
    readonly value?: string;
    readonly fillOk?: VmlTrueFalse;
    readonly strokeOk?: VmlTrueFalse;
    readonly shadowOk?: VmlTrueFalse;
    readonly arrowOk?: VmlTrueFalse;
    readonly gradientShapeOk?: VmlTrueFalse;
    readonly textPathOk?: VmlTrueFalse;
    readonly extrusionOk?: VmlTrueFalse;
    readonly connectType?: VmlConnectType;
    readonly connectLocations?: string;
    readonly connectAngles?: string;
};

/**
 * Creates a VML path element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Path">
 *   <xsd:attributeGroup ref="AG_Id"/>
 *   <xsd:attribute name="v" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="limo" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="textboxrect" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="fillok" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="strokeok" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="shadowok" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="arrowok" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="gradientshapeok" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="textpathok" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="insetpenok" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute ref="o:connecttype"/>
 *   <xsd:attribute ref="o:connectlocs"/>
 *   <xsd:attribute ref="o:connectangles"/>
 *   <xsd:attribute ref="o:extrusionok"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the path
 * @returns An XmlComponent representing the v:path element
 *
 * @example
 * ```typescript
 * createVmlPath({ textPathOk: true, connectType: "custom" });
 * // <v:path textpathok="t" o:connecttype="custom"/>
 * ```
 */
export const createVmlPath = ({
    value,
    fillOk,
    strokeOk,
    shadowOk,
    arrowOk,
    gradientShapeOk,
    textPathOk,
    extrusionOk,
    connectType,
    connectLocations,
    connectAngles,
}: IVmlPathOptions = {}): XmlComponent =>
    new BuilderElement<VmlPathAttributes>({
        name: "v:path",
        attributes: {
            value: { key: "v", value },
            fillOk: { key: "fillok", value: vmlTrueFalse(fillOk) },
            strokeOk: { key: "strokeok", value: vmlTrueFalse(strokeOk) },
            shadowOk: { key: "shadowok", value: vmlTrueFalse(shadowOk) },
            arrowOk: { key: "arrowok", value: vmlTrueFalse(arrowOk) },
            gradientShapeOk: { key: "gradientshapeok", value: vmlTrueFalse(gradientShapeOk) },
            textPathOk: { key: "textpathok", value: vmlTrueFalse(textPathOk) },
            extrusionOk: { key: "o:extrusionok", value: vmlTrueFalse(extrusionOk) },
            connectType: { key: "o:connecttype", value: connectType },
            connectLocations: { key: "o:connectlocs", value: connectLocations },
            connectAngles: { key: "o:connectangles", value: connectAngles },
        },
    });
