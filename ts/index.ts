import { EventEmitter } from "events";
import * as readline from "readline";

function hideCursor() {process.stdout.write("\x1b[?25l");}
function showCursor() {process.stdout.write("\x1b[?25h");}

export interface TerminalConsole {
    on(event: "line", listener: (line: string) => void);
    emit(event: "line", line: string);
}
export class TerminalConsole extends EventEmitter {
    private _input = "";
    private _inputPos = 0;
    get input() {return this._input;}
    set input(v: string) {
        this._input = v;
        this.updateInput();
    }

    private historyPointer = -1;

    constructor(
        public history: string[] = [],
        public historyMax = 10
    ) {
        super();

        process.stdin.setRawMode(true);
        readline.emitKeypressEvents(process.stdin);
        process.stdin.on("keypress", (seq: string, key: {
            sequence: string,
            name: string,
            ctrl: boolean, meta: boolean, shift: boolean
        }) => {
            // Pre
            if (key.name === "c" && key.ctrl) process.exit();

            if (key.name === "return") {
                let text = this.historyPointer === -1? this._input : this.history[this.historyPointer];
                this.emit("line", text);
                this._input = "";
                this._inputPos = 0;
                this.historyPointer = -1;

                this.history.unshift(text);
                if (this.history.length > this.historyMax) this.history.pop();
            } else if (key.name === "left") {
                if (this.historyPointer !== -1) {
                    this._input = this.history[this.historyPointer];
                    this._inputPos = this._input.length - 1;
                    this.historyPointer = -1;
                } else this._inputPos--;
            } else if (key.name === "right") {
                if (this.historyPointer !== -1) {
                    this._input = this.history[this.historyPointer];
                    this._inputPos = this._input.length;
                    this.historyPointer = -1;
                } else this._inputPos++;
            } else if (key.name === "home") {
                if (this.historyPointer !== -1) {
                    this._input = this.history[this.historyPointer];
                    this._inputPos = 0;
                    this.historyPointer = -1;
                } else this._inputPos = 0;
            } else if (key.name === "end") {
                if (this.historyPointer !== -1) {
                    this._input = this.history[this.historyPointer];
                    this._inputPos = this._input.length;
                    this.historyPointer = -1;
                } else this._inputPos = this._input.length;
            } else if (key.name === "up") {
                if (this.historyPointer < history.length - 1) this.historyPointer++;
            } else if (key.name === "down") {
                if (this.historyPointer > -1) this.historyPointer--;
            } else if (key.name === "backspace") {
                if (this.historyPointer !== -1) {
                    this._input = this.history[this.historyPointer];
                    this._inputPos = this._input.length;
                    this.historyPointer = -1;
                }
                this._input = this._input.substr(0, this._inputPos - 1) + this._input.substr(this._inputPos);
                this._inputPos--;
            } else {
                if (this.historyPointer !== -1) {
                    this._input = this.history[this.historyPointer];
                    this._inputPos = this._input.length;
                    this.historyPointer = -1;
                }
                this._input = this._input.substr(0, this._inputPos) + seq + this._input.substr(this._inputPos);
                this._inputPos++;
            }
            this.updateInput();
        });

        process.stdout.write("\n");
        this.forceUpdateInput();
    }

    private queuedActions: TerminalConsoleAction[] = [];
    private queueAction(action: TerminalConsoleAction) {
        this.queuedActions.push(action);
        this.processAllQueuedActions();
    }
    private processAllQueuedActions() {
        while (this.queuedActions.length > 0) {
            const action = this.queuedActions.shift();
            if (action.type === "log") this.processLogAction(action);
            else if (action.type === "updateinput") this.forceUpdateInput();
        }
    }

    private forceUpdateInput() {
        this._inputPos = Math.max(Math.min(this._inputPos, this._input.length), 0);
        const displayText = this.historyPointer === -1? this._input : this.history[this.historyPointer];
        const displayPointer = this.historyPointer === -1? this._inputPos : this.history[this.historyPointer].length;

        process.stdout.write(
            "\r\x1b[2K\x1b[90m" +
            (this.historyPointer === -1? " > " : (this.historyPointer + 1).toString().padStart(3, "0")) +
            " \x1b[37m" + displayText + "\r\x1b[" + (4 + displayPointer) + "C\x1b[0m"
        );
    }
    private processLogAction(action: TerminalConsoleAction) {
        const prefix = LOG_PREIXES.get(action.logLevel);
        hideCursor();
        process.stdout.write("\r\x1b[2K" + prefix + " " + action.input + "\x1b[0m\n");
        this.forceUpdateInput();
        showCursor();
    }

    //#region Queue
    log(msg: string)    {this.queueAction({type: "log", logLevel: "regular", input: msg});}
    info(msg: string)   {this.queueAction({type: "log", logLevel: "info", input: msg});}
    warn(msg: string)   {this.queueAction({type: "log", logLevel: "warn", input: msg});}
    error(msg: string)  {this.queueAction({type: "log", logLevel: "error", input: msg});}
    accept(msg: string) {this.queueAction({type: "log", logLevel: "accept", input: msg});}
    reject(msg: string) {this.queueAction({type: "log", logLevel: "reject", input: msg});}

    updateInput()       {this.queueAction({type: "updateinput"})}
    //#endregion
}

interface TerminalConsoleAction {
    type: "updateinput" | "log";

    input?: string;
    logLevel?: "regular" | "info" | "warn" | "error" | "accept" | "reject";
}

const LOG_PREIXES = new Map<string, string>([
    ["regular",     "   "],
    ["info",        "\x1b[96m i \x1b[0m"],
    ["warn",        "\x1b[103m\x1b[30m ! \x1b[0;93m"],
    ["error",       "\x1b[101m\x1b[30m E \x1b[0;91m"],

    ["accept",      "\x1b[102m\x1b[30m ✓ \x1b[0;92m"],
    ["reject",      "\x1b[101m\x1b[30m ✗ \x1b[0;91m"]
]);