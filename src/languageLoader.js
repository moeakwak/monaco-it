// localize zh-CN
import { setLocaleData } from "monaco-editor-nls";
import zh_CN from "monaco-editor-nls/locale/zh-hans";
if (document.head.dataset.monacoItOptions) {
  let options = JSON.parse(document.head.dataset.monacoItOptions);
  if (options.editorLocale == "zh_CN") {
    setLocaleData(zh_CN);
  }
}

import { Registry } from "monaco-textmate";

export const grammars = new Map();
grammars.set("cpp", "source.cpp");
grammars.set("python", "source.python");

export function getRegistry() {
  const url = document.head.dataset.monacoItPublicPath;
  console.log(url);

  const grammarFiles = {
    "source.cpp": "cpp.tmLanguage.json",
    "source.python": "MagicPython.tmLanguage.json",
    "source.cpp.embedded.macro": "cpp.embedded.macro.tmLanguage.json",
    "source.regexp.python": "MagicRegExp.tmLanguage.json",
    "source.sql": "sql.tmLanguage.json",
  };

  return new Registry({
    getGrammarDefinition: async (scopeName) => {
      // console.log("fetch", scopeName, grammarFiles);
      if (scopeName in grammarFiles)
        return {
          format: "json",
          content: await (
            await fetch(
              require("path").join(url, "/grammars/" + grammarFiles[scopeName])
            )
          ).text(),
        };
      else {
        console.warn("no grammar for", scopeName);
        return { format: "json", content: {} };
      }
    },
  });
}

const monaco = require("monaco-editor/esm/vs/editor/editor.api");

// there must exists lang.js in languages folder, if supportedLanguages includes lang
export const supportedLanguages = ["python", "cpp"];

let completionItemProviders = {};

// register completion for snippets (and keywords/tokens)
// will ensure no repeat registerCompletionItemProvider call
export function registerCompletion(editor, lang, enableLanguageService) {
  if (!supportedLanguages.includes(lang)) {
    console.log("[monaco-it] registerCompletion not support:", lang);
    return;
  }

  console.log("[monaco-it] registerCompletion:", lang, enableLanguageService);

  // dispose completionItemProvider if it exists
  if (lang in completionItemProviders && !!completionItemProviders[lang]) {
    console.log(
      "[monaco-it] dispose completionItemProvider:",
      completionItemProviders[lang]
    );
    completionItemProviders[lang].dispose();
    completionItemProviders[lang] = null;
  }

  completionItemProviders[lang] =
    monaco.languages.registerCompletionItemProvider(lang, {
      provideCompletionItems: function (model, position) {
        var curWord = model.getWordUntilPosition(position);
        var range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: curWord.startColumn,
          endColumn: curWord.endColumn,
        };
        let suggestions = createDependencyProposals(
          range,
          editor,
          curWord,
          lang,
          enableLanguageService
        );
        // console.log("[monaco-it] provideCompletionItems", suggestions);
        return {
          suggestions: suggestions,
        };
      },
    });

  console.log(
    "[monaco-it] current completionItemProviders:",
    completionItemProviders
  );
  const langConfig = require(`./languages/${lang}.js`);
  console.log("[monaco-it] current language supports:", langConfig);
}

export function registerLanguages() {
  // for (let lang of supportedLanguages) {
  //   const { language } = require(`./languages/${lang}.js`);
  //   monaco.languages.register(language);
  //   console.log("[monaco-it] register language", language);
  // }
}

function createDependencyProposals(
  range,
  editor,
  curWord,
  lang,
  enableLanguageService = false
) {
  const {
    keywords,
    snippets,
    enableTokenCompletion,
  } = require(`./languages/${lang}.js`);

  let proposals = [];

  if (!!snippets) {
    for (const item of snippets) {
      proposals.push({
        label: item.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: item.documentation,
        insertText: item.insertText,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: handleRange(range, item.rangeRule),
      });
    }
  }

  if (!enableLanguageService && !!keywords) {
    for (const item of keywords) {
      proposals.push({
        label: item,
        kind: monaco.languages.CompletionItemKind.Keyword,
        documentation: "",
        insertText: item,
        range: range,
      });
    }
  }

  if (enableTokenCompletion) {
    let tokens = getTokens(editor.getModel().getValue());
    for (const item of tokens) {
      if (item != curWord.word) {
        proposals.push({
          label: item,
          kind: monaco.languages.CompletionItemKind.Text,
          documentation: `${item} (from tokens)`,
          insertText: item,
          range: range,
        });
      }
    }
  }

  return proposals;
}

function handleRange(range, rangeRule = "replaceCurrentWord") {
  if (rangeRule == "replaceCurrentWord") return range;
  else return range;
}

const identifierPattern = "([a-zA-Z_]\\w*)";

function getTokens(code) {
  let identifier = new RegExp(identifierPattern, "g");
  let tokens = [];
  let array1;
  while ((array1 = identifier.exec(code)) !== null) {
    tokens.push(array1[0]);
  }
  return Array.from(new Set(tokens));
}

let done = false;

export function hasGetAllWorkUrl() {
  return done;
}

// create workers using blob
export function getWorkerUrl(baseUrl) {
  function workerCros(url) {
    const iss = "importScripts('" + url + "');";
    return new Worker(URL.createObjectURL(new Blob([iss])));
  }
  return function (moduleId, label) {
    done = true;
    if (label === "json") {
      return workerCros(baseUrl + "json.worker.js");
    }
    if (label === "css") {
      return workerCros(baseUrl + "css.worker.js");
    }
    if (label === "html") {
      return workerCros(baseUrl + "html.worker.js");
    }
    if (label === "typescript" || label === "javascript") {
      return workerCros(baseUrl + "ts.worker.js");
    }
    return workerCros(baseUrl + "editor.worker.js");
  };
}
