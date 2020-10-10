import { XmlComponent } from "file/xml-components";

export class MathText extends XmlComponent {
    constructor(text: string) {
        super("m:t");

        this.root.push(text);
    }
}
