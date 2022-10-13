import { XmlComponent } from "@file/xml-components";

import { IRunOptions, TextRun } from "../../index";
import { ChangeAttributes, IChangedAttributesProperties } from "../track-revision";

interface IInsertedRunOptions extends IChangedAttributesProperties, IRunOptions {}

export class InsertedTextRun extends XmlComponent {
    public constructor(options: IInsertedRunOptions) {
        super("w:ins");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        this.addChildElement(new TextRun(options as IRunOptions));
    }
}
