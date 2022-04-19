export const supportedLanguages = ["python", "cpp"];

export function registerLanguages(monaco, lang) {
  monaco.languages.register({
    id: "python",
    extensions: [".python", ".py", ".pyd"],
    aliases: ["Python", "python"],
    mimetypes: ["application/json"],
  });

  monaco.languages.register({
    id: "cpp",
    extensions: [".cpp", ".c", ".hpp", ".h"],
    aliases: ["c++", "C++", "Cpp", "c", "C"],
    mimetypes: ["application/json"],
  });

  monaco.languages.register({
    id: "golang",
    extensions: [".go"],
    aliases: ["go", "golang"],
    mimetypes: ["application/json"],
  });
}
