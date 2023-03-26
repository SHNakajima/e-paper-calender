const html2img = require("./modules/html2img");
const thymeleaf = require("thymeleaf");
const fs = require("fs");
const path = require('path');
const sharp = require("sharp");
const express = require('express');
const jimp = require("jimp");


let tempHtmlPath = path.resolve() + "/template/cl.html"
let clHtmlPath = path.resolve() + "/dist/cl.html"
let pngPath = path.resolve() + "/out/image.png"
let pngResizedPath = path.resolve() + "/out/image_resized.png"
let bmpPath = path.resolve() + "/out/image.bmp"
let tmpEngine = new thymeleaf.TemplateEngine();

main();

async function main() {
  await generateHtml();

  await html2img.convHtml2Img(clHtmlPath, pngPath);

  await convImg();

  await testServe();

  // process.exit(0);
}

async function generateHtml() {
  const result = await tmpEngine.processFile(tempHtmlPath, { title: 'こんにちは!' });
  fs.writeFileSync(clHtmlPath, result);
}

async function convImg() {
  const data = await sharp(pngPath, {raw: {width:600, height:448, bitdepth: 24, channels : 1}})
                .toFile(pngResizedPath)
                .catch(err => console.error(err));
  console.log(data);
  console.log("png resized");

  await png2bmpConvert(pngResizedPath, bmpPath);
}

async function png2bmpConvert(pngPath, bmpPath) {
  const img = await jimp.read(pngPath).catch(err => console.error(err));;
  console.log("png loaded. converting...");
  await img.write(bmpPath);
  console.log("converted!");
}

async function testServe() {
  const app = express();
  
  // 8080番ポートで待ちうける
  app.listen(8080, () => {
    console.log('Running at Port 8080...');
    console.log('cl accessable on http://localhost:8080/cl.html');
  });
  
  // 静的ファイルのルーティング
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // その他のリクエストに対する404エラー
  app.use((req, res) => {
    res.sendStatus(404);
  });
}