/**
 * Pictures in groups and on drawing canvases (`pic:pic`).
 *
 * Reference: ECMA-376 Part 1, 20.2.2.5 pic (Picture)
 *
 * @module
 */
import { BuilderElement, type ICropOptions, type IMediaDataTransformation, type XmlComponent } from "docx";

import type { ImageSource } from "./image-data";
import { createPictureLocks, createPresetGeometry, createTransform } from "../drawing/drawing-parts";
import { type PresetShapeNonVisualProperties, createNonVisualDrawingProperties } from "../preset-shape/preset-shape";
import { type ShapeEffects, createShapeEffects } from "../preset-shape/shape-effects";
import { createPictureFill } from "../preset-shape/shape-fill";
import { type ShapeLine, createShapeLine } from "../preset-shape/shape-line";

export type ShapePictureCoreOptions = {
    readonly image: ImageSource;
    readonly crop?: ICropOptions;
    /** The picture's outline. Default is none */
    readonly line?: ShapeLine;
    readonly effects?: ShapeEffects;
    readonly nonVisualDrawingProperties: PresetShapeNonVisualProperties;
};

export type ShapePictureOptions = ShapePictureCoreOptions & {
    readonly transformation: IMediaDataTransformation;
};

/**
 * Creates a `pic:pic` element for a picture in a group or on a canvas. On a canvas, the schema calls it `dpct:pic`,
 * which is the same element in the same namespace.
 *
 * The picture is added to the document's media when it is written.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Picture">
 *   <xsd:sequence minOccurs="1" maxOccurs="1">
 *     <xsd:element name="nvPicPr" type="CT_PictureNonVisual" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="blipFill" type="a:CT_BlipFillProperties" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createShapePicture = ({
    image,
    crop,
    line,
    effects,
    nonVisualDrawingProperties,
    transformation,
}: ShapePictureOptions): XmlComponent =>
    new BuilderElement<{ readonly namespace: string }>({
        name: "pic:pic",
        attributes: {
            namespace: { key: "xmlns:pic", value: "http://schemas.openxmlformats.org/drawingml/2006/picture" },
        },
        children: [
            new BuilderElement({
                name: "pic:nvPicPr",
                children: [createNonVisualDrawingProperties(nonVisualDrawingProperties, "pic:cNvPr"), createPictureLocks()],
            }),
            createPictureFill({ image, crop }, "pic:blipFill"),
            new BuilderElement({
                name: "pic:spPr",
                children: [
                    createTransform(transformation),
                    createPresetGeometry(),
                    ...(line ? [createShapeLine(line)] : []),
                    ...(effects ? [createShapeEffects(effects)] : []),
                ],
            }),
        ],
    });
