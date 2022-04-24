const vscodeThemeToMonacoThemeWeb = require("vscode-theme-to-monaco-theme-web");
const path = require("path");
const fs = require("fs");

function readJSON(inputFilePath) {
  let text = fs.readFileSync(path.resolve(__dirname, inputFilePath)).toString();
  return JSON.parse(
    text.replace(/(\/\/").+?[\n\r\t]/g, "").replace(/,[\n\r\t]*\}/, "}")
  );
}

function writeJSON(json, outputFilePath) {
//   fs.ensureFileSync();
  let dir = path.resolve(__dirname);
  fs.writeFileSync(
    path.join(dir, outputFilePath),
    JSON.stringify(json, null, 2)
  );
}

let dark_vs = readJSON("./vscode_themes/dark_vs.json");
let dark_plus = readJSON("./vscode_themes/dark_plus.json");
let light_vs = readJSON("./vscode_themes/light_vs.json");
let light_plus = readJSON("./vscode_themes/light_plus.json");

let dark = dark_vs;
dark.name = dark_plus.name;
dark.tokenColors.push(...dark_plus.tokenColors);

let light = light_vs;
light.name = light_plus.name;
light.tokenColors.push(...light_plus.tokenColors);

writeJSON(vscodeThemeToMonacoThemeWeb.convertTheme(dark), "/dark.json");
writeJSON(vscodeThemeToMonacoThemeWeb.convertTheme(light), "/light.json");
