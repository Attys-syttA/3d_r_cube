import { spawnSync } from "node:child_process";

const commands = [
  ["node", ["scripts/check-encoding.mjs"]],
  ["npm.cmd", ["run", "test"]],
  ["npm.cmd", ["run", "typecheck"]],
  ["npm.cmd", ["run", "build"]],
  ["node", ["scripts/check-inventory.mjs", "--check"]],
  ["git", ["diff", "--check"]]
];

for (const [command, args] of commands) {
  const label = `${command} ${args.join(" ")}`;
  console.log(`> ${label}`);
  const executable = process.platform === "win32" && command.endsWith(".cmd") ? "cmd.exe" : command;
  const executableArgs =
    process.platform === "win32" && command.endsWith(".cmd") ? ["/d", "/s", "/c", command, ...args] : args;
  const result = spawnSync(executable, executableArgs, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("workspace check passed");
