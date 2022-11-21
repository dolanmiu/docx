// http://officeopenxml.com/WPtext.php
import { XmlComponent } from "@file/xml-components";

import { FootnoteReferenceRun } from "@file/footnotes/footnote/run/reference-run";
import { FieldInstruction } from "@file/table-of-contents/field-instruction";

import { Break } from "./break";
import { Begin, End, Separate } from "./field";
import { NumberOfPages, NumberOfPagesSection, Page } from "./page-number";
import { IRunPropertiesOptions, RunProperties } from "./properties";
import { Text } from "./run-components/text";
import { Tab } from "./tab";

export interface IRunOptions extends IRunPropertiesOptions {
    readonly children?: readonly (Begin | FieldInstruction | Separate | End | PageNumber | FootnoteReferenceRun | Tab | string)[];
    readonly break?: number;
    readonly text?: string;
}

export enum PageNumber {
    CURRENT = "CURRENT",
    TOTAL_PAGES = "TOTAL_PAGES",
    TOTAL_PAGES_IN_SECTION = "TOTAL_PAGES_IN_SECTION",
}

export class Run extends XmlComponent {
    protected readonly properties: RunProperties;

    public constructor(options: IRunOptions) {
        super("w:r");
        this.properties = new RunProperties(options);
        this.root.push(this.properties);

        if (options.break) {
            for (let i = 0; i < options.break; i++) {
                this.root.push(new Break());
            }
        }

        if (options.children) {
            for (const child of options.children) {
                if (typeof child === "string") {
                    switch (child) {
                        case PageNumber.CURRENT:
                            this.root.push(new Begin());
                            this.root.push(new Page());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        case PageNumber.TOTAL_PAGES:
                            this.root.push(new Begin());
                            this.root.push(new NumberOfPages());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        case PageNumber.TOTAL_PAGES_IN_SECTION:
                            this.root.push(new Begin());
                            this.root.push(new NumberOfPagesSection());
                            this.root.push(new Separate());
                            this.root.push(new End());
                            break;
                        default:
                            this.root.push(new Text(child));
                            break;
                    }
                    continue;
                }

                this.root.push(child);
            }
        } else if (options.text) {
            this.root.push(new Text(options.text));
        }
    }
}
