/**
 * Preset shapes (`wps:wsp`): rectangles, ellipses, lines, arrows and the other DrawingML presets.
 *
 * @module
 */
import {
    BuilderElement,
    type IMediaDataTransformation,
    NonVisualDrawingProperties,
    type NonVisualDrawingPropertiesOptions,
    type Paragraph,
    type XmlComponent,
} from "docx";

import { type PresetShapeGeometry, createPresetShapeProperties } from "./preset-shape-properties";
import { isConnectorShapeType } from "./preset-shape-type";
import type { ShapeEffects } from "./shape-effects";
import type { ShapeFill } from "./shape-fill";
import type { ShapeLine } from "./shape-line";
import { type ShapeTextOptions, createShapeTextProperties } from "./shape-text";
import { createTextBox } from "../drawing/drawing-parts";

/**
 * Non-visual properties (`wps:cNvPr`) that identify a shape inside a group: its id, name and alternative text,
 * a link followed when it is clicked, and whether it is decorative.
 */
export type PresetShapeNonVisualProperties = NonVisualDrawingPropertiesOptions;

/**
 * The shape a connector is attached to (`a:stCxn` / `a:endCxn`): its `wps:cNvPr` id and the index of its connection site.
 */
export type ShapeConnection = {
    readonly id: number;
    readonly index: number;
};

export type PresetShapeCoreOptions = {
    readonly geometry: PresetShapeGeometry;
    /** The shapes a connector's start and end are attached to. Only written for lines and connectors */
    readonly connections?: {
        readonly start?: ShapeConnection;
        readonly end?: ShapeConnection;
    };
    readonly fill?: ShapeFill;
    readonly line?: ShapeLine;
    readonly effects?: ShapeEffects;
    readonly children?: readonly Paragraph[];
    readonly textOptions?: ShapeTextOptions;
    readonly nonVisualDrawingProperties?: PresetShapeNonVisualProperties;
};

export type PresetShapeOptions = PresetShapeCoreOptions & {
    readonly transformation: IMediaDataTransformation;
};

/**
 * Creates the non-visual drawing properties of a shape, picture or group inside a drawing, such as `wps:cNvPr`.
 */
export const createNonVisualDrawingProperties = (
    properties: PresetShapeNonVisualProperties,
    name: "wps:cNvPr" | "pic:cNvPr" | "wpg:cNvPr" = "wps:cNvPr",
): XmlComponent => new NonVisualDrawingProperties(name, properties);

// <xsd:complexType name="CT_Connection">
//     <xsd:attribute name="id" type="ST_DrawingElementId" use="required"/>
//     <xsd:attribute name="idx" type="xsd:unsignedInt" use="required"/>
// </xsd:complexType>
const createConnection = (name: "a:stCxn" | "a:endCxn", { id, index }: ShapeConnection): XmlComponent =>
    new BuilderElement<ShapeConnection>({
        name,
        attributes: {
            id: { key: "id", value: id },
            index: { key: "idx", value: index },
        },
    });

// <xsd:complexType name="CT_NonVisualConnectorProperties">
//     <xsd:sequence>
//         <xsd:element name="cxnSpLocks" type="CT_ConnectorLocking" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="stCxn" type="CT_Connection" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="endCxn" type="CT_Connection" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
//     </xsd:sequence>
// </xsd:complexType>
const createNonVisualConnectorProperties = (connections: PresetShapeCoreOptions["connections"] = {}): XmlComponent =>
    new BuilderElement({
        name: "wps:cNvCnPr",
        children: [
            ...(connections.start ? [createConnection("a:stCxn", connections.start)] : []),
            ...(connections.end ? [createConnection("a:endCxn", connections.end)] : []),
        ],
    });

/**
 * Creates a `wps:wsp` element for a preset shape.
 *
 * Lines and connectors are written with `wps:cNvCnPr`, which says which shapes they are attached to,
 * and other shapes with `wps:cNvSpPr`.
 * A text box (`wps:txbx`) is written only when the shape has children, and its text is
 * centred vertically unless `textOptions` says otherwise.
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
    connections,
    fill,
    line,
    effects,
    children,
    textOptions,
    nonVisualDrawingProperties,
    transformation,
}: PresetShapeOptions): XmlComponent =>
    new BuilderElement({
        name: "wps:wsp",
        children: [
            ...(nonVisualDrawingProperties ? [createNonVisualDrawingProperties(nonVisualDrawingProperties)] : []),
            geometry.type !== "custom" && isConnectorShapeType(geometry.type)
                ? createNonVisualConnectorProperties(connections)
                : new BuilderElement({ name: "wps:cNvSpPr" }),
            createPresetShapeProperties({ transformation, geometry, fill, line, effects }),
            ...(children ? [createTextBox(children)] : []),
            createShapeTextProperties(children ? { verticalAlignment: "center", ...textOptions } : textOptions),
        ],
    });
