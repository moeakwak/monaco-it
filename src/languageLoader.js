const monaco = require("monaco-editor");

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
    console.log("[monaco-it] dispose completionItemProvider:", completionItemProviders[lang]);
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
  for (let lang of supportedLanguages) {
    const { language } = require(`./languages/${lang}.js`);
    monaco.languages.register(language);
    console.log("[monaco-it] register language", language);
  }
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
