import { XmlComponent } from "file/xml-components";
import { Alias } from "./alias";

export class SdtProperties extends XmlComponent {
    constructor(alias: string) {
        super("w:sdtPr");
        this.root.push(new Alias(alias));
    }
}
