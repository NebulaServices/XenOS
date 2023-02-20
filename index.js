const express = require("express");
const webpack = require("webpack");
const path = require("path");
const request = require("request");

console.log("Welcome to XenOS Server");

try {
  var Bundle = webpack(
    {
      mode: "development",
      entry: path.join(__dirname, "public/rsc/js/entry.ts"),
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
        filename: "web.bundle.js",
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
      mode: "production",
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

const app = express();

app.use((req, res, next) => {
  res.append("Service-Worker-Allowed", "/");

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

app.listen(3000, () => {
  console.log("server started");
});
