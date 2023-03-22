const express = require("express");
const webpack = require("webpack");
const path = require("path");
const request = require("request");
const http = require("node:http");
const createBareServer = require("@tomphttp/bare-server-node");
const PORT = '3000'

console.log("Welcome to XenOS Server");

try {
  var Bundle = webpack(
    {
      mode: "development",
      entry: {
        web: path.join(__dirname, "public/rsc/js/entry.ts"),
        communicator: path.join(__dirname, "public/rsc/js/inject/index.js"),
      },
      module: {
        rules: [
          {
            test: /\.ts?$/,
            use: "ts-loader",
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: [".ts", ".js"],
      },
      output: {
        path: path.join(__dirname, "public/rsc/web/"),
        filename: "[name].bundle.js",
      },
      experiments: {
        topLevelAwait: true,
      },
      watch: true,
    },
    e => console.log(e || "Completed OS Bundle")
  );

  var SDKBundle = webpack(
    {
      mode: "none",
      entry: path.join(__dirname, "public/sdk/mod.ts"),
      module: {
        rules: [
          {
            test: /\.ts?$/,
            use: "ts-loader",
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: [".ts", ".js"],
      },
      output: {
        path: path.join(__dirname, "public"),
        filename: "sdk.bundle.js",
      },
      experiments: {
        topLevelAwait: true,
      },
      watch: true,
    },
    e => console.log(e || "Completed SDK Bundle")
  );
} catch (e) {
  console.log(e);
}

const server = http.createServer();
const app = express(server);
const bareServer = createBareServer("/bare/");

app.use((req, res, next) => {
  res.append("Service-Worker-Allowed", "/");
  if (req.pathname=='/')res.append("Content-Security-Policy", "default-src 'self' fonts.googleapis.com fonts.gstatic.com; img-src * blob:; script-src 'self' 'sha256-9NsIanf8jSVFuiPetrZ1jfLPoMPzZuPz2w3GWvQFgIU=' 'sha256-inline' 'unsafe-eval' 'unsafe-hashes'; font-src 'self' fonts.gstatic.com fonts.googleapis.com data: *.slant.co; style-src-elem fonts.googleapis.com fonts.gstatic.com 'self' 'sha256-tdxd90rTdR0f9tIdFGpIqKd/7yyeTMO/vWN8Fu6/q40=' 'sha256-pg+aUJQeX3r3dfj4esilAvVsVMvh+iTCagyckScaD7M=' 'sha256-pNuvqlsmWwHO/+G71KM8gYFRp51DP92YGba0uGQLwNE='; style-src 'unsafe-inline' fonts.gstatic.com fonts.googleapis.com; connect-src 'self' xenos-app-repository.enderkingj.repl.co xen-analytics.enderkingj.repl.co fonts.googleapis.com fonts.gstatic.com google.com; frame-src *");



  next();
});

app.use(express.static("public"));

// media tunnel :beg:
// This will be removed soon
app.get("/sw", (req, res) => {
  res.set("content-type", "application/javascript");

  const url = req.query.proxy;

  request(url).pipe(res);
});

app.get("/ip", (req, res) => {
  return res.send(req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress);
});

app.get("/media", (req, res) => {
  const imageUrl = req.query.imageUrl;

  request(imageUrl).pipe(res);
});

server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.on("listening", () => {
  console.log(`Server running at http://localhost:${PORT}/.`);
});

server.listen({
  port: PORT
});
