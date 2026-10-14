import { spawn } from "node:child_process";

const child = spawn("npm", ["run", "quality"], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
const capture = (stream, destination) => stream.on("data", chunk => {
  destination.write(chunk);
  output = (output + chunk.toString()).slice(-200000);
});
capture(child.stdout, process.stdout);
capture(child.stderr, process.stderr);
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("close", code => {
  process.exitCode = code ?? 1;
  if (process.exitCode === 0 || process.env.GITHUB_ACTIONS !== "true") return;
  const failures = output.lastIndexOf("failing tests:");
  const diagnostic = (failures >= 0 ? output.slice(failures) : output.slice(-6000)).slice(0, 6000);
  const escaped = diagnostic.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
  console.log(`::error title=Quality check failed::${escaped}`);
});
