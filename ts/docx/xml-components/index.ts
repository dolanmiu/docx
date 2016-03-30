export interface XmlComponent {

}

interface AttributesProperties {
    val?: any;
    color?: string;
    space?: string;
    sz?: string;
    type?: string;
}

export class Attributes implements XmlComponent {
    private _attrs: Object;

    constructor(properties?: AttributesProperties) {
        this._attrs = properties

        if (!properties) {
            this._attrs = {};
        }
    }
}

export class Text implements XmlComponent {
    private t: string;

    constructor(text: string) {
        this.t = text;
    }
}