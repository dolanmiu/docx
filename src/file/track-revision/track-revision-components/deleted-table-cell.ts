import { XmlComponent } from "@file/xml-components";

import { ChangeAttributes, type IChangedAttributesProperties } from "../track-revision";

export class DeletedTableCell extends XmlComponent {
    public constructor(options: IChangedAttributesProperties) {
        super("w:cellDel");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
    }
}
