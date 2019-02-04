// http://officeopenxml.com/WPsectionLineNumbering.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum LineNumberRestartFormat {
    CONTINUOUS = "continuous",
    NEW_SECTION = "newSection",
    NEW_PAGE = "newPage",
}

export interface ILineNumberAttributes {
    readonly lineNumberCountBy?: number;
    readonly lineNumberStart?: number;
    readonly lineNumberRestart?: LineNumberRestartFormat;
    readonly lineNumberDistance?: number;
}

export class LineNumberAttributes extends XmlAttributeComponent<ILineNumberAttributes> {
    protected readonly xmlKeys = {
        lineNumberCountBy: "w:countBy",
        lineNumberStart: "w:start",
        lineNumberRestart: "w:restart",
        lineNumberDistance: "w:distance",
    };
}

export class LineNumberType extends XmlComponent {
    constructor(countBy?: number, start?: number, restart?: LineNumberRestartFormat, dist?: number) {
        super("w:lnNumType");
        this.root.push(
            new LineNumberAttributes({
                lineNumberCountBy: countBy,
                lineNumberStart: start,
                lineNumberRestart: restart,
                lineNumberDistance: dist,
            }),
        );
    }
}
