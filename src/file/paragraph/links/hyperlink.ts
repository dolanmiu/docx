// http://officeopenxml.com/WPhyperlink.php

import { XmlComponent } from "file/xml-components";
import { TextRun } from "../run";
import { HyperlinkAttributes, IHyperlinkAttributesProperties } from "./hyperlink-attributes";

export class Hyperlink extends XmlComponent {
    public linkId: number;

    constructor(text: string, relationshipsCount: number, anchor?: string) {
        super("w:hyperlink");

        this.linkId = relationshipsCount + 1;

        const props: IHyperlinkAttributesProperties = {
            history: 1,
        };

        if (anchor) {
            props.anchor = anchor;
        } else {
            props.id = `rId${this.linkId}`;
        }

        const attributes = new HyperlinkAttributes(props);
        this.root.push(attributes);
        this.root.push(new TextRun(text).style("Hyperlink"));
    }
}
