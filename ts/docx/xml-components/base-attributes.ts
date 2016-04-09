import {XmlComponent} from "./";

export abstract class BaseAttributes extends XmlComponent {
    private _attr: Object;

    xmlKeys = {};

    constructor(xmlKeys: Object, properties?: any) {
        super("_attr");
        this._attr = properties

        if (!properties) {
            this._attr = {};
        }
        this._attr["xmlKeys"] = this.xmlKeys;
    }
}