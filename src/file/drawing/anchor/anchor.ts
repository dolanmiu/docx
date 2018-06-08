// http://officeopenxml.com/drwPicFloating.php
import { IMediaDataDimensions } from "file/media";
import { XmlComponent } from "file/xml-components";
import { DocProperties } from "./../doc-properties/doc-properties";
import { EffectExtent } from "./../effect-extent/effect-extent";
import { Extent } from "./../extent/extent";
import { Graphic } from "./../graphic";
import { GraphicFrameProperties } from "./../graphic-frame/graphic-frame-properties";
import { AnchorAttributes } from "./anchor-attributes";
import { DrawingOptions } from "../drawing";
import {
    SimplePos,
    HorizontalPosition,
    VerticalPosition,
    Floating,
    VerticalPositionRelativeFrom,
    HorizontalPositionRelativeFrom,
} from "../floating";
import { WrapNone, TextWrapStyle, WrapSquare, WrapTight, WrapTopAndBottom } from "../text-wrap";

const defaultOptions: Floating = {
    allowOverlap: true,
    behindDocument: false,
    lockAnchor: false,
    layoutInCell: true,
    verticalPosition: {
        relative: VerticalPositionRelativeFrom.PARAGRAPH,
        offset: 0,
    },
    horizontalPosition: {
        relative: HorizontalPositionRelativeFrom.COLUMN,
        offset: 0,
    },
};

export class Anchor extends XmlComponent {
    constructor(referenceId: number, dimensions: IMediaDataDimensions, drawingOptions: DrawingOptions) {
        super("wp:anchor");

        const floating = {
            ...defaultOptions,
            ...drawingOptions.floating,
        };
        this.root.push(
            new AnchorAttributes({
                distT: 0,
                distB: 0,
                distL: 0,
                distR: 0,
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

        if (drawingOptions.textWrapping != null) {
            switch (drawingOptions.textWrapping.textWrapStyle) {
                case TextWrapStyle.SQUARE:
                    this.root.push(new WrapSquare(drawingOptions.textWrapping));
                    break;
                case TextWrapStyle.TIGHT:
                    this.root.push(new WrapTight(drawingOptions.textWrapping.distanceFromText));
                    break;
                case TextWrapStyle.TOP_AND_BOTTOM:
                    this.root.push(new WrapTopAndBottom(drawingOptions.textWrapping.distanceFromText));
                    break;
                case TextWrapStyle.NONE:
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
