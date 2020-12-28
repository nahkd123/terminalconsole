import { TerminalConsole } from ".";

let con = new TerminalConsole([
    "history thing",
    "you can decide",
    "how much you",
    "want"
]);
con.on("line", line => {
    con.warn(line);
});

setInterval(() => {
    const random = Math.floor(Math.random() * 6);
    switch (random) {
    case 0: con.log("Log!"); break;
    case 1: con.info("Info here"); break;
    case 2: con.warn("A warning!"); break;
    case 3: con.error("An error!"); break;
    case 4: con.accept("Accepted!"); break;
    case 5: con.reject("Rejected!"); break;
    default: break;
    }
}, 5000);

con.info("Type something...");