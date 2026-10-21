import { describe, expect, it } from "vitest";

import { italic, join } from "./formatted-text";
import { LOCALS } from "./locals";
import { applyItalic, isOneOf, lastCharOf, sortByKey, translate, xslTemplates } from "./xsl";

const { appendDot, formatDatePrivate, formatName, nameInitial, needDot, printList, stringFormat, stringFormatDot } = xslTemplates(
    LOCALS.General,
);

const person = (last: string, first = "", middle = ""): { readonly last: string; readonly first: string; readonly middle: string } => ({
    last,
    first,
    middle,
});

describe("XPath's functions", () => {
    it("reads the last character, or none", () => {
        expect(lastCharOf("Pizza")).to.equal("a");
        expect(lastCharOf("")).to.equal("");
    });

    it("finds a character among characters, and finds no character, as contains() does", () => {
        expect(isOneOf("?", ".!?")).to.equal(true);
        expect(isOneOf("a", ".!?")).to.equal(false);
        expect(isOneOf("", ".!?")).to.equal(true);
    });

    it("replaces characters, and removes those with nothing to replace them", () => {
        expect(translate("a-b c", "- ", "_")).to.equal("a_bc");
    });
});

describe("nameInitial", () => {
    it("writes the initial of a name, with a dot", () => {
        expect(nameInitial("Charles")).to.equal("C.");
    });

    it("writes only the first initial of names with spaces in them", () => {
        expect(nameInitial("Mary Ann")).to.equal("M.");
    });

    it("writes the initial after each hyphen, with the hyphen", () => {
        expect(nameInitial("Jean-Paul")).to.equal("J.-P.");
        expect(nameInitial("Anne-Marie-Claude")).to.equal("A.-M.-C.");
    });

    it("writes no initial for a name that starts with a hyphen, but the one after it", () => {
        expect(nameInitial("-Jo")).to.equal("-J.");
    });

    it("writes nothing for an empty name, or one of spaces", () => {
        expect(nameInitial("")).to.equal("");
        expect(nameInitial("  ")).to.equal("");
    });
});

describe("formatName", () => {
    const patterns = { FML: "%L, %f %m", FM: "%F %M", ML: "%L, %m", FL: "%L, %F" } as const;

    it("writes each name the person has with the pattern for them", () => {
        expect(formatName(person("Dickens", "Charles", "John"), patterns)).to.equal("Dickens, C. J.");
        expect(formatName(person("Dickens", "Charles"), patterns)).to.equal("Dickens, Charles");
        expect(formatName(person("Dickens", "", "John"), patterns)).to.equal("Dickens, J.");
        expect(formatName(person("", "Charles", "John"), patterns)).to.equal("Charles John");
    });

    it("writes a name alone with Word's simple patterns", () => {
        expect(formatName(person("Plato"), patterns)).to.equal("Plato");
        expect(formatName(person("", "Plato"), patterns)).to.equal("Plato");
        expect(formatName(person("", "", "Plato"), patterns)).to.equal("Plato");
        expect(formatName(person(""), patterns)).to.equal("");
    });

    it("writes %% as %, and nothing for an unknown part or a % at the end", () => {
        expect(formatName(person("Lee", "Ann"), { ...patterns, FL: "%L%% %x%l %" })).to.equal("Lee% L. ");
    });
});

describe("formatDatePrivate", () => {
    const patterns = { DMY: "%D %M %Y", DM: "%D %M", MY: "%M %Y", DY: "%D %Y" } as const;

    it("writes the date with the pattern for its parts", () => {
        expect(formatDatePrivate("4", "May", "2001", patterns)).to.equal("4 May 2001");
        expect(formatDatePrivate("", "May", "2001", patterns)).to.equal("May 2001");
    });

    it("writes the year alone when there's no month", () => {
        expect(formatDatePrivate("4", "", "2001", patterns)).to.equal("2001");
        expect(formatDatePrivate("", "", "2001", patterns)).to.equal("2001");
    });

    it("writes nothing with no year", () => {
        expect(formatDatePrivate("4", "May", "", patterns)).to.equal("");
    });

    it("writes %% as %, and nothing for an unknown part or a % at the end", () => {
        expect(formatDatePrivate("4", "May", "2001", { ...patterns, DMY: "%Y%%%x %" })).to.equal("2001% ");
    });
});

describe("stringFormat", () => {
    it("replaces each parameter, with its formatting", () => {
        expect(stringFormat("Retrieved %1, from %2", "May 4", italic("Site"))).to.deep.equal([
            { text: "Retrieved " },
            { text: "May 4" },
            { text: ", from " },
            { text: "Site", italics: true },
        ]);
    });

    it("writes %% as %, and nothing for a parameter that isn't given or a % at the end", () => {
        expect(stringFormat("%%%3 %")).to.deep.equal([{ text: "%" }, { text: " " }]);
    });
});

