import { XmlComponent } from "../../../xml-components";
import { Inline } from "./inline";

export class Drawing extends XmlComponent {

    constructor(imagePath: string) {
        super("w:drawing");

        // store in the document, then get Id

        this.root.push(new Inline(5));
    }
}
