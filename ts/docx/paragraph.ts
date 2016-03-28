import {P, Attributes, ParagraphProperties, Run} from "./xml-components/p";

export class Paragraph {
    private p: Array<P>;
    
    constructor(text?: string) {
        this.p = new Array<P>();
        this.p.push(new Attributes());
        this.p.push(new ParagraphProperties());
        this.p.push(new Run(text));
    }
}