import { XmlComponent } from "@file/xml-components";

import { ChangeAttributes, IChangedAttributesProperties } from "../track-revision";

export class InsertedTableCell extends XmlComponent {
    public constructor(options: IChangedAttributesProperties) {
        super("w:cellIns");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
    }
}
