# Monaco-It

Monaco-It is a chrome extension turning Ace Editor into Monaco Editor, supporting all features including autocompletes.

[一些中文说明](./README_cn.md)

## Supported Languages

If enable language service (intellisense), keywords and token autocompletion will not registered.

- `html`, `css`, `javascript`, `typescript`: monaco editor supports intellisense
- `c`, `c++`: intellisense (need ccls), snippets, keywords
- `python`: intellisense (need pyls), snippets, keywords
- all languages: monaco editor supports hightlight and simple completion

## How It Works

Monaco-It will find the ace editor div by class "ace-editor" in the page, then codes will be syncronized between monaco and ace.

## Adding Language Support

- create `lang.js` in languages, and provide these exports:
  - `language`: monaco.language.register
  - `enableTokenCompletion`: whether enable token completion for this language if not connected to language server
  - `snippets`
  - `keywords`
    If you only use intellisense, `snippts` and `keywords` can be emply arrays.
- add `"lang"` to `supportedLanguages` in `languageLoader.js`

## Intellisense (Language Server)

We provide a language server for monaco editor, which supports `c++` and `python` experimentally: https://github.com/moeakwak/monaco-language-server

### Limitation

It needs WebSocket to connect local language server and sync files, and may be blocked because of Conetent Script Policy.

Mostly, you can use SSL connection (`wss://` instead of `ws://`) to solve this problem.