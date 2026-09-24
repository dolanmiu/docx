/**
 * VML stroke module for WordprocessingML documents.
 *
 * Provides functionality for describing how the outline of a VML shape is drawn.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/stroke.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

import { type VmlTrueFalse, vmlTrueFalse } from "./vml-values";

/**
 * How the corners of a VML outline are joined.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_StrokeJoinStyle">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="round"/>
 *     <xsd:enumeration value="bevel"/>
 *     <xsd:enumeration value="miter"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export type VmlStrokeJoinStyle = "round" | "bevel" | "miter";

/**
 * Options for creating a VML stroke.
 */
export type IVmlStrokeOptions = {
    /** Whether the outline is drawn. */
    readonly on?: boolean;
    /** Thickness of the outline, e.g. `1pt`. */
    readonly weight?: string;
    /** Outline colour: a named colour or a hex value prefixed with `#`. */
    readonly color?: string;
    /** Opacity of the outline, from 0 (transparent) to 1 (opaque). */
    readonly opacity?: number;
    /** How corners of the outline are joined. */
    readonly joinStyle?: VmlStrokeJoinStyle;
};

type VmlStrokeAttributes = {
    readonly on?: VmlTrueFalse;
    readonly weight?: string;
    readonly color?: string;
    readonly opacity?: number;
    readonly joinStyle?: VmlStrokeJoinStyle;
};

/**
 * Creates a VML stroke element.
 *
 * The VML stroke element (v:stroke) refines the outline of its parent shape.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Stroke">
 *   <xsd:sequence>
 *     <xsd:element ref="o:left" minOccurs="0"/>
 *     <xsd:element ref="o:top" minOccurs="0"/>
 *     <xsd:element ref="o:right" minOccurs="0"/>
 *     <xsd:element ref="o:bottom" minOccurs="0"/>
 *     <xsd:element ref="o:column" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attributeGroup ref="AG_Id"/>
 *   <xsd:attributeGroup ref="AG_StrokeAttributes"/>
 * </xsd:complexType>
 *
 * <xsd:attributeGroup name="AG_StrokeAttributes">
 *   <xsd:attribute name="on" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="weight" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="color" type="s:ST_ColorType" use="optional"/>
 *   <xsd:attribute name="opacity" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="joinstyle" type="ST_StrokeJoinStyle" use="optional"/>
 *   <!-- further attributes omitted -->
 * </xsd:attributeGroup>
 * ```
 *
 * @param options - Configuration options for the stroke
 * @returns An XmlComponent representing the v:stroke element
 *
 * @example
 * ```typescript
 * createVmlStroke({ joinStyle: "miter" });
 * // <v:stroke joinstyle="miter"/>
 * ```
 */
export const createVmlStroke = ({ on, weight, color, opacity, joinStyle }: IVmlStrokeOptions = {}): XmlComponent =>
    new BuilderElement<VmlStrokeAttributes>({
        name: "v:stroke",
        attributes: {
            on: { key: "on", value: vmlTrueFalse(on) },
            weight: { key: "weight", value: weight },
            color: { key: "color", value: color },
            opacity: { key: "opacity", value: opacity },
            joinStyle: { key: "joinstyle", value: joinStyle },
        },
    });
