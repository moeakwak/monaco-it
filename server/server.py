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


class FileRequestHandler(web.RequestHandler):
    workspace_dir_path = None

    def initialize(self, workspace_dir_path) -> None:
        self.workspace_dir_path = workspace_dir_path

    def prepare(self):
        if self.request.headers['Content-Type'] == 'application/json':
            self.args = json.loads(self.request.body)
        else:
            self.set_status(400)
            self.finish("must be JSON request")

    def get(self):
        # return workspace_dir_path absolute path
        self.write({
            'workspace_dir_path': workspace_dir_path
        })

    def post(self):
        if self.args['type'] != "update":
            self.set_status(400)
            self.finish("unsupported type " + self.args['type'])
        else:
            if not 'filename' in self.args or not 'code' in self.args:
                self.set_status(400)
                self.finish("missing filename or code")
            filename = self.args['filename']
            code = self.args['code']
            with open(os.path.join(workspace_dir_path, filename), 'w') as f:
                f.write(code)
            log.info("update file {} with {} characters".format(filename, len(code)))
            self.finish()

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
        proc = process.Subprocess(self.commands[self.lang], stdin=subprocess.PIPE, stdout=subprocess.PIPE)

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
        # print(message)  # non-ascii characters cannot be printed, thus cause infinite exception & re-starting
        self.writer.write(json.loads(message))

    def check_origin(self, origin):
        return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-c", "--config", type=str, default="config.yaml")
    args = parser.parse_args()

    if not os.path.isfile(args.config):
        print("config file {} not exits!".format(args.config))
        exit(1)

    workspace_dir_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cpp_workspace")
    if not os.path.exists(workspace_dir_path):
        os.makedirs(workspace_dir_path)

    config = None
    with open(args.config, 'r') as f:
        config = yaml.safe_load(f)

    app = web.Application([
        (r"/", HomeRequestHandler),
        (r"/file", FileRequestHandler, dict(workspace_dir_path=workspace_dir_path)),
        (r"/(.*)", LanguageServerWebSocketHandler, dict(commands=config['commands']))
    ])

    print("Started Web Socket at ws://{}:{}/<lang>".format(config['host'], config['port']))
    print("supported languages: ", " ".join(config['commands'].keys()))
    app.listen(config['port'], address=config['host'])
    ioloop.IOLoop.current().start()
