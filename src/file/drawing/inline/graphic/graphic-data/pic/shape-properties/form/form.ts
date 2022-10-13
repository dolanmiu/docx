// http://officeopenxml.com/drwSp-size.php
// http://officeopenxml.com/drwSp-rotate.php
import { IMediaDataTransformation } from "@file/media";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { Extents } from "./extents/extents";
import { Offset } from "./offset/off";

export class FormAttributes extends XmlAttributeComponent<{
    readonly flipVertical?: boolean;
    readonly flipHorizontal?: boolean;
    readonly rotation?: number;
}> {
    protected readonly xmlKeys = {
        flipVertical: "flipV",
        flipHorizontal: "flipH",
        rotation: "rot",
    };
}

export class Form extends XmlComponent {
    private readonly extents: Extents;

    public constructor(options: IMediaDataTransformation) {
        super("a:xfrm");

        this.root.push(
            new FormAttributes({
                flipVertical: options.flip?.vertical,
                flipHorizontal: options.flip?.horizontal,
                rotation: options.rotation,
            }),
        );

        this.extents = new Extents(options.emus.x, options.emus.y);

        this.root.push(new Offset());
        this.root.push(this.extents);
    }
}
