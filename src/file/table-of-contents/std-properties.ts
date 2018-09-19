import { XmlComponent } from "file/xml-components";
import { Alias } from "./alias";

export class StdProperties extends XmlComponent {
    constructor(alias: string) {
        super("w:stdPr");
        this.root.push(new Alias(alias));
    }
}
