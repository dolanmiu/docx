// http://officeopenxml.com/WPsectionLineNumbering.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum LineNumberRestartFormat {
    CONTINUOUS = "continuous",
    NEW_SECTION = "newSection",
    NEW_PAGE = "newPage",
}

export interface ILineNumberAttributes {
    readonly countBy?: number;
    readonly start?: number;
    readonly restart?: LineNumberRestartFormat;
    readonly distance?: number;
}

export class LineNumberAttributes extends XmlAttributeComponent<ILineNumberAttributes> {
    protected readonly xmlKeys = {
        countBy: "w:countBy",
        start: "w:start",
        restart: "w:restart",
        distance: "w:distance",
    };
}

export class LineNumberType extends XmlComponent {
    constructor(countBy?: number, start?: number, restart?: LineNumberRestartFormat, dist?: number) {
        super("w:lnNumType");
        this.root.push(
            new LineNumberAttributes({
                countBy: countBy,
                start: start,
                restart: restart,
                distance: dist,
            }),
        );
    }
}
