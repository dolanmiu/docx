// cspell:words Turabian
import { describe, expect, it } from "vitest";

import { describeWordOutput, outputOf } from "tests/bibliography";

import type { Person } from "../source";
import expected from "./fixtures/turabian.json";
import { turabian } from "./turabian";

const people = (prefix: string, count: number): readonly Person[] =>
    Array.from({ length: count }, (_, index) => ({ lastName: `${prefix}${index + 1}`, firstName: "Al" }));

describe("turabian", () => {
    describeWordOutput(turabian, expected);

    // The expected text of these is what Word's own style, TURABIAN.XSL, writes for them
    describe("as Word's own style writes them", () => {
        it("lists six authors or editors, but only the first of seven or more, then et al.", () => {
            expect(
                outputOf(turabian, {
                    sources: [
                        {
                            tag: "Six",
                            type: "book",
                            authors: people("Author", 6),
                            editors: people("Editor", 6),
                            title: "Few",
                            year: "2001",
                            city: "Rome",
                            publisher: "Press",
                        },
                        {
                            tag: "Seven",
                            type: "book",
                            authors: people("Writer", 7),
                            editors: people("Editor", 7),
                            title: "Crowds",
                            year: "2001",
                            city: "Rome",
                            publisher: "Press",
                        },
                    ],
                    citations: [[{ source: "Six" }], [{ source: "Seven" }]],
                }),
            ).toEqual({
                citations: ["(Author1, et al. 2001)", "(Writer1, et al. 2001)"],
                bibliography: {
                    hangingIndent: true,
                    paragraphs: [
                        "Author1, Al, Al Author2, Al Author3, Al Author4, Al Author5, and Al Author6. <i>Few.</i> Edited by Al Editor1, Al Editor2, Al Editor3, Al Editor4, Al Editor5, &amp; Al Editor6. Rome: Press, 2001.",
                        "Writer1, Al, et al. <i>Crowds.</i> Edited by Al Editor1, et al. Rome: Press, 2001.",
                    ],
                },
            });
        });

        it("writes the producers of an electronic source", () => {
            expect(
                outputOf(turabian, {
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
                bibliography: {
                    hangingIndent: true,
                    paragraphs: ["Maker1, Al. <i>App.</i> Prods. Al Producer1, &amp; Al Producer2. n.d."],
                },
            });
        });

        it("names a miscellaneous source by its compilers when it has no authors or editors", () => {
            expect(
                outputOf(turabian, {
                    sources: [{ tag: "Notes", type: "miscellaneous", compilers: people("Compiler", 2), title: "Notes", year: "2002" }],
                    citations: [[{ source: "Notes" }]],
                }),
            ).toEqual({
                citations: ["(Compiler1 and Compiler2 2002)"],
                bibliography: { hangingIndent: true, paragraphs: ["Compiler1, Al, and Al Compiler2, comps. “Notes.” 2002."] },
            });
        });

        it("names an electronic source by its translators, and writes its compilers", () => {
            expect(
                outputOf(turabian, {
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
                bibliography: { hangingIndent: true, paragraphs: ["Translator1, Al, trans. <i>Disc.</i> Comp. Al Compiler1. 2003."] },
            });
        });

        it("writes the editors of an interview after its broadcast, or after its title with its translators", () => {
            expect(
                outputOf(turabian, {
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
                        "Guest1, Al. <i>Chat</i>Edited by Al Editor1, translated by Al Translator1. (2005).",
                        "Guest1, Al. “Talk.” <i>Show</i>, edited by Al Editor1. (2004).",
                    ],
                },
            });
        });
    });
});
