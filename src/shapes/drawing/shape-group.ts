/**
 * Groups of shapes (`wpg:wgp` and `wpg:grpSp`): shapes, pictures and groups that are moved and resized together.
 *
 * @module
 */
import { BuilderElement, type IMediaDataTransformation, type XmlComponent } from "docx";

import { createTransform } from "./drawing-parts";
import { type PresetShapeNonVisualProperties, createNonVisualDrawingProperties } from "../preset-shape/preset-shape";

type Point = {
    readonly x: number;
    readonly y: number;
};

export type ShapeGroupOptions = {
    /** The shapes, pictures and groups in the group */
    readonly children: readonly XmlComponent[];
    /** `wpg:wgp` for a drawing's group or a group on a canvas, and `wpg:grpSp` for a group inside a group. Default is `wpg:wgp` */
    readonly name?: "wpg:wgp" | "wpg:grpSp";
    /** The group's id and name, for a group inside a group or on a canvas */
    readonly nonVisualDrawingProperties?: PresetShapeNonVisualProperties;
    readonly transformation: IMediaDataTransformation;
    /** Top-left corner (in EMUs) of the coordinate space the children are positioned in. Defaults to 0,0. */
    readonly childOffset?: Point;
    /** Size (in EMUs) of the coordinate space the children are positioned in. Defaults to the group's own size. */
    readonly childExtent?: Point;
};

// <xsd:complexType name="CT_GroupTransform2D">
//     <xsd:sequence>
//         <xsd:element name="off" type="CT_Point2D" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="ext" type="CT_PositiveSize2D" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="chOff" type="CT_Point2D" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="chExt" type="CT_PositiveSize2D" minOccurs="0" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="rot" type="ST_Angle" use="optional" default="0"/>
//     <xsd:attribute name="flipH" type="xsd:boolean" use="optional" default="false"/>
//     <xsd:attribute name="flipV" type="xsd:boolean" use="optional" default="false"/>
// </xsd:complexType>
const createGroupTransform = ({
    transformation,
    childOffset = { x: 0, y: 0 },
    childExtent = transformation.emus,
}: Pick<ShapeGroupOptions, "transformation" | "childOffset" | "childExtent">): XmlComponent =>
    // The children are positioned in the rectangle chOff/chExt, which Word scales to fit the group's extent
    createTransform(transformation, [
        new BuilderElement<Point>({
            name: "a:chOff",
            attributes: { x: { key: "x", value: childOffset.x }, y: { key: "y", value: childOffset.y } },
        }),
        new BuilderElement<Point>({
            name: "a:chExt",
            attributes: { x: { key: "cx", value: childExtent.x }, y: { key: "cy", value: childExtent.y } },
        }),
    ]);

// <xsd:complexType name="CT_WordprocessingGroup">
//     <xsd:sequence minOccurs="1" maxOccurs="1">
//         <xsd:element name="cNvPr" type="a:CT_NonVisualDrawingProps" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="cNvGrpSpPr" type="a:CT_NonVisualGroupDrawingShapeProps" minOccurs="1" maxOccurs="1"/>
//         <xsd:element name="grpSpPr" type="a:CT_GroupShapeProperties" minOccurs="1" maxOccurs="1"/>
//         <xsd:choice minOccurs="0" maxOccurs="unbounded">
//             <xsd:element ref="wsp"/>
//             <xsd:element name="grpSp" type="CT_WordprocessingGroup"/>
//             <xsd:element name="graphicFrame" type="CT_GraphicFrame"/>
//             <xsd:element ref="dpct:pic"/>
//             <xsd:element name="contentPart" type="CT_WordprocessingContentPart"/>
//         </xsd:choice>
//         <xsd:element name="extLst" type="a:CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
//     </xsd:sequence>
// </xsd:complexType>
/**
 * Creates a group of shapes: `wpg:wgp` for a group drawing or a group on a canvas, and `wpg:grpSp` for a group inside
 * another group.
 */
export const createShapeGroup = (options: ShapeGroupOptions): XmlComponent =>
    new BuilderElement({
        name: options.name ?? "wpg:wgp",
        children: [
            ...(options.nonVisualDrawingProperties
                ? [createNonVisualDrawingProperties(options.nonVisualDrawingProperties, "wpg:cNvPr")]
                : []),
            new BuilderElement({ name: "wpg:cNvGrpSpPr" }),
            new BuilderElement({ name: "wpg:grpSpPr", children: [createGroupTransform(options)] }),
            ...options.children,
        ],
    });
