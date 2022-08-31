import { IMediaData, IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { GraphicDataAttributes } from "./graphic-data-attribute";
import { Pic } from "./pic";

export class GraphicData extends XmlComponent {
    private readonly pic: Pic;

    public constructor(mediaData: IMediaData, transform: IMediaDataTransformation) {
        super("a:graphicData");

        this.root.push(
            new GraphicDataAttributes({
                uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
            }),
        );

        this.pic = new Pic(mediaData, transform);

        this.root.push(this.pic);
    }
}
