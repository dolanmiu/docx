import { ParagraphChild } from "@file/paragraph";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { VTextbox } from "../vtextbox/vtexbox";

export interface IShapeOptions {
    readonly id: string;
    readonly children?: readonly ParagraphChild[];
    readonly type?: string;
    readonly style?: string;
}

class ShapeAttributes extends XmlAttributeComponent<{
    readonly id: string;
    readonly type?: string;
    readonly style?: string;
}> {
    protected readonly xmlKeys = { id: "id", type: "type", style: "style" };
}

export class Shape extends XmlComponent {
    public constructor({ id, children, type, style }: IShapeOptions) {
        super("v:shape");
        this.root.push(
            new ShapeAttributes({
                id,
                type,
                style,
            }),
        );
        const vTextbox = new VTextbox({ style: "mso-fit-shape-to-text:t;", children });
        this.root.push(vTextbox);
    }
}
