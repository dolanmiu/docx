/// <reference path="../typings/mocha/mocha.d.ts" />
import * as docx from "../docx";

describe('Calculator', () => {
    var document : docx.Document;

    /*beforeEach(function () {
        subject = new Calculator();
    });

    describe('#add', () => {
        it('should add two numbers together', () => {
            var result : number = subject.add(2, 3);
            if (result !== 5) {
                throw new Error('Expected 2 + 3 = 5 but was ' + result);
            }
        });
    });*/
    describe('#test', () => {
        var document = new docx.Document();
        var paragraph = new docx.Paragraph();
        //var body = new docx.Body();
        console.log(paragraph);
        console.log(JSON.stringify(paragraph, null, "    "));
        console.log(document.test());
    });
});