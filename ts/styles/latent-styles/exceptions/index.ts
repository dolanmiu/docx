import {XmlComponent} from "../../../docx/xml-components";
import {LatentStyleExceptionAttributes} from "./attributes";

export class LatentStyleException implements XmlComponent {
    private lsdException: Array<XmlComponent>;

    xmlKeys = {
        lsdException: "w:lsdException"
    }

    constructor(attributes: LatentStyleExceptionAttributes) {
        this.lsdException = new Array<XmlComponent>();
        this.lsdException.push(attributes);
    }
}