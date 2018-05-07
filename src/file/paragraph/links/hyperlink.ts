// http://officeopenxml.com/WPhyperlink.php
import { XmlComponent } from "file/xml-components";
import { TextRun } from "../run";
import { HyperlinkAttributes } from "./hyperlink-attributes";

export class Hyperlink extends XmlComponent {
    public linkId: number;

    constructor(text: string, relationshipsCount: number) {
        super("w:hyperlink");

        this.linkId = relationshipsCount + 1;
        this.root.push(new HyperlinkAttributes({
            id: `rId${this.linkId}`,
            history: 1,
        }));
        this.root.push(new TextRun(text).style("Hyperlink"));
        return this;
    }
}
