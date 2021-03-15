// http://officeopenxml.com/drwPicInline.php
import { IMediaData, IMediaDataTransformation } from "file/media";
import { XmlComponent } from "file/xml-components";
import { DocProperties } from "./../doc-properties/doc-properties";
import { EffectExtent } from "./../effect-extent/effect-extent";
import { Extent } from "./../extent/extent";
import { GraphicFrameProperties } from "./../graphic-frame/graphic-frame-properties";
import { Graphic } from "./../inline/graphic";
import { InlineAttributes } from "./inline-attributes";

export class Inline extends XmlComponent {
    private readonly extent: Extent;
    private readonly graphic: Graphic;

    constructor(mediaData: IMediaData, private readonly transform: IMediaDataTransformation) {
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
        this.root.push(new DocProperties());
        this.root.push(new GraphicFrameProperties());
        this.root.push(this.graphic);
    }

    public scale(factorX: number, factorY: number): void {
        const newX = Math.round(this.transform.emus.x * factorX);
        const newY = Math.round(this.transform.emus.y * factorY);

        this.extent.setXY(newX, newY);
        this.graphic.setXY(newX, newY);
    }
}
