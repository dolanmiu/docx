import { IMediaData, IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { GraphicDataAttributes } from "./graphic-data-attribute";
import { Pic } from "./pic";
import { OutlineOptions } from "./pic/shape-properties/outline/outline";

export class GraphicData extends XmlComponent {
    private readonly pic: Pic;

    public constructor({
        mediaData,
        transform,
        outline,
    }: {
        readonly mediaData: IMediaData;
        readonly transform: IMediaDataTransformation;
        readonly outline?: OutlineOptions;
    }) {
        super("a:graphicData");

        this.root.push(
            new GraphicDataAttributes({
                uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
            }),
        );

        this.pic = new Pic({ mediaData, transform, outline });

        this.root.push(this.pic);
    }
}
