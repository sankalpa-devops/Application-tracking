import sys
import types


def install_ssl_shim():
    if "ssl" in sys.modules:
        return

    ssl = types.ModuleType("ssl")
    ssl.PROTOCOL_TLS_SERVER = 17
    ssl.CERT_NONE = 0
    ssl.CERT_OPTIONAL = 1
    ssl.CERT_REQUIRED = 2
    ssl.VerifyMode = int
    ssl.SSLWantReadError = OSError
    ssl.SSLSyscallError = OSError
    ssl.SSLError = OSError
    ssl.MemoryBIO = object
    ssl.SSLObject = object

    class SSLContext:
        def __init__(self, *args, **kwargs):
            self.verify_mode = ssl.CERT_NONE

        def load_cert_chain(self, *args, **kwargs):
            return None

        def load_verify_locations(self, *args, **kwargs):
            return None

        def set_ciphers(self, *args, **kwargs):
            return None

    ssl.SSLContext = SSLContext
    sys.modules["ssl"] = ssl


install_ssl_shim()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
