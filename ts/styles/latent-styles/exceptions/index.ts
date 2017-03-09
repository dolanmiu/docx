import { XmlComponent } from "../../../docx/xml-components";
import { LatentStyleExceptionAttributes } from "./attributes";

export class LatentStyleException extends XmlComponent {

    constructor(attributes: LatentStyleExceptionAttributes) {
        super("w:lsdException");
        this.root.push(attributes);
    }
}
