import { describe, expect, it } from "vitest";

import { findPlaceholders, replacePlaceholders } from "./placeholders";

describe("replacePlaceholders", () => {
    it("replaces every placeholder whose key has a value", () => {
        expect(
            replacePlaceholders(
                "<a>{x}</a><b>{y}</b><c>{x}</c>",
                new Map([
                    ["x", "1"],
                    ["y", "2"],
                ]),
            ),
        ).to.equal("<a>1</a><b>2</b><c>1</c>");
    });

    it("leaves text in braces without a value, such as a font's key, as it is", () => {
        expect(replacePlaceholders('<w:font w:fontKey="{0A1B-2C3D}"/>{x}', new Map([["x", "1"]]))).to.equal(
            '<w:font w:fontKey="{0A1B-2C3D}"/>1',
        );
    });

    it("matches keys with characters that are special in a regular expression as they are written", () => {
        expect(replacePlaceholders("{list (a).b+-0} {list Xa).b+-0}", new Map([["list (a).b+-0", "3"]]))).to.equal("3 {list Xa).b+-0}");
    });

    it("replaces the placeholder inside doubled braces", () => {
        expect(replacePlaceholders("{{x}}", new Map([["x", "1"]]))).to.equal("{1}");
    });

    it("returns the XML as it is when there are no values", () => {
        expect(replacePlaceholders("{x}", new Map())).to.equal("{x}");
    });
});

describe("findPlaceholders", () => {
    it("finds the key of every placeholder", () => {
        expect([...findPlaceholders("{a.png} text {b-1} {a.png}")]).to.deep.equal(["a.png", "b-1"]);
    });
});
