import type { IMediaDataTransformation } from "@file/media";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { Extents } from "../pic/shape-properties/form/extents/extents";
import { Offset } from "../pic/shape-properties/form/offset/off";

export type GroupChild = XmlComponent;

export type WpgGroupCoreOptions = {
    readonly children: readonly GroupChild[];
};

export type WpgGroupOptions = WpgGroupCoreOptions & {
    readonly transformation: IMediaDataTransformation;
};

type Point = {
    readonly x: number;
    readonly y: number;
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
const createGroupTransform = (transformation: IMediaDataTransformation): XmlComponent =>
    new BuilderElement<{ readonly flipVertical?: boolean; readonly flipHorizontal?: boolean; readonly rotation?: number }>({
        name: "a:xfrm",
        attributes: {
            flipVertical: { key: "flipV", value: transformation.flip?.vertical },
            flipHorizontal: { key: "flipH", value: transformation.flip?.horizontal },
            rotation: { key: "rot", value: transformation.rotation },
        },
        children: [
            new Offset(transformation.offset?.emus?.x, transformation.offset?.emus?.y),
            new Extents(transformation.emus.x, transformation.emus.y),
            // The children are positioned in pixels converted to EMUs from the group's top-left corner, so their
            // coordinate space is the group's own size
            new BuilderElement<Point>({
                name: "a:chOff",
                attributes: { x: { key: "x", value: 0 }, y: { key: "y", value: 0 } },
            }),
            new BuilderElement<Point>({
                name: "a:chExt",
                attributes: { x: { key: "cx", value: transformation.emus.x }, y: { key: "cy", value: transformation.emus.y } },
            }),
        ],
    });

const createNonVisualGroupProperties = (): XmlComponent =>
    new BuilderElement({
        name: "wpg:cNvGrpSpPr",
    });

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
export const createWpgGroup = (options: WpgGroupOptions): XmlComponent =>
    new BuilderElement({
        name: "wpg:wgp",
        children: [
            createNonVisualGroupProperties(),
            new BuilderElement({
                name: "wpg:grpSpPr",
                children: [createGroupTransform(options.transformation)],
            }),
            ...options.children,
        ],
    });
