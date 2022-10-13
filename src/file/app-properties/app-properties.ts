import { XmlComponent } from "@file/xml-components";
import { AppPropertiesAttributes } from "./app-properties-attributes";

export class AppProperties extends XmlComponent {
    public constructor() {
        super("Properties");

        this.root.push(
            new AppPropertiesAttributes({
                xmlns: "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties",
                vt: "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes",
            }),
        );
    }
}
