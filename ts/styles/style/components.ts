import {XmlComponent} from "../../docx/xml-components";
import {StyleAttributes} from "./attributes";

export class Name extends XmlComponent {

    constructor(value: string) {
        super("w:name");
        this.root.push(new StyleAttributes({
            val: value
        }));
    }
}

export class BasedOn extends XmlComponent {

    constructor(value: string) {
        super("w:basedOn");
        this.root.push(new StyleAttributes({
            val: value
        }));
    }
}

export class Next extends XmlComponent {

    constructor(value: string) {
        super("w:next");
        this.root.push(new StyleAttributes({
            styleId: "1",
            val: value
        }));
    }
}

export class Link extends XmlComponent {

    constructor(value: string) {
        super("w:link");
        this.root.push(new StyleAttributes({
            val: value
        }));
    }
}

export class UiPriority extends XmlComponent {

    constructor(value: string) {
        super("w:uiPriority");
        this.root.push(new StyleAttributes({
            val: value
        }));
    }
}

export class UnhideWhenUsed extends XmlComponent {

}

export class QuickFormat extends XmlComponent {
    
    constructor() {
        super("w:qFormat");
    }
}

export class TableProperties extends XmlComponent {

}

export class RsId extends XmlComponent {

}

export class SemiHidden extends XmlComponent {

}