import { expect } from "chai";

import { replaceTokenInParagraphElement } from "./paragraph-token-replacer";

describe("paragraph-token-replacer", () => {
    describe("replaceTokenInParagraphElement", () => {
        it("should replace token in paragraph", () => {
            const output = replaceTokenInParagraphElement({
                paragraphElement: {
                    name: "w:p",
                    elements: [
                        {
                            name: "w:r",
                            elements: [
                                {
                                    name: "w:t",
                                    elements: [
                                        {
                                            type: "text",
                                            text: "hello",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                renderedParagraph: {
                    index: 0,
                    path: [0],
                    runs: [
                        {
                            end: 4,
                            index: 0,
                            parts: [
                                {
                                    end: 4,
                                    index: 0,
                                    start: 0,
                                    text: "hello",
                                },
                            ],
                            start: 0,
                            text: "hello",
                        },
                    ],
                    text: "hello",
                },
                originalText: "hello",
                replacementText: "world",
            });

            expect(output).to.deep.equal({
                elements: [
                    {
                        elements: [
                            {
                                elements: [
                                    {
                                        text: "world",
                                        type: "text",
                                    },
                                ],
                                name: "w:t",
                            },
                        ],
                        name: "w:r",
                    },
                ],
                name: "w:p",
            });
        });

        // Try to fill rest of test coverage
        // it("should replace token in paragraph", () => {
        //     const output = replaceTokenInParagraphElement({
        //         paragraphElement: {
        //             name: "w:p",
        //             elements: [
        //                 {
        //                     name: "w:r",
        //                     elements: [
        //                         {
        //                             name: "w:t",
        //                             elements: [
        //                                 {
        //                                     type: "text",
        //                                     text: "test ",
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "w:t",
        //                             elements: [
        //                                 {
        //                                     type: "text",
        //                                     text: " hello ",
        //                                 },
        //                             ],
        //                         },
        //                     ],
        //                 },
        //             ],
        //         },
        //         renderedParagraph: {
        //             index: 0,
        //             path: [0],
        //             runs: [
        //                 {
        //                     end: 4,
        //                     index: 0,
        //                     parts: [
        //                         {
        //                             end: 4,
        //                             index: 0,
        //                             start: 0,
        //                             text: "test ",
        //                         },
        //                     ],
        //                     start: 0,
        //                     text: "test ",
        //                 },
        //                 {
        //                     end: 10,
        //                     index: 0,
        //                     parts: [
        //                         {
        //                             end: 10,
        //                             index: 0,
        //                             start: 5,
        //                             text: "hello ",
        //                         },
        //                     ],
        //                     start: 5,
        //                     text: "hello ",
        //                 },
        //             ],
        //             text: "test hello ",
        //         },
        //         originalText: "hello",
        //         replacementText: "world",
        //     });

        //     expect(output).to.deep.equal({
        //         elements: [
        //             {
        //                 elements: [
        //                     {
        //                         elements: [
        //                             {
        //                                 text: "test world ",
        //                                 type: "text",
        //                             },
        //                         ],
        //                         name: "w:t",
        //                     },
        //                 ],
        //                 name: "w:r",
        //             },
        //         ],
        //         name: "w:p",
        //     });
        // });
    });
});
