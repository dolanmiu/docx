// http://officeopenxml.com/drwPicFloating.php
import { IMediaDataDimensions } from "file/media";
import { XmlComponent } from "file/xml-components";
import { IDrawingOptions } from "../drawing";
import { HorizontalPosition, IFloating, SimplePos, VerticalPosition } from "../floating";
import { Graphic } from "../inline/graphic";
import { TextWrappingType, WrapNone, WrapSquare, WrapTight, WrapTopAndBottom } from "../text-wrap";
import { DocProperties } from "./../doc-properties/doc-properties";
import { EffectExtent } from "./../effect-extent/effect-extent";
import { Extent } from "./../extent/extent";
import { GraphicFrameProperties } from "./../graphic-frame/graphic-frame-properties";
import { AnchorAttributes } from "./anchor-attributes";

const defaultOptions: IFloating = {
    allowOverlap: true,
    behindDocument: false,
    lockAnchor: false,
    layoutInCell: true,
    verticalPosition: {},
    horizontalPosition: {},
};

export class Anchor extends XmlComponent {
    constructor(referenceId: number, dimensions: IMediaDataDimensions, drawingOptions: IDrawingOptions) {
        super("wp:anchor");

        const floating = {
            margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            },
            ...defaultOptions,
            ...drawingOptions.floating,
        };

        this.root.push(
            new AnchorAttributes({
                distT: floating.margins.top || 0,
                distB: floating.margins.bottom || 0,
                distL: floating.margins.left || 0,
                distR: floating.margins.right || 0,
                simplePos: "0", // note: word doesn't fully support - so we use 0
                allowOverlap: floating.allowOverlap === true ? "1" : "0",
                behindDoc: floating.behindDocument === true ? "1" : "0",
                locked: floating.lockAnchor === true ? "1" : "0",
                layoutInCell: floating.layoutInCell === true ? "1" : "0",
                relativeHeight: dimensions.emus.y,
            }),
        );

        this.root.push(new SimplePos());
        this.root.push(new HorizontalPosition(floating.horizontalPosition));
        this.root.push(new VerticalPosition(floating.verticalPosition));
        this.root.push(new Extent(dimensions.emus.x, dimensions.emus.y));
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

        this.root.push(new DocProperties());
        this.root.push(new GraphicFrameProperties());
        this.root.push(new Graphic(referenceId, dimensions.emus.x, dimensions.emus.y));
    }
}
