import { ParagraphChild } from "@file/paragraph";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { TextboxContent } from "../texbox-content/textbox-content";

export interface IVTextboxOptions {
    readonly style?: string;
    readonly children?: readonly ParagraphChild[];
}

class VtextboxAttributes extends XmlAttributeComponent<{ readonly style?: string }> {
    protected readonly xmlKeys = { style: "style" };
}

export class VTextbox extends XmlComponent {
    public constructor({ style, children }: IVTextboxOptions) {
        super("v:textbox");
        this.root.push(new VtextboxAttributes({ style }));
        const textboxContent = new TextboxContent({ children });
        this.root.push(textboxContent);
    }
}
