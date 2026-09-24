/**
 * VML image data module for WordprocessingML documents.
 *
 * Image data attaches a picture to a VML shape and describes how it should be
 * adjusted, for example washed out for use as a watermark.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/imagedata.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

import { type VmlTrueFalse, vmlFixedPoint, vmlTrueFalse } from "./vml-values";

/**
 * Options for creating VML image data.
 */
export type IVmlImageDataOptions = {
    /** Relationship id of the embedded image (`r:id`). */
    readonly relationshipId?: string;
    /** Title of the image (`o:title`), usually the original file name. */
    readonly title?: string;
    /** Brightness adjustment as a multiplier where 1 is unchanged. Word's washout effect uses 0.3. */
    readonly gain?: number;
    /** Black level adjustment as a fraction where 0 is unchanged. Word's washout effect uses 0.35. */
    readonly blackLevel?: number;
    /** Gamma adjustment as a fraction where 1 is unchanged. */
    readonly gamma?: number;
    /** Whether the image is rendered in grayscale. */
    readonly grayscale?: boolean;
    /** Whether the image is rendered in black and white only. */
    readonly biLevel?: boolean;
    /** Colour treated as transparent: a named colour or a hex value prefixed with `#`. */
    readonly chromaKey?: string;
};

type VmlImageDataAttributes = {
    readonly relationshipId?: string;
    readonly title?: string;
    readonly gain?: string;
    readonly blackLevel?: string;
    readonly gamma?: string;
    readonly grayscale?: VmlTrueFalse;
    readonly biLevel?: VmlTrueFalse;
    readonly chromaKey?: string;
};

/**
 * Creates a VML image data element.
 *
 * The VML image data element (v:imagedata) references an embedded picture through
 * a relationship and applies colour adjustments to it. Adjustment values are written
 * in VML's fixed-point notation where 65536 represents 1.0.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ImageData">
 *   <xsd:attributeGroup ref="AG_Id"/>
 *   <xsd:attributeGroup ref="AG_ImageAttributes"/>
 *   <xsd:attributeGroup ref="AG_Chromakey"/>
 *   <xsd:attribute ref="o:title"/>
 *   <xsd:attribute ref="r:id"/>
 *   <!-- further attributes omitted -->
 * </xsd:complexType>
 *
 * <xsd:attributeGroup name="AG_ImageAttributes">
 *   <xsd:attribute name="src" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="cropleft" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="croptop" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="cropright" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="cropbottom" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="gain" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="blacklevel" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="gamma" type="xsd:string" use="optional"/>
 *   <xsd:attribute name="grayscale" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="bilevel" type="s:ST_TrueFalse" use="optional"/>
 * </xsd:attributeGroup>
 * ```
 *
 * @param options - Configuration options for the image data
 * @returns An XmlComponent representing the v:imagedata element
 *
 * @example
 * ```typescript
 * createVmlImageData({ relationshipId: "rId1", title: "logo", gain: 0.3, blackLevel: 0.35 });
 * // <v:imagedata r:id="rId1" o:title="logo" gain="19661f" blacklevel="22938f"/>
 * ```
 */
export const createVmlImageData = ({
    relationshipId,
    title,
    gain,
    blackLevel,
    gamma,
    grayscale,
    biLevel,
    chromaKey,
}: IVmlImageDataOptions = {}): XmlComponent =>
    new BuilderElement<VmlImageDataAttributes>({
        name: "v:imagedata",
        attributes: {
            relationshipId: { key: "r:id", value: relationshipId },
            title: { key: "o:title", value: title },
            gain: { key: "gain", value: gain === undefined ? undefined : vmlFixedPoint(gain) },
            blackLevel: { key: "blacklevel", value: blackLevel === undefined ? undefined : vmlFixedPoint(blackLevel) },
            gamma: { key: "gamma", value: gamma === undefined ? undefined : vmlFixedPoint(gamma) },
            grayscale: { key: "grayscale", value: vmlTrueFalse(grayscale) },
            biLevel: { key: "bilevel", value: vmlTrueFalse(biLevel) },
            chromaKey: { key: "chromakey", value: chromaKey },
        },
    });
