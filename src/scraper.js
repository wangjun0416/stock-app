// src/scraper.js - 任天堂股票数据抓取器
const puppeteer = require('puppeteer');

async function fetchNintendoStockFromSBI() {
  console.log('🚀 启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true, // 无头模式
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    console.log('📱 打开新页面...');
    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // SBI证券URL
    const url = 'https://www.sbisec.co.jp/ETGate/WPLETsiR001Control/WPLETsiR001Ilst10/getDetailOfStockPriceJP?OutSide=on&getFlg=on&stock_sec_code_mul=7974&exchange_code=JPN';
    
    console.log(`🌐 访问: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle2', // 等待网络空闲
      timeout: 60000
    });

    console.log('⏳ 等待页面加载完成...');
    // 等待股票数据表格出现
    await page.waitForSelector('.stock-price-table', { timeout: 10000 })
      .catch(() => {
        console.log('⚠️  未找到.stock-price-table，尝试其他选择器...');
      });

    console.log('🔍 提取股票数据...');
    const stockData = await page.evaluate(() => {
      // 根据SBI证券页面结构提取数据
      // 注意：以下选择器需要根据实际页面结构调整
      
      const data = {
        stockCode: '7974',
        stockName: '任天堂株式会社',
        currentPrice: null,
        previousClose: null,
        change: null,
        changePercent: null,
        volume: null,
        high: null,
        low: null,
        marketCap: null,
        updateTime: new Date().toISOString()
      };

      // 尝试多个可能的选择器
      const selectors = {
        currentPrice: ['.current-price', '.price-value', '#stockPrice'],
        previousClose: ['.previous-close', '.close-price'],
        change: ['.price-change', '.change-value'],
        changePercent: ['.change-percent', '.percent-change'],
        volume: ['.volume', '.trading-volume'],
        high: ['.day-high', '.price-high'],
        low: ['.day-low', '.price-low']
      };

      // 遍历选择器并提取数据
      for (const [key, selectorArray] of Object.entries(selectors)) {
        for (const selector of selectorArray) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent.trim();
            // 提取数字，移除逗号和日元符号
            const number = parseFloat(text.replace(/[¥,]/g, ''));
            if (!isNaN(number)) {
              data[key] = number;
              break;
            }
          }
        }
      }

      // 如果没有找到价格，尝试从页面标题或元数据中提取
      if (!data.currentPrice) {
        const title = document.title;
        const priceMatch = title.match(/(\d{1,3}(?:,\d{3})*)円/);
        if (priceMatch) {
          data.currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
      }

      return data;
    });

    console.log('✅ 数据提取完成！');
    console.log('📊 股票数据:', stockData);

    return stockData;

  } catch (error) {
    console.error('❌ 抓取失败:', error.message);
    throw error;
  } finally {
    console.log('🔒 关闭浏览器...');
    await browser.close();
  }
}

// 导出函数
module.exports = { fetchNintendoStockFromSBI };

// 如果直接运行此脚本
if (require.main === module) {
  fetchNintendoStockFromSBI()
    .then(data => {
      console.log('\n========== 任天堂股票数据 ==========');
      console.log(`コード: ${data.stockCode}`);
      console.log(`名前: ${data.stockName}`);
      console.log(`現在価格: ¥${data.currentPrice?.toLocaleString() || 'N/A'}`);
      console.log(`前日比: ${data.change?.toLocaleString() || 'N/A'} (${data.changePercent || 'N/A'}%)`);
      console.log(`出来高: ${data.volume?.toLocaleString() || 'N/A'}`);
      console.log(`高値: ¥${data.high?.toLocaleString() || 'N/A'}`);
      console.log(`安値: ¥${data.low?.toLocaleString() || 'N/A'}`);
      console.log(`=====================================`);
      process.exit(0);
    })
    .catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}