describe("stringFormatDot", () => {
    it("writes nothing for an empty format", () => {
        expect(stringFormatDot("")).to.deep.equal([]);
    });

    it("adds a dot after a parameter that doesn't end a sentence", () => {
        expect(stringFormatDot("Ed. %1", "Lee")).to.deep.equal([{ text: "Ed. " }, { text: "Lee" }, { text: "." }]);
        expect(stringFormatDot("Ed. %1", "Lee?")).to.deep.equal([{ text: "Ed. " }, { text: "Lee?" }]);
        expect(stringFormatDot("Ed. %1", "")).to.deep.equal([{ text: "Ed. " }]);
    });

    it("adds a dot after a character that doesn't end a sentence", () => {
        expect(stringFormatDot("%1 ed", "2nd")).to.deep.equal([{ text: "2nd" }, { text: " ed" }, { text: "." }]);
        expect(stringFormatDot("%1 ed.", "2nd")).to.deep.equal([{ text: "2nd" }, { text: " ed." }]);
    });

    it("adds a dot after %%, and none after a % at the end", () => {
        expect(stringFormatDot("100%%")).to.deep.equal([{ text: "100" }, { text: "%" }, { text: "." }]);
        expect(stringFormatDot("100%")).to.deep.equal([{ text: "100" }]);
    });
});

describe("appendDot and needDot", () => {
    it("adds a dot to text that doesn't end a sentence", () => {
        expect(appendDot("Pizza")).to.equal("Pizza.");
        expect(appendDot("Pizza!")).to.equal("Pizza!");
        expect(appendDot("")).to.equal("");
    });

    it("gives the dot text needs", () => {
        expect(needDot("Pizza")).to.equal(".");
        expect(needDot("Pizza?")).to.equal("");
        expect(needDot("")).to.equal("");
    });
});

describe("printList", () => {
    it("separates the items written, and ends with a dot", () => {
        expect(printList(["Paris", "", italic("Press"), "2001"])).to.deep.equal([
            { text: "Paris" },
            { text: ", " },
            { text: "Press", italics: true },
            { text: ", " },
            { text: "2001" },
            { text: "." },
        ]);
    });

    it("uses the group separator once, before the next item written", () => {
        expect(printList(["A", "group", "", "B", "C"])).to.deep.equal(join("A", "; ", "B", ", ", "C", "."));
    });

    it("keeps a group separator before the first item for after it", () => {
        expect(printList(["group", "A", "B"])).to.deep.equal(join("A", "; ", "B", "."));
    });

    it("writes nothing for no items", () => {
        expect(printList(["", "group"])).to.deep.equal([]);
    });
});

describe("applyItalic", () => {
    it("writes text in italics, and nothing for none", () => {
        expect(applyItalic("Title")).to.deep.equal([{ text: "Title", italics: true }]);
        expect(applyItalic("")).to.deep.equal([]);
    });
});

describe("sortByKey", () => {
    const sorted = (keys: readonly string[]): readonly string[] => sortByKey(keys, (key) => key);

    it("sorts in small letters, keeping the order of keys that differ only in case", () => {
        expect(sorted(["van Dyke", "Ward", "NA", "Na", "abe"])).to.deep.equal(["abe", "NA", "Na", "van Dyke", "Ward"]);
    });

    it("ignores hyphens and apostrophes, but not spaces", () => {
        expect(sorted(["O'Neil", "Oakes", "Smith-Jones", "Smithers", "Dean", "de Vries"])).to.deep.equal([
            "de Vries",
            "Dean",
            "Oakes",
            "O'Neil",
            "Smithers",
            "Smith-Jones",
        ]);
    });

    it("sorts letters with accents by their letters, then by their accents", () => {
        expect(sorted(["Zoë", "Zoe", "Müller", "Mora", "Mabe", "Émile", "Eve"])).to.deep.equal([
            "Émile",
            "Eve",
            "Mabe",
            "Mora",
            "Müller",
            "Zoe",
            "Zoë",
        ]);
    });

    it("sorts letters that are two letters in one as those letters", () => {
        expect(sorted(["Ørsted", "Ægir", "Adams", "Œuvre", "Oakes", "Straße", "Strasse", "Strand"])).to.deep.equal([
            "Adams",
            "Ægir",
            "Oakes",
            "Œuvre",
            "Ørsted",
            "Strand",
            "Strasse",
            "Straße",
        ]);
    });
});
