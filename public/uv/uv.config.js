self.__uv$config = {
  prefix: "/proxy/",
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: "/libs/uv/uv.handler.js",
  client: "/libs/uv/uv.client.js",
  bundle: "/libs/uv/uv.bundle.js",
  config: "/uv/uv.config.js",
  sw: "/libs/uv/uv.sw.js",
};