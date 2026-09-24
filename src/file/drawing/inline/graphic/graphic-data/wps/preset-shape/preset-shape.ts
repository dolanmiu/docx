/**
 * Preset shapes (`wps:wsp`): rectangles, ellipses, lines, arrows and the other DrawingML presets.
 *
 * @module
 */
import type { IMediaDataTransformation } from "@file/media";
import type { Paragraph } from "@file/paragraph";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { type PresetShapeGeometry, createPresetShapeProperties } from "./preset-shape-properties";
import { isConnectorShapeType } from "./preset-shape-type";
import type { ShapeFill } from "./shape-fill";
import type { ShapeLine } from "./shape-line";
import { type IBodyPropertiesOptions, VerticalAnchor, createBodyProperties } from "../body-properties";
import { createWpsTextBox } from "../wps-text-box";

/**
 * Non-visual properties (`wps:cNvPr`) that identify a shape inside a group.
 */
export type PresetShapeNonVisualProperties = {
    readonly id: number;
    readonly name: string;
    readonly description?: string;
    readonly title?: string;
};

export type PresetShapeCoreOptions = {
    readonly geometry: PresetShapeGeometry;
    readonly fill?: ShapeFill;
    readonly line?: ShapeLine;
    readonly children?: readonly Paragraph[];
    readonly bodyProperties?: IBodyPropertiesOptions;
    readonly nonVisualDrawingProperties?: PresetShapeNonVisualProperties;
};

export type PresetShapeOptions = PresetShapeCoreOptions & {
    readonly transformation: IMediaDataTransformation;
};

const createNonVisualDrawingProperties = ({ id, name, description, title }: PresetShapeNonVisualProperties): XmlComponent =>
    new BuilderElement<{ readonly id: number; readonly name: string; readonly description?: string; readonly title?: string }>({
        name: "wps:cNvPr",
        attributes: {
            id: { key: "id", value: id },
            name: { key: "name", value: name },
            description: { key: "descr", value: description },
            title: { key: "title", value: title },
        },
    });

/**
 * Creates a `wps:wsp` element for a preset shape.
 *
 * Lines and connectors are written with `wps:cNvCnPr`, other shapes with `wps:cNvSpPr`.
 * A text box (`wps:txbx`) is written only when the shape has children, and its text is
 * centred vertically unless `bodyProperties` says otherwise.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_WordprocessingShape">
 *   <xsd:sequence minOccurs="1" maxOccurs="1">
 *     <xsd:element name="cNvPr" type="a:CT_NonVisualDrawingProps" minOccurs="0" maxOccurs="1"/>
 *     <xsd:choice minOccurs="1" maxOccurs="1">
 *       <xsd:element name="cNvSpPr" type="a:CT_NonVisualDrawingShapeProps" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="cNvCnPr" type="a:CT_NonVisualConnectorProperties" minOccurs="1" maxOccurs="1"/>
 *     </xsd:choice>
 *     <xsd:element name="spPr" type="a:CT_ShapeProperties" minOccurs="1" maxOccurs="1"/>
 *     <xsd:element name="style" type="a:CT_ShapeStyle" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *     <xsd:choice minOccurs="0" maxOccurs="1">
 *       <xsd:element name="txbx" type="CT_TextboxInfo" minOccurs="1" maxOccurs="1"/>
 *       <xsd:element name="linkedTxbx" type="CT_LinkedTextboxInformation" minOccurs="1" maxOccurs="1"/>
 *     </xsd:choice>
 *     <xsd:element name="bodyPr" type="a:CT_TextBodyProperties" minOccurs="1" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createPresetShape = ({
    geometry,
    fill,
    line,
    children,
    bodyProperties,
    nonVisualDrawingProperties,
    transformation,
}: PresetShapeOptions): XmlComponent =>
    new BuilderElement({
        name: "wps:wsp",
        children: [
            ...(nonVisualDrawingProperties ? [createNonVisualDrawingProperties(nonVisualDrawingProperties)] : []),
            new BuilderElement({ name: isConnectorShapeType(geometry.type) ? "wps:cNvCnPr" : "wps:cNvSpPr" }),
            createPresetShapeProperties({ transformation, geometry, fill, line }),
            ...(children ? [createWpsTextBox(children)] : []),
            createBodyProperties(children ? { verticalAnchor: VerticalAnchor.CENTER, ...bodyProperties } : bodyProperties),
        ],
    });
