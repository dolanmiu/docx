import { describe, expect, it } from "vitest";

import { describeWordOutput, outputOf } from "tests/bibliography";

import type { Person } from "../source";
import { chicago } from "./chicago";
import expected from "./fixtures/chicago.json";

const people = (prefix: string, count: number): readonly Person[] =>
    Array.from({ length: count }, (_, index) => ({ lastName: `${prefix}${index + 1}`, firstName: "Al" }));

describe("chicago", () => {
    describeWordOutput(chicago, expected);

    // The expected text of these is what Word's own style, CHICAGO.XSL, writes for them
    describe("as Word's own style writes them", () => {
        it("lists the first seven of 11 or more authors or editors, then et al.", () => {
            expect(
                outputOf(chicago, {
                    sources: [
                        {
                            tag: "Many",
                            type: "book",
                            authors: people("Author", 12),
                            editors: people("Editor", 12),
                            title: "Crowds",
                            year: "2001",
                            city: "Rome",
                            publisher: "Press",
                        },
                    ],
                    citations: [[{ source: "Many" }]],
                }),
            ).toEqual({
                citations: ["(Author1, et al. 2001)"],
                bibliography: {
                    hangingIndent: true,
                    paragraphs: [
                        "Author1, Al, Al Author2, Al Author3, Al Author4, Al Author5, Al Author6, Al Author7, et al. 2001. <i>Crowds.</i> Edited by Al Editor1, Al Editor2, Al Editor3, Al Editor4, Al Editor5, Al Editor6, Al Editor7, et al. Rome: Press.",
                    ],
                },
            });
        });

        it("writes the month a website was read in when it has no year", () => {
            expect(
                outputOf(chicago, {
                    sources: [{ tag: "Web", type: "website", title: "Page", monthAccessed: "May", url: "https://example.com" }],
                    citations: [[{ source: "Web" }]],
                }),
            ).toEqual({
                citations: ["(Page n.d.)"],
                bibliography: { hangingIndent: true, paragraphs: ["n.d. <i>Page.</i> Accessed May. https://example.com."] },
            });
        });

        it("writes the court of a case with no city or date", () => {
            expect(
                outputOf(chicago, {
                    sources: [{ tag: "Case", type: "case", title: "A v. B", court: "High Court" }],
                    citations: [[{ source: "Case" }]],
                }),
            ).toEqual({
                citations: ["(A v. B n.d.)"],
                bibliography: { hangingIndent: true, paragraphs: ["<i>A v. B.</i> n.d. (High Court)."] },
            });
        });

        it("writes the producers of an electronic source", () => {
            expect(
                outputOf(chicago, {
                    sources: [
                        {
                            tag: "App",
                            type: "electronicSource",
                            authors: people("Maker", 1),
                            title: "App",
                            producers: people("Producer", 2),
                            productionCompany: "Studio",
                        },
                    ],
                    citations: [[{ source: "App" }]],
                }),
            ).toEqual({
                citations: ["(Maker1 n.d.)"],
                bibliography: { hangingIndent: true, paragraphs: ["Maker1, Al. n.d. <i>App.</i> Prods. Al Producer1 and Al Producer2."] },
            });
        });

        it("names a miscellaneous source by its compilers when it has no authors or editors", () => {
            expect(
                outputOf(chicago, {
                    sources: [{ tag: "Notes", type: "miscellaneous", compilers: people("Compiler", 2), title: "Notes", year: "2002" }],
                    citations: [[{ source: "Notes" }]],
                }),
            ).toEqual({
                citations: ["(Compiler1 and Compiler2 2002)"],
                bibliography: { hangingIndent: true, paragraphs: ["Compiler1, Al, and Al Compiler2, comps. 2002. “Notes.”"] },
            });
        });

        it("names an electronic source by its translators, and writes its compilers", () => {
            expect(
                outputOf(chicago, {
                    sources: [
                        {
                            tag: "Disc",
                            type: "electronicSource",
                            translators: people("Translator", 1),
                            compilers: people("Compiler", 1),
                            title: "Disc",
                            year: "2003",
                        },
                    ],
                    citations: [[{ source: "Disc" }]],
                }),
            ).toEqual({
                citations: ["(Disc 2003)"],
                bibliography: { hangingIndent: true, paragraphs: ["Translator1, Al, trans. 2003. <i>Disc.</i> Comp. Al Compiler1."] },
            });
        });

        it("writes the editors of an interview after its broadcast, or after its title with its translators", () => {
            expect(
                outputOf(chicago, {
                    sources: [
                        {
                            tag: "Talk",
                            type: "interview",
                            interviewees: people("Guest", 1),
                            title: "Talk",
                            broadcastTitle: "Show",
                            editors: people("Editor", 1),
                            year: "2004",
                        },
                        {
                            tag: "Chat",
                            type: "interview",
                            interviewees: people("Guest", 1),
                            title: "Chat",
                            editors: people("Editor", 1),
                            translators: people("Translator", 1),
                            year: "2005",
                        },
                    ],
                    citations: [[{ source: "Talk" }], [{ source: "Chat" }]],
                }),
            ).toEqual({
                citations: ["(Guest1, Talk 2004)", "(Guest1, Chat 2005)"],
                bibliography: {
                    hangingIndent: true,
                    paragraphs: [
                        "Guest1, Al. 2005. <i>Chat</i>Edited by Al Editor1, translated by Al Translator1.",
                        "Guest1, Al. 2004. “Talk.” <i>Show</i>, edited by Al Editor1.",
                    ],
                },
            });
        });

        it("names a book by its translators, or its editors, when it has no authors", () => {
            expect(
                outputOf(chicago, {
                    sources: [
                        { tag: "Tr", type: "book", translators: people("Translator", 1), title: "Translated", year: "2006" },
                        { tag: "Ed", type: "book", editors: people("Editor", 1), title: "Edited", year: "2006" },
                    ],
                    citations: [[{ source: "Tr" }], [{ source: "Ed" }]],
                }),
            ).toEqual({
                citations: ["(Translator1 2006)", "(Editor1 2006)"],
                bibliography: {
                    hangingIndent: true,
                    paragraphs: ["Editor1, Al, ed. 2006. <i>Edited.</i> ", "Translator1, Al, trans. 2006. <i>Translated.</i> "],
                },
            });
        });
    });
});
