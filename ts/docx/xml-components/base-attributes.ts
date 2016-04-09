import {XmlComponent} from "./";

export abstract class BaseAttributes implements XmlComponent {
    private _attr: Object;

    xmlKeys = {};

    constructor(xmlKeys: Object, properties?: any) {
        this._attr = properties

        if (!properties) {
            this._attr = {};
        }
        this._attr["xmlKeys"] = this.xmlKeys;
    }
}