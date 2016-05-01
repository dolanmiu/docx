import * as _ from "lodash";
import {XmlComponent} from "../docx/xml-components";

export class Formatter {

    format(input: any): Object {
        this.replaceKeys(input);
        input.clearVariables();
        var newJson = this.clense(input);
        console.log(JSON.stringify(newJson, null, "  "));
        return newJson;
    }

    private replaceKeys(input: XmlComponent): Object {
        input.replaceKey();

        return input;
    }

    private clense(input: any): Object {
        var newJson = this.jsonify(input);

        this.deepTraverseJson(newJson, (parent, value, key) => {
            if (key === "properties") {
                delete parent[key];
            }
            if (key === "xmlKeys") {
                delete parent[key];
            }
            if (key === "rootKey") {
                delete parent[key];
            }
        });

        return newJson
    }

    private jsonify(obj: Object): Object {
        var stringifiedJson = JSON.stringify(obj);
        return JSON.parse(stringifiedJson);
    }

    private deepTraverseJson(json: Object, lambda: (json: any, value: any, key: any) => void): void {
        _.forOwn(json, (value, key) => {
            if (_.isObject(value) && key !== "xmlKeys" && key != "rootKey") {
                this.deepTraverseJson(value, lambda);
            }
            lambda(json, value, key);
        });
    }

}