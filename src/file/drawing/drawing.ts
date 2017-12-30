import { IData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Inline } from "./inline";

export class Drawing extends XmlComponent {

    constructor(imageData: IData) {
        super("w:drawing");

        if (imageData === undefined) {
            throw new Error("imageData cannot be undefined");
        }

        this.root.push(new Inline(imageData.referenceId));
    }
}
