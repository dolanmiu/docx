// http://officeopenxml.com/WPstyleGenProps.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { decimalNumber } from "@util/values";

class ComponentAttributes extends XmlAttributeComponent<{
    readonly val: string | number;
}> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class Name extends XmlComponent {
    public constructor(value: string) {
        super("w:name");
        this.root.push(new ComponentAttributes({ val: value }));
    }
}

export class UiPriority extends XmlComponent {
    public constructor(value: number) {
        super("w:uiPriority");
        this.root.push(new ComponentAttributes({ val: decimalNumber(value) }));
    }
}

export class TableProperties extends XmlComponent {}

export class RsId extends XmlComponent {}
