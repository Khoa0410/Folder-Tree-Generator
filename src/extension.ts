import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Danh sách mặc định các folder/file cần bỏ qua
const DEFAULT_IGNORE_PATTERNS = [
  "node_modules",
  ".vscode",
  "out",
  "build",
  "dist",
  ".git",
  ".DS_Store",
  "Thumbs.db",
  "*.log",
];

/**
 * Đọc file .gitignore và kết hợp với patterns mặc định
 */
function getIgnorePatterns(rootPath: string): string[] {
  const gitignorePath = path.join(rootPath, ".gitignore");

  // Bắt đầu với patterns mặc định
  const patterns = [...DEFAULT_IGNORE_PATTERNS];

  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, "utf8");
      const gitignorePatterns = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#")); // Bỏ comment và dòng trống

      // Thêm các patterns từ .gitignore vào danh sách
      patterns.push(...gitignorePatterns);
    } catch (error) {
      console.error("Error reading .gitignore:", error);
    }
  }

  // Loại bỏ các patterns trùng lặp
  return [...new Set(patterns)];
}

/**
 * Kiểm tra xem tên file/folder có khớp với pattern không
 */
function shouldIgnore(name: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Xử lý pattern đơn giản
    if (pattern.endsWith("/")) {
      // Pattern cho folder
      return name === pattern.slice(0, -1);
    } else if (pattern.startsWith("*.")) {
      // Pattern cho extension
      return name.endsWith(pattern.slice(1));
    } else if (pattern.includes("*")) {
      // Chuyển wildcard thành regex
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return regex.test(name);
    } else {
      // So sánh trực tiếp
      return name === pattern;
    }
  });
}

function buildTree(
  dirPath: string,
  prefix: string = "",
  ignorePatterns: string[] = []
): string {
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (error) {
    return `${prefix}[Error reading directory]\n`;
  }

  // Lọc bỏ các file/folder cần ignore
  const filteredEntries = entries.filter(
    (entry) => !shouldIgnore(entry.name, ignorePatterns)
  );

  const lines = filteredEntries.map((entry, index) => {
    const connector = index === filteredEntries.length - 1 ? "└── " : "├── ";
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return (
        `${prefix}${connector}${entry.name}\n` +
        buildTree(
          fullPath,
          prefix + (index === filteredEntries.length - 1 ? "    " : "│   "),
          ignorePatterns
        )
      );
    } else {
      return `${prefix}${connector}${entry.name}\n`;
    }
  });

  return lines.join("");
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Folder Tree Generator extension is now active");

  let disposable = vscode.commands.registerCommand(
    "folderTree.generate",
    async (uri: vscode.Uri) => {
      try {
        if (!uri) {
          vscode.window.showErrorMessage("No folder selected!");
          return;
        }

        const selectedFolder = uri.fsPath;
        const outputFile = path.join(selectedFolder, "tree.txt");

        // Lấy danh sách patterns (mặc định + .gitignore)
        const ignorePatterns = getIgnorePatterns(selectedFolder);
        const hasGitignore = fs.existsSync(
          path.join(selectedFolder, ".gitignore")
        );

        vscode.window.showInformationMessage(
          hasGitignore
            ? `Using default patterns + .gitignore (${ignorePatterns.length} rules)`
            : `Using default ignore patterns (${ignorePatterns.length} rules)`
        );

        const folderName = selectedFolder.split(path.sep).pop();
        const treeString = `${folderName}\n${buildTree(
          selectedFolder,
          "",
          ignorePatterns
        )}`;

        fs.writeFileSync(outputFile, treeString, "utf8");

        vscode.window.showInformationMessage(
          "tree.txt generated successfully!"
        );

        const doc = await vscode.workspace.openTextDocument(outputFile);
        await vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(`Error generating tree: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
