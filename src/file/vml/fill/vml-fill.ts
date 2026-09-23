/**
 * VML fill module for WordprocessingML documents.
 *
 * Provides functionality for describing how the interior of a VML shape is painted.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/fill.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { type VmlTrueFalse, vmlTrueFalse } from "../vml-values";

/**
 * Kinds of VML fill.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_FillType">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="solid"/>
 *     <xsd:enumeration value="gradient"/>
 *     <xsd:enumeration value="gradientRadial"/>
 *     <xsd:enumeration value="tile"/>
 *     <xsd:enumeration value="pattern"/>
 *     <xsd:enumeration value="frame"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export type VmlFillType = "solid" | "gradient" | "gradientRadial" | "tile" | "pattern" | "frame";

/**
 * Options for creating a VML fill.
 */
export type IVmlFillOptions = {
    /** Whether the fill is displayed. */
    readonly on?: boolean;
    /** The kind of fill. Default is solid. */
    readonly type?: VmlFillType;
    /** Primary fill colour: a named colour or a hex value prefixed with `#`. */
    readonly color?: string;
    /** Secondary fill colour used by gradients and patterns. */
    readonly color2?: string;
    /** Opacity of the fill, from 0 (transparent) to 1 (opaque). */
    readonly opacity?: number;
    /** Angle of a gradient fill, in degrees. */
    readonly angle?: number;
};

type VmlFillAttributes = {
    readonly on?: VmlTrueFalse;
    readonly type?: VmlFillType;
    readonly color?: string;
    readonly color2?: string;
    readonly opacity?: number;
    readonly angle?: number;
};

/**
 * Creates a VML fill element.
 *
 * The VML fill element (v:fill) refines the fill of its parent shape, for example
 * to make a watermark semi-transparent.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Fill">
 *   <xsd:sequence>
 *     <xsd:element ref="o:fill" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attributeGroup ref="AG_Id"/>
 *   <xsd:attribute name="type" type="ST_FillType" use="optional"/>
 *   <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="color" type="s:ST_ColorType" use="optional"/>
 *   <xsd:attribute name="opacity" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="color2" type="s:ST_ColorType" use="optional"/>
 *   <xsd:attribute name="angle" type="xsd:decimal" use="optional"/>
 *   <!-- further attributes omitted -->
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the fill
 * @returns An XmlComponent representing the v:fill element
 *
 * @example
 * ```typescript
 * createVmlFill({ opacity: 0.5 });
 * // <v:fill opacity="0.5"/>
 * ```
 */
export const createVmlFill = ({ on, type, color, color2, opacity, angle }: IVmlFillOptions = {}): XmlComponent =>
    new BuilderElement<VmlFillAttributes>({
        name: "v:fill",
        attributes: {
            on: { key: "on", value: vmlTrueFalse(on) },
            type: { key: "type", value: type },
            color: { key: "color", value: color },
            color2: { key: "color2", value: color2 },
            opacity: { key: "opacity", value: opacity },
            angle: { key: "angle", value: angle },
        },
    });
