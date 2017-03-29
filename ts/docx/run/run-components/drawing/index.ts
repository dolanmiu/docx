import { IData } from "../../../../media/data";
import { XmlComponent } from "../../../xml-components";
import { Inline } from "./inline";

export class Drawing extends XmlComponent {

    constructor(imageData: IData) {
        super("w:drawing");

        this.root.push(new Inline(imageData.referenceId));
    }
}
