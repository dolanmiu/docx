import { ParagraphChild } from "@file/paragraph";
import { XmlComponent } from "@file/xml-components";

export interface ITextboxContentAttributes {
    readonly children?: readonly ParagraphChild[];
}

export class TextboxContent extends XmlComponent {
    public constructor({ children }: ITextboxContentAttributes) {
        super("w:txbxContent");
        if (children) {
            for (const child of children) {
                this.root.push(child);
            }
        }
    }
}
