import { BuilderElement, XmlComponent } from "@file/xml-components";

const FieldCharacterType = {
    BEGIN: "begin",
    END: "end",
    SEPARATE: "separate",
} as const;

type IFieldCharAttributes = {
    readonly type: (typeof FieldCharacterType)[keyof typeof FieldCharacterType];
    readonly dirty?: boolean;
};

const createFieldChar = (type: (typeof FieldCharacterType)[keyof typeof FieldCharacterType], dirty?: boolean): XmlComponent =>
    new BuilderElement<IFieldCharAttributes>({
        name: "w:fldChar",
        attributes: {
            type: { key: "w:fldCharType", value: type },
            dirty: { key: "w:dirty", value: dirty },
        },
    });

export const createBegin = (dirty?: boolean): XmlComponent => createFieldChar(FieldCharacterType.BEGIN, dirty);

export const createSeparate = (dirty?: boolean): XmlComponent => createFieldChar(FieldCharacterType.SEPARATE, dirty);

export const createEnd = (dirty?: boolean): XmlComponent => createFieldChar(FieldCharacterType.END, dirty);
