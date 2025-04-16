// http://officeopenxml.com/drwPicInline.php
import { IMediaData, IMediaDataTransformation } from "@file/media";
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { DocProperties, DocPropertiesOptions } from "./../doc-properties/doc-properties";
import { createEffectExtent } from "./../effect-extent/effect-extent";
import { createExtent } from "./../extent/extent";
import { createGraphicFrameProperties } from "./../graphic-frame/graphic-frame-properties";
import { Graphic } from "./../inline/graphic";
import { OutlineOptions } from "./graphic/graphic-data/pic/shape-properties/outline/outline";

type InlineOptions = {
    readonly mediaData: IMediaData;
    readonly transform: IMediaDataTransformation;
    readonly docProperties?: DocPropertiesOptions;
    readonly outline?: OutlineOptions;
};

// <xsd:complexType name="CT_Inline">
//     <xsd:sequence>
//         <xsd:element name="extent" type="a:CT_PositiveSize2D"/>
//         <xsd:element name="effectExtent" type="CT_EffectExtent" minOccurs="0"/>
//         <xsd:element name="docPr" type="a:CT_NonVisualDrawingProps" minOccurs="1" maxOccurs="1"/>
//         <xsd:element name="cNvGraphicFramePr" type="a:CT_NonVisualGraphicFrameProperties"
//             minOccurs="0" maxOccurs="1"/>
//         <xsd:element ref="a:graphic" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="distT" type="ST_WrapDistance" use="optional"/>
//     <xsd:attribute name="distB" type="ST_WrapDistance" use="optional"/>
//     <xsd:attribute name="distL" type="ST_WrapDistance" use="optional"/>
//     <xsd:attribute name="distR" type="ST_WrapDistance" use="optional"/>
// </xsd:complexType>
export const createInline = ({ mediaData, transform, docProperties, outline }: InlineOptions): XmlComponent =>
    new BuilderElement({
        name: "wp:inline",
        attributes: {
            distanceTop: {
                key: "distT",
                value: 0,
            },
            distanceBottom: {
                key: "distB",
                value: 0,
            },
            distanceLeft: {
                key: "distL",
                value: 0,
            },
            distanceRight: {
                key: "distR",
                value: 0,
            },
        },
        children: [
            createExtent({ x: transform.emus.x, y: transform.emus.y }),
            createEffectExtent(
                outline
                    ? {
                          top: (outline.width ?? 9525) * 2,
                          right: (outline.width ?? 9525) * 2,
                          bottom: (outline.width ?? 9525) * 2,
                          left: (outline.width ?? 9525) * 2,
                      }
                    : { top: 0, right: 0, bottom: 0, left: 0 },
            ),
            new DocProperties(docProperties),
            createGraphicFrameProperties(),
            new Graphic({ mediaData, transform, outline }),
        ],
    });
