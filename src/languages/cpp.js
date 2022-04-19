import { getTokens } from "./tokenizer";

let registerd = false;

export function registerCpp(monaco, editor, languageService) {
  if (!registerd) {
    registerd = true;
    monaco.languages.registerCompletionItemProvider("cpp", {
      provideCompletionItems: function (model, position) {
        var word = model.getWordUntilPosition(position);
        var range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        return {
          suggestions: createDependencyProposals(
            monaco,
            range,
            languageService,
            editor,
            word
          ),
        };
      },
    });
  }
}

function createDependencyProposals(
  monaco,
  range,
  languageService = false,
  editor,
  curWord
) {
  let snippets = [
    {
      label: "main",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "int main(int argc, char *argv[])",
      insertText: "int main(int argc, char *argv[]) {\n\t${1}\n}",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: "cin",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "cin",
      insertText: "std::cin >> ${1:value};",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: "cout",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "cout with endl",
      insertText: "std::cout << ${1:value} << std::endl;",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: "forloop",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "for loop with index++",
      insertText:
        "for (auto ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t${3}\n}",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: "foreach",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "for-each-in loop",
      insertText: "for (auto &${1:element}: ${2:container}) {\n\t${3}\n}",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: "forit",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "for loop with iterator++",
      insertText:
        "for (auto it = ${1:container}.begin(); it != ${1:container}.end(); ++it) {\n\t${2}\n}",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: "header_wrapper",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "wrapper to include this file only once",
      insertText: "#ifndef ${1}\n#define ${1}\n\n${2}\n\n#endif /* ${1} */",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
    {
      label: "include_stdcpp",
      kind: monaco.languages.CompletionItemKind.Snippet,
      documentation: "include all header for std c++",
      insertText: "#include <bits/stdc++.h>\n",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range,
    },
  ];
  let keys = [];
  for (const item of cpp_keys) {
    keys.push({
      label: item,
      kind: monaco.languages.CompletionItemKind.Keyword,
      documentation: "",
      insertText: item,
      range: range,
    });
  }

  let words = [];
  let tokens = getTokens(editor.getModel().getValue());
  for (const item of tokens) {
    if (item != curWord.word) {
      words.push({
        label: item,
        kind: monaco.languages.CompletionItemKind.Text,
        documentation: "",
        insertText: item,
        range: range,
      });
    }
  }

  if (languageService) {
    return snippets;
  } else {
    return snippets.concat(keys).concat(words);
  }
}

export const cpp_keys = [
  "and",
  "and_eq",
  "asm",
  "auto",
  "bitand",
  "bitor",
  "bool",
  "break",
  "case",
  "catch",
  "char",
  "class",
  "compl",
  "const",
  "constexpr",
  "const_cast",
  "continue",
  "decltype",
  "default",
  "delete",
  "do",
  "double",
  "dynamic_cast",
  "else",
  "enum",
  "explicit",
  "export",
  "extern",
  "false",
  "float",
  "for",
  "friend",
  "goto",
  "if",
  "inline",
  "int",
  "long",
  "mutable",
  "namespace",
  "new",
  "noexcept",
  "not",
  "not_eq",
  "nullptr",
  "operator",
  "or",
  "or_eq",
  "private",
  "protected",
  "public",
  "register",
  "reinterpret_cast",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "static_assert",
  "static_cast",
  "struct",
  "switch",
  "template",
  "this",
  "thread_local",
  "throw",
  "true",
  "try",
  "typedef",
  "typeid",
  "typename",
  "union",
  "unsigned",
  "using",
  "virtual",
  "void",
  "volatile",
  "wchar_t",
  "while",
  "xor",
  "xor_eq",
  "override",
  "final",
  "std",
  "define",
  "include",
];
