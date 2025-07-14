import { WpsShape } from "@file/drawing/inline/graphic/graphic-data/wps/wps-shape";
import { IExtendedMediaData, IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { GraphicDataAttributes } from "./graphic-data-attribute";
import { Pic } from "./pic";
import { OutlineOptions } from "./pic/shape-properties/outline/outline";
import { SolidFillOptions } from "./pic/shape-properties/outline/solid-fill";

export class GraphicData extends XmlComponent {
    // private readonly pic: Pic;

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
        super("a:graphicData");

        if (mediaData.type === "wps") {
            this.root.push(
                new GraphicDataAttributes({
                    uri: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                }),
            );
        } else {
            this.root.push(
                new GraphicDataAttributes({
                    uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
                }),
            );
        }

        if (mediaData.type !== "wps") {
            const pic = new Pic({ mediaData, transform, outline });
            this.root.push(pic);
        } else {
            const wps = new WpsShape({ ...mediaData.data, transformation: transform, outline, solidFill });
            this.root.push(wps);
        }
    }
}
