import { describe, expect, it } from "vitest";

import { Paragraph, TextRun } from "docx";

import { describeDiagram, describeDrawing } from "./shape-description";
import type { IShapeGroupChildOptions } from "./shape-drawing";

const step = (id: string, text: string): IShapeGroupChildOptions => ({
    id,
    type: "rectangle",
    text,
    transformation: { width: 10, height: 10 },
});

const connect = (from: string, to: string, label?: string): IShapeGroupChildOptions => ({ type: "connector", from, to, label });

describe("describeDiagram", () => {
    it("should tell a flowchart from its start, with each branch of a decision and the way back round a loop", () => {
        expect(
            describeDiagram([
                step("start", "Start"),
                step("draft", "Write the draft"),
                step("review", "Approved?"),
                step("publish", "Publish"),
                step("fix", "Fix it"),
                step("end", "End"),
                connect("start", "draft"),
                connect("draft", "review"),
                connect("review", "publish", "Yes"),
                connect("review", "fix", "No"),
                connect("publish", "end"),
                connect("fix", "draft"),
            ]),
        ).to.equal("Start, then Write the draft, then Approved? Yes: Publish, then End. No: Fix it, then back to Write the draft.");
    });

    it("should name a shape again where branches meet, and tell branches without labels", () => {
        expect(
            describeDiagram([
                step("a", "Split"),
                step("b", "Left"),
                step("c", "Right"),
                step("d", "Join"),
                step("e", "Ask again?"),
                connect("a", "b"),
                connect("a", "c"),
                connect("b", "d"),
                connect("c", "d"),
                connect("a", "e", "Stuck"),
                // A connector to a shape that doesn't exist is left out
                connect("d", "missing"),
            ]),
        ).to.equal("Split. Then Left, then Join. Then Right, then Join. Stuck: Ask again?");
    });

    it("should list the shapes a shape leads to without labels, as in an org chart, then tell each that leads on", () => {
        expect(
            describeDiagram([
                step("ceo", "Chief Executive"),
                step("cto", "Technology"),
                step("cfo", "Finance"),
                step("coo", "Operations"),
                step("dev", "Development"),
                step("qa", "Quality"),
                step("infra", "Infrastructure"),
                connect("ceo", "cto"),
                connect("ceo", "cfo"),
                connect("ceo", "coo"),
                connect("cto", "dev"),
                connect("cto", "qa"),
                connect("coo", "infra"),
            ]),
        ).to.equal(
            "Chief Executive leads to Technology, Finance and Operations. Technology leads to Development and Quality. Operations, then Infrastructure.",
        );
    });

    it("should tell shapes that aren't connected, and loops without a start, in the order they are given", () => {
        expect(
            describeDiagram([
                { type: "rectangle", text: "Title", transformation: { width: 10, height: 10 } },
                step("a", "Ping"),
                step("b", "Pong"),
                connect("a", "b"),
                connect("b", "a"),
            ]),
        ).to.equal("Title. Ping, then Pong, then back to Ping.");
    });

    it("should read text from paragraphs and labels, alternative text, pictures and groups, and leave out shapes that say nothing", () => {
        expect(
            describeDiagram([
                {
                    id: "a",
                    type: "rectangle",
                    children: [new Paragraph({ children: [new TextRun("Two"), new TextRun({ text: " words", break: 1 })] })],
                    transformation: { width: 10, height: 10 },
                },
                { id: "blank", type: "ellipse", transformation: { width: 10, height: 10 } },
                {
                    id: "logo",
                    type: "picture",
                    image: { type: "png", data: "" },
                    transformation: { width: 1, height: 1 },
                    altText: { name: "Logo" },
                },
                { id: "photo", type: "picture", image: { type: "png", data: "" }, transformation: { width: 1, height: 1 } },
                {
                    type: "group",
                    children: [{ ...step("inner", "Hidden text"), altText: { name: "Inner" } } as IShapeGroupChildOptions],
                },
                { type: "connector", from: "a", to: "logo", label: { text: [new Paragraph("Then")] } },
                { type: "connector", from: "logo", to: { id: "inner", side: "top" }, label: { text: "Last", width: 20, height: 10 } },
                connect("a", "blank"),
                connect("a", "a"),
            ]),
        ).to.equal("Two words, then Logo, then Inner.");
    });

    it("should say nothing for a diagram without text", () => {
        expect(describeDiagram([{ type: "rectangle", transformation: { width: 10, height: 10 } }])).to.equal("");
    });
});

describe("describeDrawing", () => {
    const children = [step("a", "Start"), step("b", "End"), connect("a", "b")];

    it("should describe a drawing without a description of its own", () => {
        expect(describeDrawing({ children })).to.deep.equal({ name: "", description: "Start, then End.", title: "" });
        expect(describeDrawing({ children, altText: { name: "Process" } })).to.deep.equal({
            name: "Process",
            description: "Start, then End.",
        });
    });

    it("should keep a drawing's own description, and not describe decorative drawings or ones without text", () => {
        const altText = { name: "Process", description: "Mine" };
        expect(describeDrawing({ children, altText })).to.equal(altText);
        expect(describeDrawing({ children, decorative: true })).to.equal(undefined);
        expect(describeDrawing({ children: [{ type: "rectangle", transformation: { width: 10, height: 10 } }] })).to.equal(undefined);
    });
});
