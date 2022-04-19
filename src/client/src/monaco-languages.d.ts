import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Languages, DiagnosticCollection, CompletionItemProvider, DocumentIdentifier, HoverProvider, SignatureHelpProvider, DefinitionProvider, ReferenceProvider, DocumentHighlightProvider, DocumentSymbolProvider, CodeActionProvider, CodeLensProvider, DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider, OnTypeFormattingEditProvider, RenameProvider, DocumentFilter, DocumentSelector, DocumentLinkProvider, ImplementationProvider, TypeDefinitionProvider, DocumentColorProvider, FoldingRangeProvider, SemanticTokensLegend, DocumentSemanticTokensProvider, DocumentRangeSemanticTokensProvider } from "./services";
import { ProtocolToMonacoConverter, MonacoToProtocolConverter } from './monaco-converter';
import { Disposable } from './disposable';
export interface MonacoModelIdentifier {
    uri: monaco.Uri;
    languageId: string;
}
export declare namespace MonacoModelIdentifier {
    function fromDocument(_monaco: typeof monaco, document: DocumentIdentifier): MonacoModelIdentifier;
    function fromModel(model: monaco.editor.IReadOnlyModel): MonacoModelIdentifier;
}
export declare function testGlob(pattern: string, value: string): boolean;
export declare class MonacoLanguages implements Languages {
    protected readonly _monaco: typeof monaco;
    protected readonly p2m: ProtocolToMonacoConverter;
    protected readonly m2p: MonacoToProtocolConverter;
    constructor(_monaco: typeof monaco, p2m: ProtocolToMonacoConverter, m2p: MonacoToProtocolConverter);
    match(selector: DocumentSelector, document: DocumentIdentifier): boolean;
    createDiagnosticCollection(name?: string): DiagnosticCollection;
    registerCompletionItemProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): Disposable;
    protected createCompletionProvider(provider: CompletionItemProvider, ...triggerCharacters: string[]): monaco.languages.CompletionItemProvider;
    registerHoverProvider(selector: DocumentSelector, provider: HoverProvider): Disposable;
    protected createHoverProvider(provider: HoverProvider): monaco.languages.HoverProvider;
    registerSignatureHelpProvider(selector: DocumentSelector, provider: SignatureHelpProvider, ...triggerCharacters: string[]): Disposable;
    protected createSignatureHelpProvider(provider: SignatureHelpProvider, ...triggerCharacters: string[]): monaco.languages.SignatureHelpProvider;
    registerDefinitionProvider(selector: DocumentSelector, provider: DefinitionProvider): Disposable;
    protected createDefinitionProvider(provider: DefinitionProvider): monaco.languages.DefinitionProvider;
    registerReferenceProvider(selector: DocumentSelector, provider: ReferenceProvider): Disposable;
    protected createReferenceProvider(provider: ReferenceProvider): monaco.languages.ReferenceProvider;
    registerDocumentHighlightProvider(selector: DocumentSelector, provider: DocumentHighlightProvider): Disposable;
    protected createDocumentHighlightProvider(provider: DocumentHighlightProvider): monaco.languages.DocumentHighlightProvider;
    registerDocumentSymbolProvider(selector: DocumentSelector, provider: DocumentSymbolProvider): Disposable;
    protected createDocumentSymbolProvider(provider: DocumentSymbolProvider): monaco.languages.DocumentSymbolProvider;
    registerCodeActionsProvider(selector: DocumentSelector, provider: CodeActionProvider): Disposable;
    protected createCodeActionProvider(provider: CodeActionProvider): monaco.languages.CodeActionProvider;
    registerCodeLensProvider(selector: DocumentSelector, provider: CodeLensProvider): Disposable;
    protected createCodeLensProvider(provider: CodeLensProvider): monaco.languages.CodeLensProvider;
    registerDocumentFormattingEditProvider(selector: DocumentSelector, provider: DocumentFormattingEditProvider): Disposable;
    protected createDocumentFormattingEditProvider(provider: DocumentFormattingEditProvider): monaco.languages.DocumentFormattingEditProvider;
    registerDocumentRangeFormattingEditProvider(selector: DocumentSelector, provider: DocumentRangeFormattingEditProvider): Disposable;
    createDocumentRangeFormattingEditProvider(provider: DocumentRangeFormattingEditProvider): monaco.languages.DocumentRangeFormattingEditProvider;
    registerOnTypeFormattingEditProvider(selector: DocumentSelector, provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): Disposable;
    protected createOnTypeFormattingEditProvider(provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): monaco.languages.OnTypeFormattingEditProvider;
    registerRenameProvider(selector: DocumentSelector, provider: RenameProvider): Disposable;
    protected createRenameProvider(provider: RenameProvider): monaco.languages.RenameProvider;
    registerDocumentLinkProvider(selector: DocumentSelector, provider: DocumentLinkProvider): Disposable;
    protected createDocumentLinkProvider(provider: DocumentLinkProvider): monaco.languages.LinkProvider;
    registerImplementationProvider(selector: DocumentSelector, provider: ImplementationProvider): Disposable;
    protected createImplementationProvider(provider: ImplementationProvider): monaco.languages.ImplementationProvider;
    registerTypeDefinitionProvider(selector: DocumentSelector, provider: TypeDefinitionProvider): Disposable;
    protected createTypeDefinitionProvider(provider: TypeDefinitionProvider): monaco.languages.TypeDefinitionProvider;
    registerColorProvider(selector: DocumentSelector, provider: DocumentColorProvider): Disposable;
    protected createDocumentColorProvider(provider: DocumentColorProvider): monaco.languages.DocumentColorProvider;
    registerFoldingRangeProvider(selector: DocumentSelector, provider: FoldingRangeProvider): Disposable;
    protected createFoldingRangeProvider(provider: FoldingRangeProvider): monaco.languages.FoldingRangeProvider;
    registerDocumentSemanticTokensProvider(selector: DocumentSelector, provider: DocumentSemanticTokensProvider, legend: SemanticTokensLegend): Disposable;
    protected createSemanticTokensProvider(provider: DocumentSemanticTokensProvider, legend: SemanticTokensLegend): monaco.languages.DocumentSemanticTokensProvider;
    registerDocumentRangeSemanticTokensProvider(selector: DocumentSelector, provider: DocumentRangeSemanticTokensProvider, legend: SemanticTokensLegend): Disposable;
    protected createRangeSemanticTokensProvider(provider: DocumentRangeSemanticTokensProvider, legend: SemanticTokensLegend): monaco.languages.DocumentRangeSemanticTokensProvider;
    protected matchModel(selector: string | DocumentFilter | DocumentSelector, model: MonacoModelIdentifier): boolean;
}
//# sourceMappingURL=monaco-languages.d.ts.map