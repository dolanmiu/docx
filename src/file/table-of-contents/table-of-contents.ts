// import { TableOfContentsProperties } from "./properties";
import { Paragraph } from "file/paragraph";
import { Run } from "file/paragraph/run";
import { Begin, End, Separate } from "file/paragraph/run/field";
import { TableOfContentsInstruction } from "./instruction";

export class TableOfContents extends Paragraph {
    // private readonly tocProperties: TableOfContentsProperties;

    constructor(/*tocProperties?: TableOfContentsProperties*/) {
        super();
        // this.tocProperties = tocProperties || new TableOfContentsProperties();
        const firstRun = new Run();
        firstRun.addChildElement(new Begin());
        firstRun.addChildElement(new TableOfContentsInstruction());
        firstRun.addChildElement(new Separate());
        this.root.push(firstRun);

        const secondRun = new Run();
        secondRun.addChildElement(new End());
        this.root.push(secondRun);
    }
}
