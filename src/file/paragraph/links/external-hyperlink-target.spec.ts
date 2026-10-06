import { describe, expect, it } from "vitest";

import { externalHyperlinkTarget } from "./external-hyperlink-target";

describe("externalHyperlinkTarget", () => {
    it.each([
        ["https://example.com/#foo#bar", "https://example.com/", "foo#bar"],
        ["https://example.com/?q=a%23b#section", "https://example.com/?q=a%23b", "section"],
        ["../document.docx#bookmark", "../document.docx", "bookmark"],
        ["https://example.com/#%23literal", "https://example.com/", "%23literal"],
        ["https://example.com/##", "https://example.com/", "#"],
    ])("should split the first fragment separator in %s", (link, target, anchor) => {
        expect(externalHyperlinkTarget(link)).to.deep.equal({ target, anchor });
    });

    it.each(["https://example.com/", "https://example.com/%23literal", "https://example.com/#", "#bookmark", ""])(
        "should keep a target without a nonempty external fragment unchanged: %s",
        (link) => {
            expect(externalHyperlinkTarget(link)).to.deep.equal({ target: link });
        },
    );
});
