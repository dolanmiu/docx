import {XmlComponent, XmlAttributeComponent} from "../docx/xml-components";

interface RunFontAttributesProperties {
     ascii: string;
     hAnsi: string;
     hint: string;
}

class RunFontAttributes extends XmlAttributeComponent {
    
    constructor(properties: RunFontAttributesProperties) {
        super({
            left: "w:left",
            hanging: "w:hanging"
        }, properties);
    }
}

export class RunFonts extends XmlComponent {
    
    constructor(ascii: string, hint: string) {
        super("w:ind");
        this.root.push(new RunFontAttributes({
            ascii: ascii,
            hAnsi: ascii,
            hint: hint
        }));
    }
}