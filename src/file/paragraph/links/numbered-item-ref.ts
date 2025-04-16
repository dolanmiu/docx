import { SimpleField } from "../run";

// https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/7088a8ce-e784-49d4-94b8-cba6ef8fce78
export enum NumberedItemReferenceFormat {
    NONE = "none",
    /**
     * \r option - inserts the paragraph number of the bookmarked paragraph in relative context, or relative to its position in the numbering scheme
     */
    RELATIVE = "relative",
    /**
     * \n option - causes the field result to be the paragraph number without trailing periods. No information about prior numbered levels is displayed unless it is included as part of the current level.
     */
    NO_CONTEXT = "no_context",
    /**
     * \w option - causes the field result to be the entire paragraph number without trailing periods, regardless of the location of the REF field.
     */
    FULL_CONTEXT = "full_context",
}

export type INumberedItemReferenceOptions = {
    /**
     * \h option - Creates a hyperlink to the bookmarked paragraph.
     * @default true
     */
    readonly hyperlink?: boolean;
    /**
     * which switch to use for the reference format
     * @default NumberedItemReferenceFormat.FULL_CONTEXT
     */
    readonly referenceFormat?: NumberedItemReferenceFormat;
};

type Switch = "\\h" | "\\r" | "\\n" | "\\w";

const SWITCH_MAP: Record<NumberedItemReferenceFormat, Switch | undefined> = {
    [NumberedItemReferenceFormat.RELATIVE]: "\\r",
    [NumberedItemReferenceFormat.NO_CONTEXT]: "\\n",
    [NumberedItemReferenceFormat.FULL_CONTEXT]: "\\w",
    [NumberedItemReferenceFormat.NONE]: undefined,
};

/**
 * Creates a field/cross reference to a numbered item in the document.
 */
export class NumberedItemReference extends SimpleField {
    public constructor(
        bookmarkId: string,
        // TODO: It would be nice if the cached value could be automatically generated
        /**
         * The cached value of the field. This is used to display the field result in the document.
         */
        cachedValue?: string,
        options: INumberedItemReferenceOptions = {},
    ) {
        const { hyperlink = true, referenceFormat = NumberedItemReferenceFormat.FULL_CONTEXT } = options;
        const baseInstruction = `REF ${bookmarkId}`;

        // TODO: Requires TypeScript 5.5 update for it to understand `filter`
        // @ts-expect-error TS2322
        const switches: readonly Switch[] = [...(hyperlink ? (["\\h"] as const) : []), ...[SWITCH_MAP[referenceFormat]].filter((a) => !!a)];

        const instruction = `${baseInstruction} ${switches.join(" ")}`;

        super(instruction, cachedValue);
    }
}
