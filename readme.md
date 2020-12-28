# ![terminalconsole](./artwork.png)
## Demo
[![asciicast](https://asciinema.org/a/XuUGU5yCUCMmGhSc2K6PQ6qGw.svg)](https://asciinema.org/a/XuUGU5yCUCMmGhSc2K6PQ6qGw)
## Install
```console
$ npm i @nahkd123/terminalconsole
```

## Usage
```ts
let { TerminalConsole } = require("@nahkd123/terminalconsole");

let con = new TerminalConsole();
con.on("line", line => {
    doSomething(line);
});
```

## Build
```console
$ npm run build

> terminalconsole@0.0.1 build /terminalconsole
> tsc -b

```