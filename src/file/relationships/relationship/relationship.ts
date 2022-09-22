import { XmlComponent } from "@file/xml-components";
import { RelationshipAttributes } from "./relationship-attributes";

export type RelationshipType =
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    | "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments";

export enum TargetModeType {
    EXTERNAL = "External",
}

export class Relationship extends XmlComponent {
    public constructor(id: string, type: RelationshipType, target: string, targetMode?: TargetModeType) {
        super("Relationship");

        this.root.push(
            new RelationshipAttributes({
                id,
                type,
                target,
                targetMode,
            }),
        );
    }
}
