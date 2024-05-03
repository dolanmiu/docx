export const FootnoteRestartLocation = {
     CONTINUOUS: "continuous",
     EACH_SECTION: "eachSect",
     EACH_PAGE: "eachPage",
} as const;

export type FootnoteRestartLocationType = (typeof FootnoteRestartLocation)[keyof typeof FootnoteRestartLocation]

export const FootnotePositioningLocation = {
    PAGE_BOTTOM: "pageBottom",
    BENEATH_TEXT: "beneathText",
    SECTION_END: "sectEnd",
    DOCUMENT_END: "docEnd",
} as const;

export type FootnotePositioningLocationType = (typeof FootnotePositioningLocation)[keyof typeof FootnotePositioningLocation]
