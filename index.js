const html2img = require("./modules/html2img");
const gCalender = require("./modules/gCalender");
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

main();

async function main() {
  await generateHtml();

  await html2img.convHtml2Img(clHtmlPath, pngPath);

  await convImg();

  // await testServe();

  // process.exit(0);
}

async function generateHtml() {
  // const events = await gCalender.getEvents();
  const days = getCalendarDays();
  let tmpEngine = new thymeleaf.TemplateEngine();
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

function getCalendarDays() {
  let date = new Date();
  let calenderDays = [];

  const curMonth = date.getMonth() + 1;
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const prevMonBuff = firstDay.getDay() - 1;
  const nextMonBuff = 7 - lastDay.getDay();
  
  console.log(firstDay.getDay())
  console.log(lastDay.getDay())
  console.log('firstDay')
  console.log(firstDay)
  console.log('now')
  console.log(new Date())
  
  // 今月の日付リストを作成
  for (const addDay in Array.from({length: 32}, (v, k) => k)) {
    if (addDays(firstDay,addDay).getMonth() + 1 > curMonth) break;
    calenderDays.push(addDays(firstDay,addDay));
  }

  // 前後の日付リストを作成
  // prev
  for (const divDay in Array.from({length: 7}, (v, k) => k)) {
    if (divDay == 0 ) continue;
    if (divDays(firstDay,divDay).getDay() == 6) break;
    calenderDays.push(divDays(firstDay,divDay));
  }
  // next
  for (const addDay in Array.from({length: 7}, (v, k) => k)) {
    if (addDay == 0 ) continue;
    if (addDays(lastDay,addDay).getDay() == 0) break;
    calenderDays.push(addDays(lastDay,addDay));
  }

  calenderDays.sort(function(a, b){
    return (a > b ? 1 : -1);
  });

  console.log(calenderDays.map(item=>`${item}`));
}

function addDays(date, days) {
  let resDate = new Date(date);
  resDate.setDate(resDate.getDate() + parseInt(days));
  return resDate;
}

function divDays(date, days) {
  let resDate = new Date(date);
  resDate.setDate(resDate.getDate() - parseInt(days));
  return resDate;
}