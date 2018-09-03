// import { TableOfContentsProperties } from "./properties";
import { Paragraph } from "file/paragraph";
import { Begin, End, Separate } from "file/paragraph/run/field";
import { TableOfContentsInstruction } from "./instruction";

export class TableOfContents extends Paragraph {
    // private readonly tocProperties: TableOfContentsProperties;

    constructor(/*tocProperties?: TableOfContentsProperties*/) {
        super();
        // this.tocProperties = tocProperties || new TableOfContentsProperties();
        this.root.push(new Begin());
        this.root.push(new Separate());
        this.root.push(new TableOfContentsInstruction());
        this.root.push(new End());
    }
}
