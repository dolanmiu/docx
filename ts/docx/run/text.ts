import { XmlComponent } from "../xml-components";

export class Text extends XmlComponent {

    constructor(text: string) {
        super("w:t");
        if (text) {
            this.root.push(text);
        }
    }
}
