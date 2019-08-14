import { XmlComponent } from "file/xml-components";

export class MathText extends XmlComponent {
    constructor(readonly text: string) {
        super("m:t");

        this.root.push(text);
    }
}
