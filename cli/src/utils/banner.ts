import pc from "picocolors";

const SOFTCLIP_ART = [
  "███████╗ ██████╗ ███████╗████████╗ ██████╗██╗     ██╗██████╗ ",
  "██╔════╝██╔═══██╗██╔════╝╚══██╔══╝██╔════╝██║     ██║██╔══██╗",
  "███████╗██║   ██║█████╗     ██║   ██║     ██║     ██║██████╔╝",
  "╚════██║██║   ██║██╔══╝     ██║   ██║     ██║     ██║██╔═══╝ ",
  "███████║╚██████╔╝██║        ██║   ╚██████╗███████╗██║██║     ",
  "╚══════╝ ╚═════╝ ╚═╝        ╚═╝    ╚═════╝╚══════╝╚═╝╚═╝     ",
] as const;

const TAGLINE = "Open-source orchestration for AI software development teams";

export function printSoftclipCliBanner(): void {
  const lines = [
    "",
    ...SOFTCLIP_ART.map((line) => pc.cyan(line)),
    pc.blue("  ───────────────────────────────────────────────────────"),
    pc.bold(pc.white(`  ${TAGLINE}`)),
    "",
  ];

  console.log(lines.join("\n"));
}
