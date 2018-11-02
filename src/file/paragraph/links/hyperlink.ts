// http://officeopenxml.com/WPhyperlink.php
import { XmlComponent } from "file/xml-components";
import { TextRun } from "../run";
import { HyperlinkAttributes, IHyperlinkAttributesProperties } from "./hyperlink-attributes";

export class Hyperlink extends XmlComponent {
    public readonly linkId: number;

    constructor(text: string, relationshipsCount: number, anchor?: string) {
        super("w:hyperlink");

        this.linkId = relationshipsCount + 1;

        const props: IHyperlinkAttributesProperties = {
            history: 1,
            anchor: anchor ? anchor : undefined,
            id: !anchor ? `rId${this.linkId}` : undefined,
        };

        const attributes = new HyperlinkAttributes(props);
        this.root.push(attributes);
        this.root.push(new TextRun(text).style("Hyperlink"));
    }
}
