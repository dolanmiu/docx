// http://officeopenxml.com/WPhyperlink.php
import { uniqueId } from "convenience-functions";
import { XmlComponent } from "file/xml-components";

import { ParagraphChild } from "../paragraph";
import { HyperlinkAttributes, IHyperlinkAttributesProperties } from "./hyperlink-attributes";

export enum HyperlinkType {
    INTERNAL = "INTERNAL",
    EXTERNAL = "EXTERNAL",
}

export class ConcreteHyperlink extends XmlComponent {
    public readonly linkId: string;

    constructor(children: ParagraphChild[], relationshipId: string, anchor?: string) {
        super("w:hyperlink");

        this.linkId = relationshipId;

        const props: IHyperlinkAttributesProperties = {
            history: 1,
            anchor: anchor ? anchor : undefined,
            id: !anchor ? `rId${this.linkId}` : undefined,
        };

        const attributes = new HyperlinkAttributes(props);
        this.root.push(attributes);
        children.forEach((child) => {
            this.root.push(child);
        });
    }
}

export class InternalHyperlink extends ConcreteHyperlink {
    constructor(options: { readonly children: ParagraphChild[]; readonly anchor: string }) {
        super(options.children, uniqueId(), options.anchor);
    }
}

export class ExternalHyperlink {
    constructor(public readonly options: { readonly children: ParagraphChild[]; readonly link: string }) {}
}
