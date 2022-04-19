import { Message, RequestType, RequestType0, RequestHandler, RequestHandler0, GenericRequestHandler, NotificationType, NotificationType0, NotificationHandler, NotificationHandler0, GenericNotificationHandler, Trace, Tracer, CancellationToken, MessageConnection, MessageSignature, Disposable, ProgressType } from 'vscode-jsonrpc';
import { InitializeParams, InitializeResult, LogMessageParams, ShowMessageParams, DidChangeConfigurationParams, DidOpenTextDocumentParams, DidChangeTextDocumentParams, DidCloseTextDocumentParams, DidSaveTextDocumentParams, DidChangeWatchedFilesParams, PublishDiagnosticsParams } from 'vscode-languageserver-protocol';
import { OutputChannel } from "./services";
export interface IConnection {
    listen(): void;
    sendRequest<R, E>(type: RequestType0<R, E>, token?: CancellationToken): Thenable<R>;
    sendRequest<P, R, E>(type: RequestType<P, R, E>, params: P, token?: CancellationToken): Thenable<R>;
    sendRequest<R>(method: string, token?: CancellationToken): Thenable<R>;
    sendRequest<R>(method: string, param: any, token?: CancellationToken): Thenable<R>;
    sendRequest<R>(type: string | MessageSignature, ...params: any[]): Thenable<R>;
    onRequest<R, E>(type: RequestType0<R, E>, handler: RequestHandler0<R, E>): Disposable;
    onRequest<P, R, E>(type: RequestType<P, R, E>, handler: RequestHandler<P, R, E>): Disposable;
    onRequest<R, E>(method: string, handler: GenericRequestHandler<R, E>): Disposable;
    onRequest<R, E>(method: string | MessageSignature, handler: GenericRequestHandler<R, E>): Disposable;
    sendNotification(type: NotificationType0): Thenable<void>;
    sendNotification<P>(type: NotificationType<P>, params?: P): Thenable<void>;
    sendNotification(method: string): Thenable<void>;
    sendNotification(method: string, params: any): Thenable<void>;
    sendNotification(method: string | MessageSignature, params?: any): Thenable<void>;
    onNotification(type: NotificationType0, handler: NotificationHandler0): Disposable;
    onNotification<P>(type: NotificationType<P>, handler: NotificationHandler<P>): Disposable;
    onNotification(method: string, handler: GenericNotificationHandler): Disposable;
    onNotification(method: string | MessageSignature, handler: GenericNotificationHandler): Disposable;
    onProgress<P>(type: ProgressType<P>, token: string | number, handler: NotificationHandler<P>): Disposable;
    sendProgress<P>(type: ProgressType<P>, token: string | number, value: P): Thenable<void>;
    trace(value: Trace, tracer: Tracer, sendNotification?: boolean): void;
    initialize(params: InitializeParams): Thenable<InitializeResult>;
    shutdown(): Thenable<void>;
    exit(): Thenable<void>;
    onLogMessage(handle: NotificationHandler<LogMessageParams>): void;
    onShowMessage(handler: NotificationHandler<ShowMessageParams>): void;
    onTelemetry(handler: NotificationHandler<any>): void;
    didChangeConfiguration(params: DidChangeConfigurationParams): Thenable<void>;
    didChangeWatchedFiles(params: DidChangeWatchedFilesParams): Thenable<void>;
    didOpenTextDocument(params: DidOpenTextDocumentParams): Thenable<void>;
    didChangeTextDocument(params: DidChangeTextDocumentParams): Thenable<void>;
    didCloseTextDocument(params: DidCloseTextDocumentParams): Thenable<void>;
    didSaveTextDocument(params: DidSaveTextDocumentParams): Thenable<void>;
    onDiagnostics(handler: NotificationHandler<PublishDiagnosticsParams>): void;
    end(): void;
    dispose(): void;
}
export interface ConnectionErrorHandler {
    (error: Error, message: Message | undefined, count: number | undefined): void;
}
export interface ConnectionCloseHandler {
    (): void;
}
export interface IConnectionProvider {
    get(errorHandler: ConnectionErrorHandler, closeHandler: ConnectionCloseHandler, outputChannel: OutputChannel | undefined): Thenable<IConnection>;
}
export declare function createConnection(connection: MessageConnection, errorHandler: ConnectionErrorHandler, closeHandler: ConnectionCloseHandler): IConnection;
//# sourceMappingURL=connection.d.ts.map