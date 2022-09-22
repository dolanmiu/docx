import { XmlComponent } from "@file/xml-components";
import { DefaultAttributes } from "./default-attributes";

export class Default extends XmlComponent {
    public constructor(contentType: string, extension?: string) {
        super("Default");

        this.root.push(
            new DefaultAttributes({
                contentType: contentType,
                extension: extension,
            }),
        );
    }
}
