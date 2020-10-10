import { XmlComponent } from "file/xml-components";

import { FootnoteReferenceRun, IRunOptions, IRunPropertiesOptions, RunProperties } from "../../index";
import { Break } from "../../paragraph/run/break";
import { Begin, End, Separate } from "../../paragraph/run/field";
import { PageNumber } from "../../paragraph/run/run";
import { ChangeAttributes, IChangedAttributesProperties } from "../track-revision";
import { DeletedNumberOfPages, DeletedNumberOfPagesSection, DeletedPage } from "./deleted-page-number";
import { DeletedText } from "./deleted-text";

interface IDeletedRunOptions extends IRunPropertiesOptions, IChangedAttributesProperties {
    readonly children?: (Begin | Separate | End | PageNumber | FootnoteReferenceRun | string)[];
    readonly text?: string;
}

export class DeletedTextRun extends XmlComponent {
    protected readonly deletedTextRunWrapper: DeletedTextRunWrapper;

    constructor(options: IDeletedRunOptions) {
        super("w:del");
        this.root.push(
            new ChangeAttributes({
                id: options.id,
                author: options.author,
                date: options.date,
            }),
        );
        this.deletedTextRunWrapper = new DeletedTextRunWrapper(options as IRunOptions);
        this.addChildElement(this.deletedTextRunWrapper);
    }

    public break(): DeletedTextRun {
        this.deletedTextRunWrapper.break();
        return this;
    }
}

class DeletedTextRunWrapper extends XmlComponent {
    constructor(options: IRunOptions) {
        super("w:r");
        this.root.push(new RunProperties(options));

        if (options.children) {
            for (const child of options.children) {
                if (typeof child === "string") {
                    switch (child) {
                        case PageNumber.CURRENT:
                            this.root.push(new Begin());
                            this.root.push(new DeletedPage());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        case PageNumber.TOTAL_PAGES:
                            this.root.push(new Begin());
                            this.root.push(new DeletedNumberOfPages());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        case PageNumber.TOTAL_PAGES_IN_SECTION:
                            this.root.push(new Begin());
                            this.root.push(new DeletedNumberOfPagesSection());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        default:
                            this.root.push(new DeletedText(child));
                            break;
                    }
                    continue;
                }

                this.root.push(child);
            }
        } else if (options.text) {
            this.root.push(new DeletedText(options.text));
        }
    }

    public break(): void {
        this.root.splice(1, 0, new Break());
    }
}
