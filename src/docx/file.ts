import { Media } from "../media";
import { Numbering } from "../numbering";
import { Properties } from "../properties";
import { Styles } from "../styles";
import { Document } from "./document";

export class File {

    private document: Document;
    private styles: Styles;
    private properties: Properties;
    private numbering: Numbering;
    private media: Media;

    constructor() {
        this.document = new Document();
        this.styles = new Styles();
        this.properties = new Properties({
            creator: "Un-named",
            revision: "1",
            lastModifiedBy: "Un-named",
        });
        this.numbering = new Numbering();
        this.media = new Media();
    }
}
