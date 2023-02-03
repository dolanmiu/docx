import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { twipsMeasureValue } from "@util/values";

export interface IColumnAttributes {
    readonly width: number | string;
    readonly space?: number | string;
}

export class ColumnAttributes extends XmlAttributeComponent<IColumnAttributes> {
    protected readonly xmlKeys = {
        width: "w:w",
        space: "w:space",
    };
}

export class Column extends XmlComponent {
    public constructor({ width, space }: IColumnAttributes) {
        super("w:col");
        this.root.push(
            new ColumnAttributes({
                width: twipsMeasureValue(width),
                space: space === undefined ? undefined : twipsMeasureValue(space),
            }),
        );
    }
}
