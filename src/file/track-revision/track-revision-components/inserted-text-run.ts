import { IChangedAttributesProperties, ChangeAttributes } from "../track-revision";
import { XmlComponent } from "file/xml-components";
import { TextRun, IRunOptions } from "../../index";

interface IInsertedRunOptions extends IChangedAttributesProperties, IRunOptions {}

export class InsertedTextRun extends XmlComponent {
    constructor(options: IInsertedRunOptions) {
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
