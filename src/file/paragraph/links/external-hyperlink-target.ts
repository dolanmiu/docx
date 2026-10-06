/**
 * External hyperlink targets and fragments for WordprocessingML.
 *
 * Word appends the anchor to the relationship target, separated by a # character.
 * Reference: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/df06e423-11a6-4a36-bfb3-82139e531781
 *
 * @module
 */

/** Splits a nonempty fragment from an external URL without decoding or normalizing either part. */
export const externalHyperlinkTarget = (link: string): { readonly target: string; readonly anchor?: string } => {
    const index = link.indexOf("#");
    return index > 0 && index < link.length - 1 ? { target: link.slice(0, index), anchor: link.slice(index + 1) } : { target: link };
};
