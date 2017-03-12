import { XmlComponent } from "../../../xml-components";

export class Drawing extends XmlComponent {

    constructor(imagePath: string) {
        super("w:drawing");
    }
}
