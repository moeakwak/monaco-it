import logging
import os.path
import subprocess
import threading
import argparse
import yaml

from tornado import ioloop, process, web, websocket, httputil

from pylsp_jsonrpc import streams

try:
    import ujson as json
except Exception:  # pylint: disable=broad-except
    import json

log = logging.getLogger(__name__)


class HomeRequestHandler(web.RequestHandler):
    commands = None

    def initialize(self, commands) -> None:
        self.commands = commands

    def get(self):
        self.write("""
        <h1>Language Server</h1>
        <h2>Support Languages</h2>
        {}
        <h2>Usage</h2>
        Use WebSocket connect ws://localhost/<language_name>, e.g. ws://localhost/python .
        """.format("".join(
            ["<p>{}</p>".format(lang) for lang in self.commands.keys()]
        )))


class FileServerWebSocketHandler(websocket.WebSocketHandler):
    workspace_dir_path = None

    def initialize(self, workspace_dir_path) -> None:
        self.workspace_dir_path = workspace_dir_path

    def open(self, *args, **kwargs):
        log.info("new FileServerWebSocketHandler request")

    def on_message(self, message):
        message = json.loads(message)
        if message['type'] == 'get_workspace_dir_path':
            self.write_message(json.dumps({'result': 'ok', 'data': workspace_dir_path}))
        elif message['type'] == 'update':
            if 'filename' not in message or 'code' not in message:
                self.write_message(json.dumps({'result': 'error', 'description': 'no filename or code'}))
            else:
                filename = message['filename']
                code = message['code']
                with open(os.path.join(workspace_dir_path, filename), 'w') as f:
                    f.write(code)
                log.info("update file {} with {} characters".format(filename, len(code)))
                self.write_message(json.dumps({'result': 'ok'}))
        else:
            self.write_message(json.dumps({'result': 'error', 'description': 'no such type'}))

    def check_origin(self, origin):
        return True


class LanguageServerWebSocketHandler(websocket.WebSocketHandler):
    writer = None
    lang = None
    commands = None

    def initialize(self, commands) -> None:
        self.commands = commands

    def open(self, *args, **kwargs):
        if args[0] not in self.commands:
            self.close(1001, "language {} is not supported".format((args[0])))
            return

        self.lang = args[0]
        log.info("Spawning {} subprocess".format(self.lang))

        # Create an instance of the language server
        proc = process.Subprocess(
            self.commands[self.lang], stdin=subprocess.PIPE, stdout=subprocess.PIPE)

        # Create a writer that formats json messages with the correct LSP headers
        self.writer = streams.JsonRpcStreamWriter(proc.stdin)

        # Create a reader for consuming stdout of the language server. We need to
        # consume this in another thread
        def consume():
            # Start a tornado IOLoop for reading/writing to the process in this thread
            ioloop.IOLoop()
            reader = streams.JsonRpcStreamReader(proc.stdout)
            reader.listen(lambda msg: self.write_message(json.dumps(msg)))

        thread = threading.Thread(target=consume)
        thread.daemon = True
        thread.start()

    def on_message(self, message):
        """Forward client->server messages to the endpoint."""
        temp = json.loads(message)
        print(temp)
        self.writer.write(temp)

    def check_origin(self, origin):
        return True


if __name__ == "__main__":
    welcome = "WebSocket Language Server For Monaco Editor"
    print("*" * (len(welcome)) + "\n" + welcome + "\n" + "*" * (len(welcome)))
    parser = argparse.ArgumentParser()
    parser.add_argument("-c", "--config", type=str,
                        default="config.yaml", help="yaml configuration")
    args = parser.parse_args()

    config_path = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), args.config)

    if not os.path.isfile(config_path):
        log.error("config file {} not exits!".format(config_path))
        exit(1)

    config = None
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    workspace_dir_path = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "cpp_workspace")
    if not os.path.exists(workspace_dir_path):
        os.makedirs(workspace_dir_path)

    print("use config: {}\ncurrent workspace_dir_path: {}\n".format(config_path, workspace_dir_path))

    app = web.Application([
        (r"/", HomeRequestHandler, dict(commands=config['commands'])),
        (r"/file", FileServerWebSocketHandler, dict(workspace_dir_path=workspace_dir_path)),
        (r"/(.*)", LanguageServerWebSocketHandler,
         dict(commands=config['commands']))
    ])
    print("all commands:\n" + "\n".join(
        ["  - {}: {}".format(lang, " ".join(config['commands'][lang]))
         for lang in config['commands'].keys()]
    ))
    print("\nStarted Web Socket at:\n" + "\n".join(
        ["  - {}: ws://{}:{}/{}".format(lang, config['host'],
                                        config['port'], lang) for lang in config['commands'].keys()])
          )
    app.listen(config['port'], address=config['host'])
    ioloop.IOLoop.current().start()
