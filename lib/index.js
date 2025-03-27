"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runtime_1 = require("@ale-run/runtime");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const logger = runtime_1.Logger.getLogger('plugin:apps');
const find = (directory, files) => {
    files = files || [];
    const lsfiles = fs_1.default.readdirSync(directory);
    for (const file of lsfiles) {
        const absolute = path_1.default.resolve(directory, file);
        if (fs_1.default.statSync(absolute).isDirectory()) {
            find(absolute, files);
        }
        else {
            files.push(absolute);
        }
    }
    return files;
};
class AleApps extends runtime_1.Plugin {
    install() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(ansi_colors_1.default.green.bold(`plugin ${this.name} is installed`), this.options);
        });
    }
    uninstall() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(ansi_colors_1.default.red.bold(`plugin ${this.name} is uninstalled`));
        });
    }
    activate() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(ansi_colors_1.default.blue.bold(`plugin ${this.name} is activate`), this.options);
            const catalog = yield this.context.getCatalog();
            // regist apps
            const appdirs = path_1.default.join(__dirname, 'apps');
            const appfiles = find(appdirs).filter((filepath) => filepath.endsWith('.app.yaml') || filepath.endsWith('.app.yml'));
            for (const filepath of appfiles) {
                yield catalog.regist(path_1.default.dirname(filepath));
            }
            // regist presets
            const presetdirs = path_1.default.join(__dirname, 'apps');
            const presetfiles = find(presetdirs).filter((filepath) => filepath.endsWith('.preset.yaml') || filepath.endsWith('.preset.yml'));
            for (const filepath of presetfiles) {
                yield catalog.registPreset(path_1.default.dirname(filepath));
            }
        });
    }
    deactivate() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(ansi_colors_1.default.red(`plugin ${this.name} is deactivate`));
        });
    }
}
exports.default = AleApps;
//# sourceMappingURL=index.js.map