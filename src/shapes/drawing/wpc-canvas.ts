/**
 * Drawing canvases (`wpc:wpc`): an area of a document that holds shapes and pictures,
 * where connectors stay attached to the shapes they join.
 *
 * Reference: ECMA-376 Part 1, 20.4.2.19 wpc (WordprocessingML Drawing Canvas)
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

import { type ShapeFill, createShapeFill } from "../preset-shape/shape-fill";
import { type ShapeLine, createShapeLine } from "../preset-shape/shape-line";

export type WpcCanvasOptions = {
    /** The shapes on the canvas (`wps:wsp` elements) */
    readonly children: readonly XmlComponent[];
    /** The canvas's background. Default is none */
    readonly fill?: ShapeFill;
    /** The canvas's outline. Default is none */
    readonly line?: ShapeLine;
};

/**
 * Creates a `wpc:wpc` element.
 *
 * The background (`wpc:bg`) and outline (`wpc:whole`) are always written, as Word does, and are empty
 * unless a fill or line is given.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WordprocessingCanvas">
 *   <xsd:sequence minOccurs="1" maxOccurs="1">
 *     <xsd:element name="bg" type="a:CT_BackgroundFormatting" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="whole" type="a:CT_WholeE2oFormatting" minOccurs="0" maxOccurs="1"/>
 *     <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *       <xsd:element ref="wps:wsp"/>
 *       <xsd:element ref="dpct:pic"/>
 *       <xsd:element name="contentPart" type="wp14:CT_WordContentPart"/>
 *       <xsd:element ref="wpg:wgp"/>
 *       <xsd:element name="graphicFrame" type="CT_GraphicFrame"/>
 *     </xsd:choice>
 *     <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createWpcCanvas = ({ children, fill, line }: WpcCanvasOptions): XmlComponent =>
    new BuilderElement({
        name: "wpc:wpc",
        children: [
            new BuilderElement({ name: "wpc:bg", children: fill ? [createShapeFill(fill)] : [] }),
            new BuilderElement({ name: "wpc:whole", children: line ? [createShapeLine(line)] : [] }),
            ...children,
        ],
    });
