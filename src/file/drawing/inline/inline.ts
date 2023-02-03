// http://officeopenxml.com/drwPicInline.php
import { IMediaData, IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";
import { DocProperties, DocPropertiesOptions } from "./../doc-properties/doc-properties";
import { EffectExtent } from "./../effect-extent/effect-extent";
import { Extent } from "./../extent/extent";
import { GraphicFrameProperties } from "./../graphic-frame/graphic-frame-properties";
import { Graphic } from "./../inline/graphic";
import { InlineAttributes } from "./inline-attributes";

interface InlineOptions {
    readonly mediaData: IMediaData;
    readonly transform: IMediaDataTransformation;
    readonly docProperties?: DocPropertiesOptions;
}

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
export class Inline extends XmlComponent {
    private readonly extent: Extent;
    private readonly graphic: Graphic;

    public constructor({ mediaData, transform, docProperties }: InlineOptions) {
        super("wp:inline");

        this.root.push(
            new InlineAttributes({
                distT: 0,
                distB: 0,
                distL: 0,
                distR: 0,
            }),
        );

        this.extent = new Extent(transform.emus.x, transform.emus.y);
        this.graphic = new Graphic(mediaData, transform);

        this.root.push(this.extent);
        this.root.push(new EffectExtent());
        this.root.push(new DocProperties(docProperties));
        this.root.push(new GraphicFrameProperties());
        this.root.push(this.graphic);
    }
}
