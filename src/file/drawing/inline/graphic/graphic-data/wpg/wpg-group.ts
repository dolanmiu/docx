import type { IMediaDataTransformation } from "@file/media";
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { Extents } from "../pic/shape-properties/form/extents/extents";
import { Offset } from "../pic/shape-properties/form/offset/off";

export type GroupChild = XmlComponent;

export type WpgGroupCoreOptions = {
    readonly children: readonly GroupChild[];
};

type Point = {
    readonly x: number;
    readonly y: number;
};

export type WpgGroupOptions = WpgGroupCoreOptions & {
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
}: Pick<WpgGroupOptions, "transformation" | "childOffset" | "childExtent">): XmlComponent =>
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
            // The children are positioned in the rectangle chOff/chExt, which Word scales to fit the group's extent
            new BuilderElement<Point>({
                name: "a:chOff",
                attributes: { x: { key: "x", value: childOffset.x }, y: { key: "y", value: childOffset.y } },
            }),
            new BuilderElement<Point>({
                name: "a:chExt",
                attributes: { x: { key: "cx", value: childExtent.x }, y: { key: "cy", value: childExtent.y } },
            }),
        ],
    });

const createNonVisualGroupProperties = (): XmlComponent =>
    new BuilderElement({
        name: "wpg:cNvGrpSpPr",
    });

export const createWpgGroup = (options: WpgGroupOptions): XmlComponent =>
    new BuilderElement({
        name: "wpg:wgp",
        children: [
            createNonVisualGroupProperties(),
            new BuilderElement({
                name: "wpg:grpSpPr",
                children: [createGroupTransform(options)],
            }),
            ...options.children,
        ],
    });
