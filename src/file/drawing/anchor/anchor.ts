// http://officeopenxml.com/drwPicFloating.php
import { IMediaData, IMediaDataDimensions } from "file/media";
import { XmlComponent } from "file/xml-components";
import { IDrawingOptions } from "../drawing";
import {
    HorizontalPosition,
    HorizontalPositionRelativeFrom,
    IFloating,
    SimplePos,
    VerticalPosition,
    VerticalPositionRelativeFrom,
} from "../floating";
import { Graphic } from "../inline/graphic";
import { TextWrapStyle, WrapNone, WrapSquare, WrapTight, WrapTopAndBottom } from "../text-wrap";
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
    constructor(mediaData: IMediaData, dimensions: IMediaDataDimensions, drawingOptions: IDrawingOptions) {
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

        if (drawingOptions.textWrapping !== undefined) {
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
        this.root.push(new Graphic(mediaData, dimensions.emus.x, dimensions.emus.y));
    }
}
