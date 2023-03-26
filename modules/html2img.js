const puppeteer = require('puppeteer');

let browser = null;

exports.convHtml2Img = async function(inputHtmlPath, outputImagePath) {
  if (!inputHtmlPath || !outputImagePath) {
    throw new Error('Specify input and output.');
  }

  // ブラウザを起動
  browser = await puppeteer.launch({
    headless: true
  });

  // 新規ページ (タブに相当) で対象のファイルを開く
  const page = await browser.newPage();
  console.log(`src URL: file://${inputHtmlPath}`);
  await page.goto(`file://${inputHtmlPath}`);

  // ページコンテキスト内でスクリーンショット対象の要素を取得
  // 注: 出力画像のサイズを要素と一致させるために必要
  const selector = '#screenshot-target';
  const targetElement = await page.$(selector);

  // 要素をスクリーンショット
  await targetElement.screenshot({
    path: outputImagePath
  });
  console.log(`.png genarated to : ${outputImagePath}`);
}

exports.convUrl2Img = async function(inputUrl, outputImagePath) {
  if (!inputUrl || !outputImagePath) {
    throw new Error('Specify input and output.');
  }

  // ブラウザを起動
  browser = await puppeteer.launch({
    headless: true
  });

  // 新規ページ (タブに相当) で対象のファイルを開く
  const page = await browser.newPage();
  console.log(inputUrl);
  await page.goto(inputUrl);

  // ページコンテキスト内でスクリーンショット対象の要素を取得
  // 注: 出力画像のサイズを要素と一致させるために必要
  const selector = '#screenshot-target';
  const targetElement = await page.$(selector);

  // 要素をスクリーンショット
  await targetElement.screenshot({
    path: outputImagePath
  });

  console.log("success create image.")

  if (browser) browser.close();
}