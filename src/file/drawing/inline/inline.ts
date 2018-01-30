// http://officeopenxml.com/drwPicInline.php
import { IMediaDataDimensions } from "file/media";
import { XmlComponent } from "file/xml-components";
import { DocProperties } from "./doc-properties/doc-properties";
import { EffectExtent } from "./effect-extent/effect-extent";
import { Extent } from "./extent/extent";
import { Graphic } from "./graphic";
import { GraphicFrameProperties } from "./graphic-frame/graphic-frame-properties";
import { InlineAttributes } from "./inline-attributes";

export class Inline extends XmlComponent {
    constructor(referenceId: number, dimensions: IMediaDataDimensions) {
        super("wp:inline");

        this.root.push(
            new InlineAttributes({
                distT: 0,
                distB: 0,
                distL: 0,
                distR: 0,
            }),
        );

        this.root.push(new Extent(dimensions.emus.x, dimensions.emus.y));
        this.root.push(new EffectExtent());
        this.root.push(new DocProperties());
        this.root.push(new GraphicFrameProperties());
        this.root.push(new Graphic(referenceId, dimensions.emus.x, dimensions.emus.y));
    }
}
