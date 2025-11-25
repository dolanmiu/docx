import { IExtendedMediaData, IMediaDataTransformation } from "@file/media";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { GraphicData } from "./graphic-data";
import { OutlineOptions } from "./graphic-data/pic/shape-properties/outline/outline";
import { SolidFillOptions } from "./graphic-data/pic/shape-properties/outline/solid-fill";

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
        solidFill,
    }: {
        readonly mediaData: IExtendedMediaData;
        readonly transform: IMediaDataTransformation;
        readonly outline?: OutlineOptions;
        readonly solidFill?: SolidFillOptions;
    }) {
        super("a:graphic");
        this.root.push(
            new GraphicAttributes({
                a: "http://schemas.openxmlformats.org/drawingml/2006/main",
            }),
        );

        this.data = new GraphicData({ mediaData, transform, outline, solidFill });

        this.root.push(this.data);
    }
}
