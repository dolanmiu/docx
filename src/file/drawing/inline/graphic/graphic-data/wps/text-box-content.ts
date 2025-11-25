import { Paragraph } from "@file/paragraph";
import { XmlComponent } from "@file/xml-components";

export class TextBoxContent extends XmlComponent {
    public constructor(children: readonly Paragraph[]) {
        super("w:txbxContent");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
