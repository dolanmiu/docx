import { describe, expect, it } from "vitest";

import { CheckBox, LevelFormat, Paragraph, Table, TextRun } from "docx";
import { formatted, listsIn } from "tests/html";

import type { Block, ParagraphBlock } from "./content";
import { htmlToContent } from "./html-to-content";
import { DEEPEST_LEVEL, listLevelOf, numberLists } from "./lists";

const lists = (source: string) => listsIn(htmlToContent(source));

describe("htmlToContent: lists", () => {
    describe("items", () => {
        it("writes a <ul>'s items as bullet paragraphs of a list, in Word's List Paragraph style", async () => {
            const { paragraphs, levels } = await lists("<ul><li>a</li><li>b</li></ul>");
            expect(paragraphs).toEqual([
                { list: 0, level: 0, text: "a" },
                { list: 0, level: 0, text: "b" },
            ]);
            expect(levels[0].slice(0, 3)).toEqual([
                { format: "bullet", text: "•", start: 1 },
                { format: "bullet", text: "◦", start: 1 },
                { format: "bullet", text: "▪", start: 1 },
            ]);
            expect(formatted(htmlToContent("<ul><li>a</li></ul>"))).toBe(
                formatted([new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun({ children: ["a"] })] })]),
            );
        });

        it("writes an <ol>'s items as numbered paragraphs, with a full stop after each number", async () => {
            const { levels } = await lists("<ol><li>a</li></ol>");
            expect(levels[0].slice(0, 3)).toEqual([
                { format: "decimal", text: "%1.", start: 1 },
                { format: "lowerLetter", text: "%2.", start: 1 },
                { format: "lowerRoman", text: "%3.", start: 1 },
            ]);
        });

        it("gives every list Word's nine levels, indented by half an inch each, with the number hanging", () => {
            const definition = [...numberLists([item(0, {})]).values()][0].reference;
            expect(definition.levels).toHaveLength(9);
            expect(definition.levels[3]).toEqual({
                level: 3,
                format: LevelFormat.DECIMAL,
                text: "%4.",
                start: 1,
                alignment: "left",
                style: { paragraph: { indent: { left: 2880, hanging: 360 } } },
            });
        });

        it("starts each list's numbers again, and keeps a list's numbers going after a list in one of its items", async () => {
            const { paragraphs } = await lists("<ol><li>a<ol><li>b</li></ol></li><li>c</li></ol><ol><li>d</li></ol>");
            expect(paragraphs).toEqual([
                { list: 0, level: 0, text: "a" },
                { list: 0, level: 1, text: "b" },
                { list: 0, level: 0, text: "c" },
                { list: 1, level: 0, text: "d" },
            ]);
        });

        it("writes a list in an item as the next level of the item's list, as Word's own lists are", async () => {
            const { paragraphs, levels } = await lists("<ol><li>a<ul><li>b<ol type='i'><li>c</li></ol></li></ul></li></ol>");
            expect(paragraphs.map(({ list, level }) => [list, level])).toEqual([
                [0, 0],
                [0, 1],
                [0, 2],
            ]);
            expect(levels[0].slice(0, 3)).toEqual([
                { format: "decimal", text: "%1.", start: 1 },
                { format: "bullet", text: "◦", start: 1 },
                { format: "lowerRoman", text: "%3.", start: 1 },
            ]);
        });

        it("starts the numbers of a list in an item again after each of the item's list's items", async () => {
            const { paragraphs } = await lists("<ol><li>a<ol><li>b</li><li>c</li></ol></li><li>d<ol><li>e</li></ol></li></ol>");
            // The level of the second list in an item is the same level of the same list, which Word starts again
            expect(paragraphs.map(({ list }) => list)).toEqual([0, 0, 0, 0, 0]);
        });

        it("gives a second list in one item a list of its own, as Word would number it on from the first", async () => {
            const { paragraphs } = await lists("<ol><li>a<ol><li>b</li></ol><ol><li>c</li></ol></li></ol>");
            expect(paragraphs.map(({ list, level }) => [list, level])).toEqual([
                [0, 0],
                [0, 1],
                [1, 1],
            ]);
        });

        it("gives a list in an item a list of its own when its numbers differ from those its level already has", async () => {
            const { paragraphs, levels } = await lists(
                "<ol><li>a<ol type='a'><li>b</li></ol></li><li>c<ol type='I'><li>d</li></ol></li></ol>",
            );
            expect(paragraphs.map(({ list, level }) => [list, level])).toEqual([
                [0, 0],
                [0, 1],
                [0, 0],
                [1, 1],
            ]);
            expect(levels[1][1]).toEqual({ format: "upperRoman", text: "%2.", start: 1 });
        });

        it("writes an item with several paragraphs with its number on the first, and the others indented to its text", () => {
            expect(formatted(htmlToContent("<ol><li><p>a</p><p>b</p></li></ol>"))).toBe(
                formatted([
                    new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun({ children: ["a"] })] }),
                    new Paragraph({ indent: { left: 720 }, children: [new TextRun({ children: ["b"] })] }),
                ]),
            );
        });

        it("writes the text after a list in an item as a paragraph indented to the item's text", () => {
            expect(formatted(htmlToContent("<ul><li>a<ul><li>b</li></ul>c</li></ul>"))).toBe(
                formatted([
                    new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun({ children: ["a"] })] }),
                    new Paragraph({ numbering: { reference: "list", level: 1 }, children: [new TextRun({ children: ["b"] })] }),
                    new Paragraph({ indent: { left: 720 }, children: [new TextRun({ children: ["c"] })] }),
                ]),
            );
        });

        it("writes an item that starts with a table as an empty item before it, with the table indented to its text", () => {
            const content = htmlToContent("<ul><li><table><tr><td>a</td></tr></table></li></ul>");
            expect(content[0]).toBeInstanceOf(Paragraph);
            expect(content[1]).toBeInstanceOf(Table);
            expect(formatted(content)).toMatch(
                /^<w:p><w:pPr><w:pStyle w:val="ListParagraph"\/><w:numPr>.*<\/w:p><w:tbl><w:tblPr><w:tblW w:type="auto" w:w="100"\/><w:tblInd w:type="dxa" w:w="720"\/>/,
            );
        });

        it("writes an empty item as an empty paragraph of the list", async () => {
            const { paragraphs } = await lists("<ul><li></li><li>b</li></ul>");
            expect(paragraphs).toEqual([
                { list: 0, level: 0, text: "" },
                { list: 0, level: 0, text: "b" },
            ]);
        });

        it("writes a list in an indented block with its paragraphs indented by the block too", () => {
            expect(formatted(htmlToContent("<blockquote><ul><li>a</li></ul></blockquote>"))).toBe(
                formatted([
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        indent: { left: 1440, hanging: 360, right: 720 },
                        children: [new TextRun({ children: ["a"] })],
                    }),
                ]),
            );
        });

        it("leaves out a list's padding, as Word's levels indent its items", () => {
            expect(formatted(htmlToContent('<ul style="padding-left: 40px; padding-inline-start: 48px"><li>a</li></ul>'))).toBe(
                formatted(htmlToContent("<ul><li>a</li></ul>")),
            );
        });

        it("writes text in a list that isn't in an item as a paragraph indented to the list's text", () => {
            expect(formatted(htmlToContent("<ul>loose<li>a</li></ul>"))).toBe(
                formatted([
                    new Paragraph({ indent: { left: 720 }, children: [new TextRun({ children: ["loose"] })] }),
                    new Paragraph({ numbering: { reference: "list", level: 0 }, children: [new TextRun({ children: ["a"] })] }),
                ]),
            );
        });

        it("writes an <li> that isn't in a list as a bullet item", async () => {
            const { paragraphs, levels } = await lists("<li>a</li><li>b</li>");
            expect(paragraphs.map(({ level, text }) => [level, text])).toEqual([
                [0, "a"],
                [0, "b"],
            ]);
            expect(levels[0][0].format).toBe("bullet");
        });

        it("writes a list in a list, not in an item, as Google Docs writes it, as the next level", async () => {
            const { paragraphs } = await lists("<ul><li>a</li><ul><li>b</li></ul><li>c</li></ul>");
            expect(paragraphs.map(({ list, level }) => [list, level])).toEqual([
                [0, 0],
                [0, 1],
                [0, 0],
            ]);
        });

        it("writes lists no deeper than Word's ninth level", async () => {
            const nested = "<ul><li>x".repeat(12) + "</li></ul>".repeat(12);
            const { paragraphs } = await lists(nested);
            expect(paragraphs.map(({ level }) => level)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8]);
        });

        it("leaves out items that CSS hides", async () => {
            const { paragraphs } = await lists('<ul><li>a</li><li style="display: none">b</li><li>c</li></ul>');
            expect(paragraphs.map(({ text }) => text)).toEqual(["a", "c"]);
        });

        it("writes a list in a table cell as a list of its own, and keeps the list around the table going", async () => {
            const { paragraphs } = await lists("<ol><li>a<table><tr><td><ol><li>b</li></ol></td></tr></table></li><li>c</li></ol>");
            expect(paragraphs.map(({ list, level, text }) => [list, level, text])).toEqual([
                [0, 0, "a"],
                [1, 0, "b"],
                [0, 0, "c"],
            ]);
        });
    });

    describe("numbers", () => {
        it.each([
            ["1", "decimal"],
            ["a", "lowerLetter"],
            ["A", "upperLetter"],
            ["i", "lowerRoman"],
            ["I", "upperRoman"],
        ])("writes <ol type=%s> as %s numbers", async (type, format) => {
            const { levels } = await lists(`<ol type="${type}"><li>a</li></ol>`);
            expect(levels[0][0].format).toBe(format);
        });

        it.each([
            ["decimal", "decimal", "%1."],
            ["decimal-leading-zero", "decimalZero", "%1."],
            ["lower-roman", "lowerRoman", "%1."],
            ["upper-roman", "upperRoman", "%1."],
            ["lower-alpha", "lowerLetter", "%1."],
            ["lower-latin", "lowerLetter", "%1."],
            ["upper-alpha", "upperLetter", "%1."],
            ["upper-latin", "upperLetter", "%1."],
            ["cjk-decimal", "ideographDigital", "%1."],
            ["cjk-ideographic", "taiwaneseCounting", "%1."],
            ["japanese-formal", "japaneseLegal", "%1."],
            ["japanese-informal", "japaneseCounting", "%1."],
            ["katakana", "aiueoFullWidth", "%1."],
            ["hiragana-iroha", "irohaFullWidth", "%1."],
            ["korean-hangul-formal", "ganada", "%1."],
            ["hangul-consonant", "chosung", "%1."],
            ["cjk-earthly-branch", "ideographZodiac", "%1."],
            ["cjk-heavenly-stem", "ideographTraditional", "%1."],
            ["lower-greek", "decimal", "%1."],
            ["armenian", "decimal", "%1."],
            ["disc", "bullet", "•"],
            ["circle", "bullet", "◦"],
            ["square", "bullet", "▪"],
            ["disclosure-closed", "bullet", "▸"],
            ["disclosure-open", "bullet", "▾"],
            ["none", "bullet", ""],
            ["'→ '", "bullet", "→ "],
            ['"*"', "bullet", "*"],
        ])("writes list-style-type: %s as %s with %j", async (type, format, text) => {
            const { levels } = await lists(`<ol style="list-style-type: ${type.replace(/"/g, "&quot;")}"><li>a</li></ol>`);
            expect(levels[0][0]).toEqual({ format, text, start: 1 });
        });

        it("writes list-style's type, and the type of <ul type> and <li type>", async () => {
            expect((await lists('<ul style="list-style: square inside"><li>a</li></ul>')).levels[0][0].text).toBe("▪");
            expect((await lists('<ul style="list-style: none"><li>a</li></ul>')).levels[0][0].text).toBe("");
            expect((await lists('<ul type="circle"><li>a</li></ul>')).levels[0][0].text).toBe("◦");
            expect((await lists('<ul><li type="SQUARE">a</li></ul>')).levels[0][0].text).toBe("▪");
        });

        it("doesn't read <ol type> in the wrong case, as a and A are different", async () => {
            expect((await lists('<ol type="X"><li>a</li></ol>')).levels[0][0].format).toBe("decimal");
        });

        it("starts a list at its start", async () => {
            const { levels } = await lists(
                '<ol start="5"><li>a</li><li>b</li></ol><ol start="0"><li>c</li></ol><ol start="-3"><li>d</li></ol><ol start="x"><li>e</li></ol>',
            );
            expect(levels.map((list) => list[0].start)).toEqual([5, 0, 0, 1]);
        });

        it("starts a list at an item's value, numbering on from it", async () => {
            const { paragraphs, levels } = await lists('<ol><li>a</li><li value="10">b</li><li>c</li></ol>');
            expect(paragraphs.map(({ list }) => list)).toEqual([0, 1, 1]);
            expect(levels.map((list) => list[0].start)).toEqual([1, 10]);
        });

        it("numbers a reversed list down from its number of items, or its start", async () => {
            const { paragraphs, levels } = await lists(
                '<ol reversed><li>a</li><li>b</li><li>c</li></ol><ol reversed start="10"><li>d</li><li>e</li></ol>',
            );
            expect(paragraphs.map(({ list }) => list)).toEqual([0, 1, 2, 3, 4]);
            expect(levels.map((list) => list[0].start)).toEqual([3, 2, 1, 10, 9]);
        });
    });

    describe("editors' lists", () => {
        it("reads Quill 2's flat lists, with each item's depth from its class and its kind from data-list", async () => {
            const { paragraphs, levels } = await lists(
                '<ol><li data-list="ordered"><span class="ql-ui"></span>a</li><li data-list="ordered" class="ql-indent-1">b</li><li data-list="bullet" class="ql-indent-1">c</li><li data-list="ordered">d</li><li data-list="bullet">e</li></ol>',
            );
            expect(paragraphs.map(({ list, level, text }) => [list, level, text])).toEqual([
                [0, 0, "a"],
                [0, 1, "b"],
                [1, 1, "c"],
                [0, 0, "d"],
                [2, 0, "e"],
            ]);
            expect(levels[0][0].format).toBe("decimal");
            expect(levels[1][1].format).toBe("bullet");
            expect(levels[2][0].format).toBe("bullet");
        });

        it("starts Quill's deeper numbers at 1, not at the list's start", async () => {
            const { levels } = await lists('<ol start="4"><li>a</li><li class="ql-indent-1">b</li></ol>');
            expect(levels[0].slice(0, 2).map(({ start }) => start)).toEqual([4, 1]);
        });

        it("reads Quill 1's indented items", async () => {
            const { paragraphs } = await lists('<ul><li>a</li><li class="ql-indent-2">b</li><li>c</li></ul>');
            expect(paragraphs.map(({ level }) => level)).toEqual([0, 2, 0]);
        });

        it("writes Quill's checked and unchecked items with checkboxes and no bullets", () => {
            expect(formatted(htmlToContent('<ol><li data-list="checked">a</li><li data-list="unchecked">b</li></ol>'))).toBe(
                formatted([
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        children: [new CheckBox({ checked: true }), new TextRun({ children: [" a"] })],
                    }),
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        children: [new CheckBox({ checked: false }), new TextRun({ children: [" b"] })],
                    }),
                ]),
            );
        });

        it("writes Quill 1's checklists and Lexical's, with checkboxes", () => {
            expect(
                formatted(
                    htmlToContent(
                        '<ul data-checked="true"><li>a</li></ul><ul data-checked="false"><li>b</li></ul><ul><li role="checkbox" aria-checked="true">c</li></ul>',
                    ),
                ),
            ).toBe(
                formatted([
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        children: [new CheckBox({ checked: true }), new TextRun({ children: [" a"] })],
                    }),
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        children: [new CheckBox({ checked: false }), new TextRun({ children: [" b"] })],
                    }),
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        children: [new CheckBox({ checked: true }), new TextRun({ children: [" c"] })],
                    }),
                ]),
            );
        });

        it("writes TipTap's task lists with their checkboxes and text in one paragraph, without bullets", async () => {
            const tiptap =
                '<ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Done</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>To do</p><p>More</p></div></li></ul>';
            expect(formatted(htmlToContent(tiptap))).toBe(
                formatted([
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        children: [new CheckBox({ checked: true }), new TextRun({ children: [" Done"] })],
                    }),
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        children: [new CheckBox({ checked: false }), new TextRun({ children: [" To do"] })],
                    }),
                    new Paragraph({ indent: { left: 720 }, children: [new TextRun({ children: ["More"] })] }),
                ]),
            );
            expect((await listsIn(htmlToContent(tiptap))).levels[0][0].text).toBe("");
        });

        it("writes GitHub's task lists with their checkboxes", async () => {
            const github =
                '<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox" disabled checked> Done</li></ul>';
            expect(formatted(htmlToContent(github))).toBe(
                formatted([
                    new Paragraph({
                        numbering: { reference: "list", level: 0 },
                        children: [new CheckBox({ checked: true }), new TextRun({ children: [" Done"] })],
                    }),
                ]),
            );
            expect((await listsIn(htmlToContent(github))).levels[0][0].text).toBe("");
        });

        it("reads Word's lists, whose paragraphs have mso-list and their own numbers, which are left out", async () => {
            const word = [
                `<p class=MsoListParagraph style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span><![endif]>One</p>`,
                `<p class=MsoListParagraph style='mso-list:l0 level2 lfo1'><span style='mso-list:Ignore'>a.<span>&nbsp; </span></span>Two</p>`,
                `<p class=MsoListParagraph style='mso-list:l0 level1 lfo1'><span style='mso-list:Ignore'>2.<span>&nbsp; </span></span>Three</p>`,
                `<p class=MsoNormal>Plain</p>`,
                `<p class=MsoListParagraph style='mso-list:l1 level1 lfo2'><span style='font-family:Symbol;mso-list:Ignore'>·<span>&nbsp; </span></span>Bullet</p>`,
                `<p style='mso-list:l2 level1 lfo3'><span style='mso-list:Ignore'>iv)</span>Roman</p>`,
                `<p style='mso-list:l3 level1 lfo4'><span style='mso-list:Ignore'>C.</span>Letter</p>`,
                `<p style='mso-list:l5 level1 lfo6'><span style='mso-list:Ignore'>I.</span>Upper Roman</p>`,
                `<p style='mso-list:l4 level1 lfo5'>No marker</p>`,
            ].join("");
            const { paragraphs, levels } = await lists(word);
            expect(paragraphs.map(({ list, level, text }) => [list, level, text])).toEqual([
                [0, 0, "One"],
                [0, 1, "Two"],
                [0, 0, "Three"],
                [1, 0, "Bullet"],
                [2, 0, "Roman"],
                [3, 0, "Letter"],
                [4, 0, "Upper Roman"],
                [5, 0, "No marker"],
            ]);
            expect(levels[4][0]).toEqual({ format: "upperRoman", text: "%1.", start: 1 });
            expect(levels[0][0]).toEqual({ format: "decimal", text: "%1.", start: 1 });
            expect(levels[0][1]).toEqual({ format: "lowerLetter", text: "%2.", start: 1 });
            expect(levels[1][0].format).toBe("bullet");
            expect(levels[2][0]).toEqual({ format: "lowerRoman", text: "%1.", start: 4 });
            expect(levels[3][0]).toEqual({ format: "upperLetter", text: "%1.", start: 3 });
            expect(levels[5][0].format).toBe("bullet");
        });

        it("keeps numbering a Word list on after a paragraph that isn't in it", async () => {
            const word = `<p style='mso-list:l0 level1 lfo1'><span style='mso-list:Ignore'>1.</span>a</p><p>b</p><p style='mso-list:l0 level1 lfo1'><span style='mso-list:Ignore'>2.</span>c</p>`;
            const { paragraphs } = await lists(word);
            expect(paragraphs.map(({ list }) => list)).toEqual([0, 0]);
        });
    });

    describe("listLevelOf", () => {
        it("numbers at the depth given, and starts no lower than 0", () => {
            expect(listLevelOf("decimal", 2, -4)).toEqual({ format: LevelFormat.DECIMAL, text: "%3.", start: 0 });
        });

        it("has bullets for no list-style-type", () => {
            expect(listLevelOf(undefined, 0, 1)).toEqual({ format: LevelFormat.BULLET, text: "•", start: 1 });
        });
    });

    describe("numberLists", () => {
        it("writes the deepest level of Word's lists", () => {
            expect(DEEPEST_LEVEL).toBe(8);
        });

        it("gives the levels a definition has no lists at bullets or numbers, as its first list's", () => {
            const bullets = [...numberLists([item(1, {}, "disc")]).values()][0].reference;
            expect(bullets.levels.map(({ text }) => text).slice(0, 4)).toEqual(["•", "•", "▪", "▪"]);
        });

        it("gives each definition a reference of its own", () => {
            const [first, second] = [...numberLists([item(0, {}), item(0, {})]).values()];
            expect(first.reference.reference).not.toBe(second.reference.reference);
        });

        it("leaves out blocks that aren't items of lists", () => {
            const paragraph: Block = { type: "paragraph", format: {}, content: [] };
            expect(numberLists([paragraph, { type: "block-break", kind: "page" }]).size).toBe(0);
        });
    });
});

/** A paragraph that is the first of an item of a list */
const item = (depth: number, list: object, type = "decimal"): ParagraphBlock => ({
    type: "paragraph",
    format: {},
    content: [],
    item: { depth, level: listLevelOf(type, depth, 1), list },
});
