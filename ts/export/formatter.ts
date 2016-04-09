import * as _ from "lodash";

export class Formatter {

    format(input: any): Object {
        this.deepTraverseJson(input, (parent, value, key) => {
            if (isNaN(key) && key !== "rootKey") {
                var newKey = parent.rootKey;
                console.log(key);
                if (newKey !== key) {
                    parent[newKey] = parent[key];
                    delete parent[key];
                } else {
                    //console.error("Key is not in dictionary:" + key);
                }
            }
        });

        var newJson = this.clense(input);

        return newJson;
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