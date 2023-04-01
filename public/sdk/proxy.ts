const endpoint = "/fetch/";

export default new Proxy(fetch, {
  apply(target, that, args) {
    // WHATEVER the endpoint is
    [url] = args;

    args[0] = endpoint + url;

    return Reflect.apply(...arguments);
  },
});
