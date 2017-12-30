import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Inline } from "./inline";

export class Drawing extends XmlComponent {

    constructor(imageData: IMediaData) {
        super("w:drawing");

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        this.root.push(new Inline(imageData.referenceId));
    }
}
