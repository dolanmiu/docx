// http://officeopenxml.com/WPdocument.php
// http://www.datypic.com/sc/ooxml/e-w_background-1.html
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class DocumentBackgroundAttributes extends XmlAttributeComponent<{
    readonly color: string;
    readonly themeColor?: string;
    readonly themeShade?: string;
    readonly themeTint?: string;
}> {
    protected readonly xmlKeys = {
        color: "w:color",
        themeColor: "w:themeColor",
        themeShade: "w:themeShade",
        themeTint: "w:themeTint",
    };
}

export interface IDocumentBackgroundOptions {
    readonly color?: string;
    readonly themeColor?: string;
    readonly themeShade?: string;
    readonly themeTint?: string;
}

export class DocumentBackground extends XmlComponent {
    constructor(options: IDocumentBackgroundOptions) {
        super("w:background");

        this.root.push(
            new DocumentBackgroundAttributes({
                color: options.color ? options.color : "FFFFFF",
                themeColor: options.themeColor,
                themeShade: options.themeShade,
                themeTint: options.themeTint,
            }),
        );
    }
}
