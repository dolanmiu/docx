import { IMediaData, IMediaDataTransformation } from "@file/media";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { GraphicData } from "./graphic-data";
import { OutlineOptions } from "./graphic-data/pic/shape-properties/outline/outline";

class GraphicAttributes extends XmlAttributeComponent<{
    readonly a: string;
}> {
    protected readonly xmlKeys = {
        a: "xmlns:a",
    };
}

export class Graphic extends XmlComponent {
    private readonly data: GraphicData;

    public constructor({
        mediaData,
        transform,
        outline,
    }: {
        readonly mediaData: IMediaData;
        readonly transform: IMediaDataTransformation;
        readonly outline?: OutlineOptions;
    }) {
        super("a:graphic");
        this.root.push(
            new GraphicAttributes({
                a: "http://schemas.openxmlformats.org/drawingml/2006/main",
            }),
        );

        this.data = new GraphicData({ mediaData, transform, outline });

        this.root.push(this.data);
    }
}
