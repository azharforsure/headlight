import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSitemap() {
    const url = 'https://findr.mc/component/osmap?view=xml&id=1&format=xml';
    console.log(`Fetching ${url}...`);
    try {
        const res = await axios.get(url);
        const text = res.data;
        console.log(`Length: ${text.length}`);
        console.log(`First 200 chars: ${text.substring(0, 200)}`);

        const $ = cheerio.load(text, { xmlMode: true, decodeEntities: true });
        
        // Exact logic from server/crawler.js
        const allElements = $('*');
        const urlEntries = allElements.filter((_i, el) => el.name.toLowerCase() === 'url');
        console.log(`Found urlEntries (filter): ${urlEntries.length}`);

        const directUrls = $('url');
        console.log(`Found direct urls ($): ${directUrls.length}`);

        urlEntries.each((i, el) => {
            const $el = $(el);
            const locEl = $el.find('*').filter((_j, child) => child.name.toLowerCase() === 'loc');
            const loc = locEl.text().trim();
            console.log(`${i}: ${loc}`);
        });

        // Fallback logic
        const locMatches = [...text.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
            .map((match) => String(match[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim())
            .filter(Boolean);
        console.log(`Fallback regex found ${locMatches.length} loc matches`);
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testSitemap();
