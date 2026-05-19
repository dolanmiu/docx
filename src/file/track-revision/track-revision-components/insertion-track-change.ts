import { XmlComponent } from "@file/xml-components";

import { ChangeAttributes, type IChangedAttributesProperties } from "../track-revision";

export class InsertionTrackChange extends XmlComponent {
    public constructor(options: IChangedAttributesProperties) {
        super("w:ins");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
    }
}
