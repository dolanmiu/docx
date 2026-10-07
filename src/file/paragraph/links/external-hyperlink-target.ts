/**
 * External hyperlink targets and fragments for WordprocessingML.
 *
 * Word appends the anchor to the relationship target, separated by a # character.
 * Reference: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/df06e423-11a6-4a36-bfb3-82139e531781
 *
 * @module
 */

// Word supports at most 255 characters in w:anchor. Count UTF-16 units conservatively: astral
// characters take two units, and percent-encoded characters keep their literal encoded length.
const MAX_ANCHOR_LENGTH = 255;

/**
 * Splits a nonempty fragment that fits Word's anchor limit without decoding or normalizing either part.
 * Longer fragments stay in the original relationship URI, retaining its existing multi-hash limitations.
 */
export const externalHyperlinkTarget = (link: string): { readonly target: string; readonly anchor?: string } => {
    const index = link.indexOf("#");
    const fragmentLength = link.length - index - 1;
    return index > 0 && fragmentLength > 0 && fragmentLength <= MAX_ANCHOR_LENGTH
        ? { target: link.slice(0, index), anchor: link.slice(index + 1) }
        : { target: link };
};
