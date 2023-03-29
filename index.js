const html2img = require("./modules/html2img");
const gCalender = require("./modules/gCalender");
const mockCalenderData = require("./mock/clData");
const thymeleaf = require("thymeleaf");
const fs = require("fs");
const path = require('path');
const sharp = require("sharp");
const express = require('express');
const jimp = require("jimp");
const { tasks } = require("googleapis/build/src/apis/tasks");
const { tmpdir } = require("os");


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

  process.exit(0);
}

async function generateHtml() {
  
  const tmpDate = new Date();
  const title = `${tmpDate.getFullYear} - ${tmpDate.getMonth}`
  
  const days = getCalendarDays("2week");
  const yobiArr = ['日','月','火','水','木','金','土'];

  console.log(days[0].orig, days[days.length-1].orig);
  const events = await gCalender.getEvents(days[0].orig, days[days.length-1].orig);
  // const clData = mockCalenderData.mockData;

  // console.log(events);
  // console.log(days);
  const clData = generateClData(days, events);
  console.log(clData);

  let tmpEngine = new thymeleaf.TemplateEngine();
  const result = await tmpEngine.processFile(tempHtmlPath, { title: title, yobi: yobiArr, clData: clData});
  fs.writeFileSync(clHtmlPath, result);
}

async function convImg() {
  const data = await sharp(pngPath, {raw: {width:600, height:448, bitdepth: 24, channels : 1}})
                .toFile(pngResizedPath)
                .catch(err => console.error(err));
  // console.log(data);
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

function getCalendarDays(getWeekType="full") {
  let date = new Date();
  let calenderDays = [];

  let firstDay,lastDay;

  if (getWeekType == "full") {
    firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const curMonth = date.getMonth() + 1;
    const prevMonBuff = firstDay.getDay() - 1;
    const nextMonBuff = 7 - lastDay.getDay();
    
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
  } else if (getWeekType == "2week") {
    firstDay = new Date();
    lastDay = addDays(new Date, 7);

    calenderDays = [firstDay, lastDay,...addWeekDays(firstDay), ...addWeekDays(lastDay)];
  }

  calenderDays.sort(function(a, b){
    return (a > b ? 1 : -1);
  });

  let res = []
  for (const item of calenderDays) {
    res.push(
      {
        orig: item,
        dateStr: `${item.getFullYear()}-${(item.getMonth()+1).toString().padStart(2, '0')}-${item.getDate().toString().padStart(2, '0')}`,
        year: item.getFullYear(),
        month: (item.getMonth()+1),
        day: item.getDate(),
        events: [],
        isToday: isToday(item)
      }
    );
  }


  return res;
}

function isToday(date) {
  const today = new Date();
  return (
    date.getFullYear() == today.getFullYear() && date.getDate() == today.getDate() && date.getMonth() == today.getMonth()
  );
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

function addWeekDays(inputDate) {
  let weekDays = []
  // 前後の日付リストを作成
  // prev
  for (const divDay in Array.from({length: 7}, (v, k) => k)) {
    if (divDay == 0 ) continue;
    if (divDays(inputDate,divDay).getDay() == 6) break;
    weekDays.push(divDays(inputDate,divDay));
  }
  // next
  for (const addDay in Array.from({length: 7}, (v, k) => k)) {
    if (addDay == 0 ) continue;
    if (addDays(inputDate,addDay).getDay() == 0) break;
    weekDays.push(addDays(inputDate,addDay));
  }

  return weekDays;
}

function generateClData(dates, events) {
  // console.log(events);
  // return events;

  let res = [];

  for (let date of dates) {
    for (const event of events) {
      if (event.startDay == date.dateStr) {
        console.log("found!!");
        date.events.push(event);
      }
    }
    res.push(date);
  }

  return res;
}