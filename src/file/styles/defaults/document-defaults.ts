import { IParagraphStylePropertiesOptions } from "@file/paragraph/properties";
import { IRunStylePropertiesOptions } from "@file/paragraph/run/properties";
import { XmlComponent } from "@file/xml-components";
import { ParagraphPropertiesDefaults } from "./paragraph-properties";
import { RunPropertiesDefaults } from "./run-properties";

export interface IDocumentDefaultsOptions {
    readonly paragraph?: IParagraphStylePropertiesOptions;
    readonly run?: IRunStylePropertiesOptions;
}

export class DocumentDefaults extends XmlComponent {
    private readonly runPropertiesDefaults: RunPropertiesDefaults;
    private readonly paragraphPropertiesDefaults: ParagraphPropertiesDefaults;

    public constructor(options: IDocumentDefaultsOptions) {
        super("w:docDefaults");

        this.runPropertiesDefaults = new RunPropertiesDefaults(options.run);
        this.paragraphPropertiesDefaults = new ParagraphPropertiesDefaults(options.paragraph);

        this.root.push(this.runPropertiesDefaults);
        this.root.push(this.paragraphPropertiesDefaults);
    }
}
