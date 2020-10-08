// http://officeopenxml.com/WPhyperlink.php
import { XmlComponent } from "file/xml-components";
import { TextRun } from "../run";
import { HyperlinkAttributes, IHyperlinkAttributesProperties } from "./hyperlink-attributes";

export enum HyperlinkType {
    INTERNAL = "INTERNAL",
    EXTERNAL = "EXTERNAL",
}

export class HyperlinkRef {
    constructor(public readonly id: string) {}
}

export class Hyperlink extends XmlComponent {
    public readonly linkId: string;
    private readonly textRun: TextRun;

    constructor(text: string, relationshipId: string, anchor?: string) {
        super("w:hyperlink");

        this.linkId = relationshipId;

        const props: IHyperlinkAttributesProperties = {
            history: 1,
            anchor: anchor ? anchor : undefined,
            id: !anchor ? `rId${this.linkId}` : undefined,
        };

        const attributes = new HyperlinkAttributes(props);
        this.root.push(attributes);
        this.textRun = new TextRun({
            text: text,
            style: "Hyperlink",
        });
        this.root.push(this.textRun);
    }

    public get TextRun(): TextRun {
        return this.textRun;
    }
}
