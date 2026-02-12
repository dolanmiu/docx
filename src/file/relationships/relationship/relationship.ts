import { BuilderElement, XmlComponent } from "@file/xml-components";

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
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"
    | "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font";

export const TargetModeType = {
    EXTERNAL: "External",
} as const;

type IRelationshipAttributes = {
    readonly id: string;
    readonly type: RelationshipType;
    readonly target: string;
    readonly targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType];
};

export const createRelationship = (
    id: string,
    type: RelationshipType,
    target: string,
    targetMode?: (typeof TargetModeType)[keyof typeof TargetModeType],
): XmlComponent =>
    new BuilderElement<IRelationshipAttributes>({
        name: "Relationship",
        attributes: {
            id: { key: "Id", value: id },
            type: { key: "Type", value: type },
            target: { key: "Target", value: target },
            targetMode: { key: "TargetMode", value: targetMode },
        },
    });
