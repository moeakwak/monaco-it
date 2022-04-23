# Monaco It

Monaco It is a chrome extension which helps change ace editor to monaco editor, supporting all features including autocompletes.

[一些中文说明](./README_cn.md)

## Supported Languages

If enable language service (intellisense), keywords and token autocompletion will not registered.

- `html`, `css`, `javascript`, `typescript`: monaco editor supports intellisense
- `c`, `c++`: intellisense (need ccls), snippets, keywords
- `python`: intellisense (need pyls), snippets, keywords
- all languages: monaco editor supports hightlight and simple completion

## How It Works

First, MonacoIt will find divs with class "ace-editor" in the page. If so, it will hide that div, and create a monaco editor in the same place, just after the hided ace editor. Codes will be syncronized from monaco to ace, and the monaco editor's language will be the same as ace.

To enable intellisense on supported language:

- will try to use websocket connect ws://localhost:3000/language_name
- If connected, then register snippets completion
- If cannot connect, then register snippets, keywords and autocompletion based on simple tokenize

## Adding Language Support

Assuming you're going to add support for language called "lang":

- create `lang.js` in languages, and provide these exports:
  - `language`: monaco.language.register
  - `enableTokenCompletion`: whether enable token completion for this language if not connected to language server
  - `snippets`
  - `keywords`
    If you only use intellisense, `snippts` and `keywords` can be emply arrays.
- add `"lang"` to `supportedLanguages` in `languageLoader.js`

## Intellisense (Language Server)

We provide a language server, which supports `c++` and `python` experimentally: https://github.com/moeakwak/monaco-language-server

### Limitation

It needs WebSocket to connect local language server and sync files, and may be blocked because of Conetent Script Policy.

Mostly, you can use SSL connection (`wss://` instead of `ws://`) to solve this problem.