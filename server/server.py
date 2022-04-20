import logging
import subprocess
import threading
import argparse

from tornado import ioloop, process, web, websocket, httputil

from pylsp_jsonrpc import streams

try:
    import ujson as json
except Exception:  # pylint: disable=broad-except
    import json

log = logging.getLogger(__name__)

commands = {
    "python": ["pyls", "-v"],
    "cpp": []
}

class HomeRequestHandler(web.RequestHandler):
    def get(self):
        self.write("""
        <h1>Language Server</h1>
        <h2>Support Languages</h2>
        {}
        <h2>Usage</h2>
        Use WebSocket connect ws://localhost/<language_name>, e.g. ws://localhost/python .
        """.format("".join(
            ["<p>{}</p>".format(lang) for lang in commands.keys()]
        )))

class LanguageServerWebSocketHandler(websocket.WebSocketHandler):
    writer = None
    lang = None

    def open(self, *args, **kwargs):
        if args[0] not in commands:
            self.close(1001, "language {} is not supported".format((args[0])))
            return

        self.lang = args[0]
        log.info("Spawning {} subprocess".format(self.lang))

        # Create an instance of the language server
        proc = process.Subprocess(commands[self.lang], stdin=subprocess.PIPE, stdout=subprocess.PIPE)

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
    parser.add_argument("--host", type=str, default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()
    app = web.Application([
        (r"/", HomeRequestHandler),
        (r"/(.*)", LanguageServerWebSocketHandler)
    ])
    print("Started Web Socket at ws://{}:{}/<lang>".format(args.host, args.port))
    print("supported languages: ", " ".join(commands.keys()))
    app.listen(args.port, address=args.host)
    ioloop.IOLoop.current().start()
