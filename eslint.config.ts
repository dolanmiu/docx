import eslint from "@eslint/js";
import type { Linter } from "eslint";
import importPlugin from "eslint-plugin-import";
import unicorn from "eslint-plugin-unicorn";
import jsdoc from "eslint-plugin-jsdoc";
import preferArrow from "eslint-plugin-prefer-arrow";
import functional from "eslint-plugin-functional";
import globals from "globals";
import tsEslint from "typescript-eslint";

const config: Linter.Config<Linter.RulesRecord>[] = [
    {
        ignores: ["**/vite.config.ts", "**/dist/**", "**/coverage/**", "**/*.js", "eslint.config.ts", "**/demo/**", "**/scripts/**"],
    },
    eslint.configs.recommended,
    importPlugin.flatConfigs.recommended,
    ...tsEslint.configs.recommended,
    ...tsEslint.configs.stylistic,
    {
        files: ["**/src/**/*.ts"],
        plugins: {
            unicorn,
            jsdoc,
            "prefer-arrow": preferArrow,
            functional,
        },

        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        settings: {
            "import/resolver": {
                typescript: true,
                node: true,
            },
        },

        rules: {
            "no-undef": "off",
            "no-extra-boolean-cast": "off",
            "no-alert": "error",
            "no-self-compare": "error",
            "no-unreachable-loop": "error",
            "no-template-curly-in-string": "error",
            "no-unused-private-class-members": "error",
            "no-extend-native": "error",
            "no-floating-decimal": "error",
            "no-implied-eval": "error",
            "no-iterator": "error",
            "no-lone-blocks": "error",
            "no-loop-func": "error",
            "no-new-object": "error",
            "no-proto": "error",
            "no-useless-catch": "error",
            "one-var-declaration-per-line": "error",
            "prefer-arrow-callback": "error",
            "prefer-destructuring": "error",
            "prefer-exponentiation-operator": "error",
            "prefer-promise-reject-errors": "error",
            "prefer-regex-literals": "error",
            "prefer-spread": "error",
            "prefer-template": "error",
            "require-await": "error",
            "@typescript-eslint/adjacent-overload-signatures": "error",

            "@typescript-eslint/array-type": [
                "error",
                {
                    default: "array",
                },
            ],

            "@typescript-eslint/no-restricted-types": [
                "error",
                {
                    types: {
                        Object: {
                            message: "Avoid using the `Object` type. Did you mean `object`?",
                            fixWith: "object",
                        },

                        Function: {
                            message: "Avoid using the `Function` type. Prefer a specific function type, like `() => void`.",
                        },

                        Boolean: {
                            message: "Avoid using the `Boolean` type. Did you mean `boolean`?",
                            fixWith: "boolean",
                        },

                        Number: {
                            message: "Avoid using the `Number` type. Did you mean `number`?",
                            fixWith: "number",
                        },

                        String: {
                            message: "Avoid using the `String` type. Did you mean `string`?",
                            fixWith: "string",
                        },

                        Symbol: {
                            message: "Avoid using the `Symbol` type. Did you mean `symbol`?",
                            fixWith: "symbol",
                        },
                    },
                },
            ],

            "@typescript-eslint/consistent-type-assertions": "error",
            "@typescript-eslint/dot-notation": "error",

            "@typescript-eslint/explicit-function-return-type": [
                "error",
                {
                    allowExpressions: true,
                    allowTypedFunctionExpressions: true,
                    allowHigherOrderFunctions: false,
                    allowDirectConstAssertionInArrowFunctions: true,
                    allowConciseArrowFunctionExpressionsStartingWithVoid: true,
                },
            ],

            "@typescript-eslint/explicit-member-accessibility": [
                "error",
                {
                    accessibility: "explicit",

                    overrides: {
                        accessors: "explicit",
                    },
                },
            ],

            "@typescript-eslint/explicit-module-boundary-types": [
                "error",
                {
                    allowArgumentsExplicitlyTypedAsAny: true,
                    allowDirectConstAssertionInArrowFunctions: true,
                    allowHigherOrderFunctions: false,
                    allowTypedFunctionExpressions: false,
                },
            ],

            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: ["objectLiteralProperty"],
                    leadingUnderscore: "allow",
                    format: ["camelCase", "PascalCase", "UPPER_CASE"],

                    filter: {
                        regex: "(^[a-z]+:.+)|_attr|[0-9]",
                        match: false,
                    },
                },
            ],

            "@typescript-eslint/no-empty-function": "error",
            "@typescript-eslint/no-empty-interface": "error",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-misused-new": "error",
            "@typescript-eslint/no-namespace": "error",
            "@typescript-eslint/no-parameter-properties": "off",
            "@typescript-eslint/no-require-imports": "error",

            "@typescript-eslint/no-shadow": [
                "error",
                {
                    hoist: "all",
                },
            ],

            "@typescript-eslint/consistent-type-definitions": ["error", "type"],

            "@typescript-eslint/no-this-alias": "error",
            "@typescript-eslint/no-unused-expressions": "error",
            "@typescript-eslint/no-use-before-define": "off",
            "@typescript-eslint/no-var-requires": "error",
            "@typescript-eslint/prefer-for-of": "error",
            "@typescript-eslint/prefer-function-type": "error",
            "@typescript-eslint/prefer-namespace-keyword": "error",
            "@typescript-eslint/prefer-readonly": "error",

            "@typescript-eslint/triple-slash-reference": [
                "error",
                {
                    path: "always",
                    types: "prefer-import",
                    lib: "always",
                },
            ],

            "@typescript-eslint/typedef": [
                "error",
                {
                    parameter: true,
                    propertyDeclaration: true,
                },
            ],

            "@typescript-eslint/no-inferrable-types": "off",

            "@typescript-eslint/unified-signatures": "error",
            "arrow-body-style": "error",
            complexity: "off",
            "consistent-return": "error",
            "constructor-super": "error",
            curly: "error",
            "dot-notation": "off",
            eqeqeq: ["error", "smart"],
            "guard-for-in": "error",

            "id-denylist": ["error", "any", "Number", "number", "String", "string", "Boolean", "boolean", "Undefined", "undefined"],

            "id-match": "error",
            "import/no-default-export": "error",
            "import/no-extraneous-dependencies": "off",
            "import/no-internal-modules": "off",
            "sort-imports": [
                "error",
                {
                    allowSeparatedGroups: true,
                    ignoreDeclarationSort: true,
                },
            ],
            "import/order": [
                "error",
                {
                    groups: [["external", "builtin"], "internal", ["sibling", "parent", "index"]],
                    "newlines-between": "always",
                    pathGroups: [
                        { pattern: "@file/**/*", group: "internal" },
                        { pattern: "@file/**", group: "internal" },
                        { pattern: "@export/**", group: "internal" },
                    ],
                    pathGroupsExcludedImportTypes: ["internal"],
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true,
                    },
                },
            ],
            indent: "off",
            "jsdoc/check-alignment": "error",
            "jsdoc/check-indentation": "off",
            "max-classes-per-file": "off",
            "max-len": "off",
            "new-parens": "error",
            "no-bitwise": "error",
            "no-caller": "error",
            "no-cond-assign": "error",
            "no-console": "error",
            "no-debugger": "error",
            "no-duplicate-case": "error",
            "no-duplicate-imports": "error",
            "no-empty": "error",
            "no-empty-function": "off",
            "no-eval": "error",
            "no-extra-bind": "error",
            "no-fallthrough": "off",
            "no-invalid-this": "off",
            "no-multiple-empty-lines": "error",
            "no-new-func": "error",
            "no-new-wrappers": "error",
            "no-param-reassign": "error",
            "no-redeclare": "error",
            "no-return-await": "error",
            "no-sequences": "error",
            "no-shadow": "off",
            "no-sparse-arrays": "error",
            "no-throw-literal": "error",
            "no-trailing-spaces": "error",
            "no-undef-init": "error",

            "no-underscore-dangle": [
                "error",
                {
                    allow: ["_attr"],
                },
            ],

            "no-unsafe-finally": "error",
            "no-unused-expressions": "off",
            "no-unused-labels": "error",
            "no-use-before-define": "off",
            "no-useless-constructor": "error",
            "no-var": "error",
            "object-shorthand": "off",
            "one-var": ["error", "never"],
            "prefer-arrow/prefer-arrow-functions": "error",
            "prefer-const": "error",
            "prefer-object-spread": "error",
            radix: "error",
            "space-in-parens": ["error", "never"],

            "spaced-comment": [
                "error",
                "always",
                {
                    markers: ["/"],
                },
            ],

            "unicorn/filename-case": "error",
            "unicorn/prefer-ternary": "error",
            "use-isnan": "error",
            "valid-typeof": "off",

            "functional/immutable-data": [
                "error",
                {
                    ignoreImmediateMutation: true,
                    ignoreAccessorPattern: ["**.root*", "**.numberingReferences*", "**.sections*", "**.properties*"],
                },
            ],

            "functional/prefer-property-signatures": "error",
            "functional/no-mixed-types": "error",
            "functional/prefer-readonly-type": "error",

            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^[_]+$",
                },
            ],
        },
    },
    {
        files: ["**/*.spec.ts"],
        plugins: {
            unicorn,
            jsdoc,
            "prefer-arrow": preferArrow,
            functional,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },

            sourceType: "module",

            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                project: ["tsconfig.json"],
            },
        },
        rules: {
            "@typescript-eslint/no-unused-expressions": "off",
            "@typescript-eslint/dot-notation": "off",
            "prefer-destructuring": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^[_]+$",
                },
            ],
        },
    },
];

export default config;
