import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const assetDir = path.join(distDir, "assets");

function fail(message) {
  console.error(`RELEASE CHECK FAILED: ${message}`);
  process.exitCode = 1;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  fail("dist/index.html이 없습니다. 먼저 npm run build를 실행하세요.");
}

const bundleFiles = fs.existsSync(assetDir)
  ? fs.readdirSync(assetDir)
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join(assetDir, name))
  : [];

if (bundleFiles.length === 0) {
  fail("검사할 운영 JavaScript 번들이 없습니다.");
}

const bundle = bundleFiles
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");

if (/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(bundle)) {
  fail("운영 번들에 로컬 API 주소가 포함되어 있습니다.");
}

const productionEnv = {
  ...readEnvFile(path.join(root, ".env.production")),
  ...readEnvFile(path.join(root, ".env.production.local")),
};
const kakaoKey = String(
  process.env.VITE_KAKAO_MAP_JS_KEY ?? productionEnv.VITE_KAKAO_MAP_JS_KEY ?? "",
).trim();

if (!kakaoKey) {
  fail("운영용 VITE_KAKAO_MAP_JS_KEY가 설정되지 않았습니다.");
} else if (!bundle.includes(kakaoKey)) {
  fail("운영용 카카오 JavaScript 키가 dist에 반영되지 않았습니다.");
}

if (!process.exitCode) {
  console.log("PASS: 운영 번들의 API 주소와 카카오 지도 설정이 정상입니다.");
}
