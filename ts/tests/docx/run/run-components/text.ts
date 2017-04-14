import { expect } from "chai";
import { Text } from "../../../../docx/run/run-components/text";
import { Formatter } from "../../../../export/formatter";

describe("Text", () => {
    describe("#constructor", () => {
        it("creates an empty text run if no text is given", () => {
            const t = new Text("");
            const f = new Formatter().format(t);
            expect(f).to.deep.equal({"w:t": [{_attr: {"xml:space": "preserve"}}]});
        });

        it("adds the passed in text to the component", () => {
            const t = new Text(" this is\n text");
            const f = new Formatter().format(t);
            expect(f).to.deep.equal({"w:t": [
                {_attr: {"xml:space": "preserve"}},
                " this is\n text",
            ]});
        });
    });
});
