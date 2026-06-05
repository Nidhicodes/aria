// Single place to configure external links. Set NEXT_PUBLIC_REPO_URL at build
// time to point "Source" at the real public repository.
export const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/aria-agent/aria";
