"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonacoLanguages = exports.testGlob = exports.MonacoModelIdentifier = void 0;
const tslib_1 = require("tslib");
const glob_to_regexp_1 = tslib_1.__importDefault(require("glob-to-regexp"));
const services_1 = require("./services");
const monaco_diagnostic_collection_1 = require("./monaco-diagnostic-collection");
var MonacoModelIdentifier;
(function (MonacoModelIdentifier) {
    function fromDocument(_monaco, document) {
        return {
            uri: _monaco.Uri.parse(document.uri),
            languageId: document.languageId
        };
    }
    MonacoModelIdentifier.fromDocument = fromDocument;
    function fromModel(model) {
        return {
            uri: model.uri,
            languageId: model.getLanguageId()
        };
    }
    MonacoModelIdentifier.fromModel = fromModel;
})(MonacoModelIdentifier = exports.MonacoModelIdentifier || (exports.MonacoModelIdentifier = {}));
function testGlob(pattern, value) {
    const regExp = (0, glob_to_regexp_1.default)(pattern, {
        extended: true,
        globstar: true
    });
    return regExp.test(value);
}
exports.testGlob = testGlob;
class MonacoLanguages {
    constructor(_monaco, p2m, m2p) {
        this._monaco = _monaco;
        this.p2m = p2m;
        this.m2p = m2p;
    }
    match(selector, document) {
        return this.matchModel(selector, MonacoModelIdentifier.fromDocument(this._monaco, document));
    }
    createDiagnosticCollection(name) {
        return new monaco_diagnostic_collection_1.MonacoDiagnosticCollection(this._monaco, name || 'default', this.p2m);
    }
    registerCompletionItemProvider(selector, provider, ...triggerCharacters) {
        const completionProvider = this.createCompletionProvider(provider, ...triggerCharacters);
        return this._monaco.languages.registerCompletionItemProvider(selector, completionProvider);
    }
    createCompletionProvider(provider, ...triggerCharacters) {
        return {
            triggerCharacters,
            provideCompletionItems: async (model, position, context, token) => {
                const wordUntil = model.getWordUntilPosition(position);
                const defaultRange = new this._monaco.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
                const params = this.m2p.asCompletionParams(model, position, context);
                const result = await provider.provideCompletionItems(params, token);
                return result && this.p2m.asCompletionResult(result, defaultRange);
            },
            resolveCompletionItem: provider.resolveCompletionItem ? async (item, token) => {
                const protocolItem = this.m2p.asCompletionItem(item);
                const resolvedItem = await provider.resolveCompletionItem(protocolItem, token);
                if (resolvedItem) {
                    const resolvedCompletionItem = this.p2m.asCompletionItem(resolvedItem, item.range);
                    Object.assign(item, resolvedCompletionItem);
                }
                return item;
            } : undefined
        };
    }
    registerHoverProvider(selector, provider) {
        const hoverProvider = this.createHoverProvider(provider);
        return this._monaco.languages.registerHoverProvider(selector, hoverProvider);
    }
    createHoverProvider(provider) {
        return {
            provideHover: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const hover = await provider.provideHover(params, token);
                return hover && this.p2m.asHover(hover);
            }
        };
    }
    registerSignatureHelpProvider(selector, provider, ...triggerCharacters) {
        const signatureHelpProvider = this.createSignatureHelpProvider(provider, ...triggerCharacters);
        return this._monaco.languages.registerSignatureHelpProvider(selector, signatureHelpProvider);
    }
    createSignatureHelpProvider(provider, ...triggerCharacters) {
        const signatureHelpTriggerCharacters = [...(provider.triggerCharacters || triggerCharacters || [])];
        return {
            signatureHelpTriggerCharacters,
            signatureHelpRetriggerCharacters: provider.retriggerCharacters,
            provideSignatureHelp: async (model, position, token, context) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const signatureHelp = await provider.provideSignatureHelp(params, token, this.m2p.asSignatureHelpContext(context));
                return signatureHelp && this.p2m.asSignatureHelpResult(signatureHelp);
            }
        };
    }
    registerDefinitionProvider(selector, provider) {
        const definitionProvider = this.createDefinitionProvider(provider);
        return this._monaco.languages.registerDefinitionProvider(selector, definitionProvider);
    }
    createDefinitionProvider(provider) {
        return {
            provideDefinition: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideDefinition(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        };
    }
    registerReferenceProvider(selector, provider) {
        const referenceProvider = this.createReferenceProvider(provider);
        return this._monaco.languages.registerReferenceProvider(selector, referenceProvider);
    }
    createReferenceProvider(provider) {
        return {
            provideReferences: async (model, position, context, token) => {
                const params = this.m2p.asReferenceParams(model, position, context);
                const result = await provider.provideReferences(params, token);
                return result && this.p2m.asReferences(result);
            }
        };
    }
    registerDocumentHighlightProvider(selector, provider) {
        const documentHighlightProvider = this.createDocumentHighlightProvider(provider);
        return this._monaco.languages.registerDocumentHighlightProvider(selector, documentHighlightProvider);
    }
    createDocumentHighlightProvider(provider) {
        return {
            provideDocumentHighlights: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideDocumentHighlights(params, token);
                return result && this.p2m.asDocumentHighlights(result);
            }
        };
    }
    registerDocumentSymbolProvider(selector, provider) {
        const documentSymbolProvider = this.createDocumentSymbolProvider(provider);
        return this._monaco.languages.registerDocumentSymbolProvider(selector, documentSymbolProvider);
    }
    createDocumentSymbolProvider(provider) {
        return {
            provideDocumentSymbols: async (model, token) => {
                const params = this.m2p.asDocumentSymbolParams(model);
                const result = await provider.provideDocumentSymbols(params, token);
                return result && this.p2m.asDocumentSymbols(result);
            }
        };
    }
    registerCodeActionsProvider(selector, provider) {
        const codeActionProvider = this.createCodeActionProvider(provider);
        return this._monaco.languages.registerCodeActionProvider(selector, codeActionProvider);
    }
    createCodeActionProvider(provider) {
        return {
            provideCodeActions: async (model, range, context, token) => {
                const params = this.m2p.asCodeActionParams(model, range, context);
                let result = await provider.provideCodeActions(params, token);
                return result && this.p2m.asCodeActionList(result);
            },
            resolveCodeAction: provider.resolveCodeAction ? async (codeAction, token) => {
                const params = this.m2p.asCodeAction(codeAction);
                const result = await provider.resolveCodeAction(params, token);
                if (result) {
                    const resolvedCodeAction = this.p2m.asCodeAction(result);
                    Object.assign(codeAction, resolvedCodeAction);
                }
                return codeAction;
            } : undefined
        };
    }
    registerCodeLensProvider(selector, provider) {
        const codeLensProvider = this.createCodeLensProvider(provider);
        return this._monaco.languages.registerCodeLensProvider(selector, codeLensProvider);
    }
    createCodeLensProvider(provider) {
        return {
            provideCodeLenses: async (model, token) => {
                const params = this.m2p.asCodeLensParams(model);
                const result = await provider.provideCodeLenses(params, token);
                return result && this.p2m.asCodeLensList(result);
            },
            resolveCodeLens: provider.resolveCodeLens ? async (model, codeLens, token) => {
                const protocolCodeLens = this.m2p.asCodeLens(codeLens);
                const result = await provider.resolveCodeLens(protocolCodeLens, token);
                if (result) {
                    const resolvedCodeLens = this.p2m.asCodeLens(result);
                    Object.assign(codeLens, resolvedCodeLens);
                }
                return codeLens;
            } : undefined
        };
    }
    registerDocumentFormattingEditProvider(selector, provider) {
        const documentFormattingEditProvider = this.createDocumentFormattingEditProvider(provider);
        return this._monaco.languages.registerDocumentFormattingEditProvider(selector, documentFormattingEditProvider);
    }
    createDocumentFormattingEditProvider(provider) {
        return {
            provideDocumentFormattingEdits: async (model, options, token) => {
                const params = this.m2p.asDocumentFormattingParams(model, options);
                const result = await provider.provideDocumentFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        };
    }
    registerDocumentRangeFormattingEditProvider(selector, provider) {
        const documentRangeFormattingEditProvider = this.createDocumentRangeFormattingEditProvider(provider);
        return this._monaco.languages.registerDocumentRangeFormattingEditProvider(selector, documentRangeFormattingEditProvider);
    }
    createDocumentRangeFormattingEditProvider(provider) {
        return {
            provideDocumentRangeFormattingEdits: async (model, range, options, token) => {
                const params = this.m2p.asDocumentRangeFormattingParams(model, range, options);
                const result = await provider.provideDocumentRangeFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        };
    }
    registerOnTypeFormattingEditProvider(selector, provider, firstTriggerCharacter, ...moreTriggerCharacter) {
        const onTypeFormattingEditProvider = this.createOnTypeFormattingEditProvider(provider, firstTriggerCharacter, ...moreTriggerCharacter);
        return this._monaco.languages.registerOnTypeFormattingEditProvider(selector, onTypeFormattingEditProvider);
    }
    createOnTypeFormattingEditProvider(provider, firstTriggerCharacter, ...moreTriggerCharacter) {
        const autoFormatTriggerCharacters = [firstTriggerCharacter].concat(moreTriggerCharacter);
        return {
            autoFormatTriggerCharacters,
            provideOnTypeFormattingEdits: async (model, position, ch, options, token) => {
                const params = this.m2p.asDocumentOnTypeFormattingParams(model, position, ch, options);
                const result = await provider.provideOnTypeFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        };
    }
    registerRenameProvider(selector, provider) {
        const renameProvider = this.createRenameProvider(provider);
        return this._monaco.languages.registerRenameProvider(selector, renameProvider);
    }
    createRenameProvider(provider) {
        return {
            provideRenameEdits: async (model, position, newName, token) => {
                const params = this.m2p.asRenameParams(model, position, newName);
                const result = await provider.provideRenameEdits(params, token);
                return result && this.p2m.asWorkspaceEdit(result);
            }
        };
    }
    registerDocumentLinkProvider(selector, provider) {
        const linkProvider = this.createDocumentLinkProvider(provider);
        return this._monaco.languages.registerLinkProvider(selector, linkProvider);
    }
    createDocumentLinkProvider(provider) {
        return {
            provideLinks: async (model, token) => {
                const params = this.m2p.asDocumentLinkParams(model);
                const result = await provider.provideDocumentLinks(params, token);
                return result && this.p2m.asDocumentLinks(result);
            },
            resolveLink: async (link, token) => {
                // resolve the link if the provider supports it
                // and the link doesn't have a url set
                if (provider.resolveDocumentLink && (link.url === null || link.url === undefined)) {
                    const documentLink = this.m2p.asDocumentLink(link);
                    const result = await provider.resolveDocumentLink(documentLink, token);
                    if (result) {
                        const resolvedLink = this.p2m.asDocumentLink(result);
                        Object.assign(link, resolvedLink);
                    }
                }
                return link;
            }
        };
    }
    registerImplementationProvider(selector, provider) {
        const implementationProvider = this.createImplementationProvider(provider);
        return this._monaco.languages.registerImplementationProvider(selector, implementationProvider);
    }
    createImplementationProvider(provider) {
        return {
            provideImplementation: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideImplementation(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        };
    }
    registerTypeDefinitionProvider(selector, provider) {
        const typeDefinitionProvider = this.createTypeDefinitionProvider(provider);
        return this._monaco.languages.registerTypeDefinitionProvider(selector, typeDefinitionProvider);
    }
    createTypeDefinitionProvider(provider) {
        return {
            provideTypeDefinition: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideTypeDefinition(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        };
    }
    registerColorProvider(selector, provider) {
        const documentColorProvider = this.createDocumentColorProvider(provider);
        return this._monaco.languages.registerColorProvider(selector, documentColorProvider);
    }
    createDocumentColorProvider(provider) {
        return {
            provideDocumentColors: async (model, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideDocumentColors({ textDocument }, token);
                return result && this.p2m.asColorInformations(result);
            },
            provideColorPresentations: async (model, info, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const range = this.m2p.asRange(info.range);
                const result = await provider.provideColorPresentations({
                    textDocument,
                    color: info.color,
                    range
                }, token);
                return result && this.p2m.asColorPresentations(result);
            }
        };
    }
    registerFoldingRangeProvider(selector, provider) {
        const foldingRangeProvider = this.createFoldingRangeProvider(provider);
        return this._monaco.languages.registerFoldingRangeProvider(selector, foldingRangeProvider);
    }
    createFoldingRangeProvider(provider) {
        return {
            provideFoldingRanges: async (model, context, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideFoldingRanges({
                    textDocument
                }, token);
                return result && this.p2m.asFoldingRanges(result);
            }
        };
    }
    registerDocumentSemanticTokensProvider(selector, provider, legend) {
        const semanticTokensProvider = this.createSemanticTokensProvider(provider, legend);
        return this._monaco.languages.registerDocumentSemanticTokensProvider(selector, semanticTokensProvider);
    }
    createSemanticTokensProvider(provider, legend) {
        return {
            getLegend() {
                return legend;
            },
            onDidChange: provider.onDidChange,
            provideDocumentSemanticTokens: async (model, lastResultId, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideDocumentSemanticTokens({
                    textDocument
                }, token);
                return result && this.p2m.asSemanticTokens(result);
            },
            releaseDocumentSemanticTokens: (resultId) => {
            }
        };
    }
    registerDocumentRangeSemanticTokensProvider(selector, provider, legend) {
        const rangeSemanticTokensProvider = this.createRangeSemanticTokensProvider(provider, legend);
        return this._monaco.languages.registerDocumentRangeSemanticTokensProvider(selector, rangeSemanticTokensProvider);
    }
    createRangeSemanticTokensProvider(provider, legend) {
        return {
            getLegend() {
                return legend;
            },
            provideDocumentRangeSemanticTokens: async (model, range, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideDocumentRangeSemanticTokens({
                    textDocument,
                    range: this.m2p.asRange(range)
                }, token);
                return result && this.p2m.asSemanticTokens(result);
            }
        };
    }
    matchModel(selector, model) {
        if (Array.isArray(selector)) {
            return selector.some(filter => this.matchModel(filter, model));
        }
        if (services_1.DocumentFilter.is(selector)) {
            if (!!selector.language && selector.language !== model.languageId) {
                return false;
            }
            if (!!selector.scheme && selector.scheme !== model.uri.scheme) {
                return false;
            }
            if (!!selector.pattern && !testGlob(selector.pattern, model.uri.path)) {
                return false;
            }
            return true;
        }
        return selector === model.languageId;
    }
}
exports.MonacoLanguages = MonacoLanguages;
//# sourceMappingURL=monaco-languages.js.map