import * as _ from "lodash";

export class Formatter {

    private xmlKeyDictionary = {
        p: 'w:p'
    };

    format(input: any) {
        var stringified = JSON.stringify(input);
        var newJson = JSON.parse(stringified);
        this.deepTraverseJson(newJson, (parent, value, key) => {
            if (isNaN(key)) {
                var newKey = this.getReplacementKey(key);
                parent[newKey] = parent[key];
                if (newKey !== key) {
                    delete parent[key];
                }
            }
        });
        console.log(newJson);

        return newJson;
    }

    private deepTraverseJson(json: Object, lambda: (json: any, value: any, key: any) => void) {
        _.forOwn(json, (value, key) => {
            if (_.isObject(value)) {
                this.deepTraverseJson(value, lambda);
            }
            lambda(json, value, key);
        });
    }

    private getReplacementKey(key: string): string {
        var newKey = this.xmlKeyDictionary[key];

        if (newKey !== undefined) {
            return newKey;
        } else {
            return key;
        }
    }

}