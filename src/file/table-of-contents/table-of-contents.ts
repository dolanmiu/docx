// import { TableOfContentsProperties } from "./properties";
import { ParagraphProperties } from "file/paragraph";
import { Run } from "file/paragraph/run";
import { Begin, End, Separate } from "file/paragraph/run/field";
import { XmlComponent } from "file/xml-components";
import { TableOfContentsInstruction } from "./instruction";

export class TableOfContents extends XmlComponent {
    // private readonly tocProperties: TableOfContentsProperties;
    private readonly properties: ParagraphProperties;

    constructor(/*tocProperties?: TableOfContentsProperties*/) {
        super("w:p");
        this.properties = new ParagraphProperties();
        this.root.push(this.properties);
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
