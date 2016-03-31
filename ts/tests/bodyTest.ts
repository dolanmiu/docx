/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {Body} from "../docx/document/body";
import {assert} from "chai";

function jsonify(obj: Object) {
    var stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe('Body', () => {
    var body: Body;

    beforeEach(() => {
        body = new Body();
    });

    describe('#constructor()', () => {

    });
});