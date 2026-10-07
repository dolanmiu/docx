import { describe, expect, it } from "vitest";

import { externalHyperlinkTarget } from "./external-hyperlink-target";

describe("externalHyperlinkTarget", () => {
    it.each([
        ["255 literal characters", "a".repeat(255), true],
        ["256 literal characters", "a".repeat(256), false],
        ["255 characters including another hash", `${"a".repeat(127)}#${"b".repeat(127)}`, true],
        ["256 characters including another hash", `${"a".repeat(127)}#${"b".repeat(128)}`, false],
        ["255 characters of percent-encoded hashes", "%23".repeat(85), true],
        ["256 characters of percent-encoded hashes", `${"%23".repeat(85)}x`, false],
        ["255 UTF-16 units including astral characters", `${"😀".repeat(127)}a`, true],
        ["256 UTF-16 units including astral characters", "😀".repeat(128), false],
    ] as const)("should respect Word's anchor limit for %s", (_description, fragment, useAnchor) => {
        const target = "https://example.com/?a=1&b=2";
        const link = `${target}#${fragment}`;
        expect(externalHyperlinkTarget(link)).to.deep.equal(useAnchor ? { target, anchor: fragment } : { target: link });
    });

    it("should limit only the fragment, not a long relationship target", () => {
        const target = `https://example.com/${"a".repeat(300)}?q=%23`;
        expect(externalHyperlinkTarget(`${target}#short#fragment`)).to.deep.equal({ target, anchor: "short#fragment" });
    });

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
