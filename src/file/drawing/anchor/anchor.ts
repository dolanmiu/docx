// http://officeopenxml.com/drwPicFloating.php
import { IMediaData, IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";
import { IDrawingOptions } from "../drawing";
import { HorizontalPosition, IFloating, SimplePos, VerticalPosition } from "../floating";
import { Graphic } from "../inline/graphic";
import { TextWrappingType, WrapNone, WrapSquare, WrapTight, WrapTopAndBottom } from "../text-wrap";
import { DocProperties } from "./../doc-properties/doc-properties";
import { EffectExtent } from "./../effect-extent/effect-extent";
import { Extent } from "./../extent/extent";
import { GraphicFrameProperties } from "./../graphic-frame/graphic-frame-properties";
import { AnchorAttributes } from "./anchor-attributes";

// <xsd:complexType name="CT_Anchor">
//     <xsd:sequence>
//         <xsd:element name="simplePos" type="a:CT_Point2D"/>
//         <xsd:element name="positionH" type="CT_PosH"/>
//         <xsd:element name="positionV" type="CT_PosV"/>
//         <xsd:element name="extent" type="a:CT_PositiveSize2D"/>
//         <xsd:element name="effectExtent" type="CT_EffectExtent" minOccurs="0"/>
//         <xsd:group ref="EG_WrapType"/>
//         <xsd:element name="docPr" type="a:CT_NonVisualDrawingProps" minOccurs="1" maxOccurs="1"/>
//         <xsd:element name="cNvGraphicFramePr" type="a:CT_NonVisualGraphicFrameProperties"
//             minOccurs="0" maxOccurs="1"/>
//         <xsd:element ref="a:graphic" minOccurs="1" maxOccurs="1"/>
//     </xsd:sequence>
//     <xsd:attribute name="distT" type="ST_WrapDistance" use="optional"/>
//     <xsd:attribute name="distB" type="ST_WrapDistance" use="optional"/>
//     <xsd:attribute name="distL" type="ST_WrapDistance" use="optional"/>
//     <xsd:attribute name="distR" type="ST_WrapDistance" use="optional"/>
//     <xsd:attribute name="simplePos" type="xsd:boolean"/>
//     <xsd:attribute name="relativeHeight" type="xsd:unsignedInt" use="required"/>
//     <xsd:attribute name="behindDoc" type="xsd:boolean" use="required"/>
//     <xsd:attribute name="locked" type="xsd:boolean" use="required"/>
//     <xsd:attribute name="layoutInCell" type="xsd:boolean" use="required"/>
//     <xsd:attribute name="hidden" type="xsd:boolean" use="optional"/>
//     <xsd:attribute name="allowOverlap" type="xsd:boolean" use="required"/>
// </xsd:complexType>
export class Anchor extends XmlComponent {
    public constructor(mediaData: IMediaData, transform: IMediaDataTransformation, drawingOptions: IDrawingOptions) {
        super("wp:anchor");

        const floating: IFloating = {
            allowOverlap: true,
            behindDocument: false,
            lockAnchor: false,
            layoutInCell: true,
            verticalPosition: {},
            horizontalPosition: {},
            ...drawingOptions.floating,
        };

        this.root.push(
            new AnchorAttributes({
                distT: floating.margins ? floating.margins.top || 0 : 0,
                distB: floating.margins ? floating.margins.bottom || 0 : 0,
                distL: floating.margins ? floating.margins.left || 0 : 0,
                distR: floating.margins ? floating.margins.right || 0 : 0,
                simplePos: "0", // note: word doesn't fully support - so we use 0
                allowOverlap: floating.allowOverlap === true ? "1" : "0",
                behindDoc: floating.behindDocument === true ? "1" : "0",
                locked: floating.lockAnchor === true ? "1" : "0",
                layoutInCell: floating.layoutInCell === true ? "1" : "0",
                relativeHeight: floating.zIndex ? floating.zIndex : transform.emus.y,
            }),
        );

        this.root.push(new SimplePos());
        this.root.push(new HorizontalPosition(floating.horizontalPosition));
        this.root.push(new VerticalPosition(floating.verticalPosition));
        this.root.push(new Extent(transform.emus.x, transform.emus.y));
        this.root.push(new EffectExtent());

        if (drawingOptions.floating !== undefined && drawingOptions.floating.wrap !== undefined) {
            switch (drawingOptions.floating.wrap.type) {
                case TextWrappingType.SQUARE:
                    this.root.push(new WrapSquare(drawingOptions.floating.wrap, drawingOptions.floating.margins));
                    break;
                case TextWrappingType.TIGHT:
                    this.root.push(new WrapTight(drawingOptions.floating.margins));
                    break;
                case TextWrappingType.TOP_AND_BOTTOM:
                    this.root.push(new WrapTopAndBottom(drawingOptions.floating.margins));
                    break;
                case TextWrappingType.NONE:
                default:
                    this.root.push(new WrapNone());
            }
        } else {
            this.root.push(new WrapNone());
        }

        this.root.push(new DocProperties(drawingOptions.docProperties));
        this.root.push(new GraphicFrameProperties());
        this.root.push(new Graphic(mediaData, transform));
    }
}
