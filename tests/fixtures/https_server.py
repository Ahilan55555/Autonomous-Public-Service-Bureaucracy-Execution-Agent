import http.server
import ssl

server = http.server.HTTPServer(
    ("127.0.0.1", 8000),
    http.server.SimpleHTTPRequestHandler
)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)

context.load_cert_chain(
    "tests/fixtures/certs/cert.pem",
    "tests/fixtures/certs/key.pem"
)

server.socket = context.wrap_socket(
    server.socket,
    server_side=True
)

print("Local HTTPS server running at https://localhost:8000")

server.serve_forever()