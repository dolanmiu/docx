import { XmlComponent } from "file/xml-components";

import { TableOfContentsProperties } from "./properties";

export class TableOfContents extends XmlComponent {
    private readonly properties: TableOfContentsProperties;

    constructor(properties?: TableOfContentsProperties) {
        super("w:std");
        this.properties = properties || new TableOfContentsProperties();
    }
}
