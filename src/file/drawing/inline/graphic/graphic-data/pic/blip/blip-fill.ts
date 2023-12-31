import { IMediaData } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { createBlip } from "./blip";
import { SourceRectangle } from "./source-rectangle";
import { Stretch } from "./stretch";

export class BlipFill extends XmlComponent {
    public constructor(mediaData: IMediaData) {
        super("pic:blipFill");

        this.root.push(createBlip(mediaData));
        this.root.push(new SourceRectangle());
        this.root.push(new Stretch());
    }
}
