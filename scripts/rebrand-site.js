const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const htmlFiles = [
  'index.html',
  'contact/index.html',
  'profile/index.html',
  'works/index.html',
  'works/index.html?category=event.html',
  'works/index.html?category=goods.html',
  'works/index.html?category=illustration.html',
  'works/index.html?category=mv-illustration.html',
  'works/222109/index.html',
  'works/BLACKmeme/index.html',
  'works/beads-key-ring-meme/index.html',
  'works/chase/index.html',
  'works/error-china/index.html',
  'works/error-y2k-nui/index.html',
  'works/ikebukuro109/index.html',
  'works/meidonohi/index.html',
  'works/mhm/index.html',
  'works/miku-day-2025/index.html',
  'works/meme-y2k-nui/index.html',
  'works/mochiusa/index.html',
  'works/mochiusa-02/index.html',
  'works/nacchatta/index.html',
  'works/sketch20250403/index.html',
  'works/vaporwave/index.html',
  'works/y2k-nui/index.html',
];

const loadingLinks = '<div class="_loadingLinks_xfgot_71"> <a href="https://www.instagram.com/crsves/" class="_root_2nwwz_1" data-invert="false" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> Instagram<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a><a href="https://discord.com/" class="_root_2nwwz_1" data-invert="false" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> Discord @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a><a href="mailto:crsves@asia.com" class="_root_2nwwz_1" data-invert="false"> <span class="_inner_2nwwz_27"> crsves@asia.com<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a><a href="https://github.com/crsves" class="_root_2nwwz_1" data-invert="false" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> GitHub @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </div>';

const headerMenuLinks = '<ul class="_sns_2f0wn_74"> <li> <a href="https://www.instagram.com/crsves/" class="_link_2f0wn_81" target="_blank" rel="noopener noreferrer" data-js="hamburger-menu-link"> Instagram </a> </li><li> <a href="https://discord.com/" class="_link_2f0wn_81" target="_blank" rel="noopener noreferrer" data-js="hamburger-menu-link"> Discord @crsves </a> </li><li> <a href="mailto:crsves@asia.com" class="_link_2f0wn_81" data-js="hamburger-menu-link"> crsves@asia.com </a> </li><li> <a href="https://github.com/crsves" class="_link_2f0wn_81" target="_blank" rel="noopener noreferrer" data-js="hamburger-menu-link"> GitHub @crsves </a> </li> </ul>';

const headerSns = '<ul class="_sns_10du9_86"> <li> <a href="https://www.instagram.com/crsves/" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> Instagram<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </li><li> <a href="https://discord.com/" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> Discord @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </li><li> <a href="mailto:crsves@asia.com" class="_root_2nwwz_1" data-invert="true"> <span class="_inner_2nwwz_27"> crsves@asia.com<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </li><li> <a href="https://github.com/crsves" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> GitHub @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </li> </ul>';

const footerSns = '<ul class="_sns_m7rmt_35"> <li> <a href="https://www.instagram.com/crsves/" class="_snsLink_m7rmt_45"> Instagram @crsves </a> </li><li> <a href="https://discord.com/" class="_snsLink_m7rmt_45"> Discord @crsves </a> </li><li> <a href="mailto:crsves@asia.com" class="_snsLink_m7rmt_45"> crsves@asia.com </a> </li><li> <a href="https://github.com/crsves" class="_snsLink_m7rmt_45"> GitHub @crsves </a> </li> </ul>';

const footerCredit = '<p class="_credit_m7rmt_59">\nName: crsves<br>\nLocation: taiwan<br>\nInstagram: @crsves<br>\nDiscord: @crsves<br>\nEmail: crsves@asia.com<br>\nGitHub: @crsves\n</p>';

const profileLinks = '<ul class="_mainLinks_cpv9r_67"> <li> <a href="https://www.instagram.com/crsves/" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> Instagram @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </li><li> <a href="https://discord.com/" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> Discord @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </li><li> <a href="mailto:crsves@asia.com" class="_root_2nwwz_1" data-invert="true"> <span class="_inner_2nwwz_27"> crsves@asia.com<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </li><li> <a href="https://github.com/crsves" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> GitHub @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </li> </ul>';

const homeKvSns = '<div class="_kvSns_1fs6u_62"> <a href="https://www.instagram.com/crsves/" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> Instagram @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a><a href="https://discord.com/" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> Discord @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a><a href="mailto:crsves@asia.com" class="_root_2nwwz_1" data-invert="true"> <span class="_inner_2nwwz_27"> crsves@asia.com<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a><a href="https://github.com/crsves" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noreferrer"> <span class="_inner_2nwwz_27"> GitHub @crsves<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span> </span> </a> </div>';

function replaceAll(text, searchValue, replaceValue) {
  if (typeof searchValue === 'string') {
    return text.split(searchValue).join(replaceValue);
  }
  return text.replace(searchValue, replaceValue);
}

for (const relativeFile of htmlFiles) {
  const filePath = path.join(rootDir, relativeFile);
  let text = fs.readFileSync(filePath, 'utf8');

  text = replaceAll(text, /1:09 Portfolio/g, 'crsves');
  text = replaceAll(text, /自由插畫家1:09（一木）。以東京為中心活動，多次參加活動展出。主要創作螢光色彩與清晰線條的插畫。同時廣泛從事布偶、服裝及商品設計等工作。/g, 'crsves，位於 taiwan。Instagram：@crsves，Discord：@crsves，Email：crsves@asia.com，GitHub：@crsves。');
  text = replaceAll(text, /以東京為中心活動/g, '以 taiwan 為據點');
  text = replaceAll(text, /https:\/\/x\.com\/osusi109\/?/g, 'https://www.instagram.com/crsves/');
  text = replaceAll(text, /https:\/\/www\.instagram\.com\/ichiki109\/?/g, 'https://github.com/crsves');
  text = replaceAll(text, /https:\/\/ichichi\.booth\.pm\/?/g, 'mailto:crsves@asia.com');
  text = replaceAll(text, '(c)ichiki 1:09', '(c) crsves');
  text = replaceAll(text, '(c) 1:09 ichiki', '(c) crsves');
  text = replaceAll(text, 'at_1-09.txt', 'crsves.txt');
  text = replaceAll(text, 'meme.webp', 'crsves.txt');
  text = replaceAll(text, '<div class="_dialogBody_183c8_24"> <p>1:09</p> </div>', '<div class="_dialogBody_183c8_24"> <p>crsves</p> </div>');

  text = replaceAll(text, /<div class="_loadingLinks_xfgot_71">[\s\S]*?<\/div> <\/div> <div class="_frame_yk7yd_1"/g, `${loadingLinks} </div> <div class="_frame_yk7yd_1"`);
  text = replaceAll(text, /<ul class="_sns_2f0wn_74">[\s\S]*?<\/ul> <\/div>  <div class="_wrapper_lwnf9_9"/g, `${headerMenuLinks} </div>  <div class="_wrapper_lwnf9_9"`);
  text = replaceAll(text, /<ul class="_sns_10du9_86">[\s\S]*?<\/ul> <\/header>/g, `${headerSns} </header>`);
  text = replaceAll(text, /<ul class="_sns_m7rmt_35">[\s\S]*?<\/ul> <div>/g, `${footerSns} <div>`);
  text = replaceAll(text, /<p class="_credit_m7rmt_59">[\s\S]*?<\/p> <div class="_barcode_m7rmt_76">/g, `${footerCredit} <div class="_barcode_m7rmt_76">`);

  text = replaceAll(text, '<p class="_profileName_1fs6u_873">1:09</p>', '<p class="_profileName_1fs6u_873">crsves</p>');
  text = replaceAll(text, '1:09<br>illustration<br>portfolio', 'crsves<br>taiwan<br>portfolio');
  text = replaceAll(text, /<div class="_kvSns_1fs6u_62">[\s\S]*?<\/div> <\/div>  <div class="_kvDialogWrapper_1fs6u_197">/g, `${homeKvSns} </div>  <div class="_kvDialogWrapper_1fs6u_197">`);
  text = replaceAll(text, 'Twitter(X)', 'Instagram');
  text = replaceAll(text, '<div class="_profileDesc_1fs6u_883"><p>本人為自由插畫家1:09（一木）。</p><p>以 taiwan 為據點，多次參加活動展出。</p><p>主要創作螢光色彩與清晰線條的插畫。</p><p>同時廣泛從事布偶、服裝及商品設計等工作。</p></div>', '<div class="_profileDesc_1fs6u_883"><p>Name: crsves</p><p>Location: taiwan</p><p>Instagram: @crsves</p><p>Discord: @crsves</p><p>Email: crsves@asia.com</p><p>GitHub: @crsves</p></div>');
  text = replaceAll(text, '<div class="_mainDesc_cpv9r_47"><p>1:09（一木）</p><p>插畫家 / 設計師</p><p><br/>本人為自由插畫家。</p><p>以 taiwan 為據點，多次參加活動展出。</p><p>主要創作螢光色彩與清晰線條的插畫。</p><p></p><p>工作委託洽詢請</p><p><a href="/contact/index.html" target="_blank" rel="noreferrer">聯繫頁面</a>的表單聯繫。</p></div>', '<div class="_mainDesc_cpv9r_47"><p>crsves</p><p>digital creator</p><p><br/>Name: crsves</p><p>Location: taiwan</p><p>Instagram: @crsves</p><p>Discord: @crsves</p><p>Email: crsves@asia.com</p><p>GitHub: @crsves</p></div>');
  text = replaceAll(text, /<ul class="_mainLinks_cpv9r_67">[\s\S]*?<\/ul> <\/div> <div class="_kvGraphic_cpv9r_74">/g, `${profileLinks} </div> <div class="_kvGraphic_cpv9r_74">`);
  text = replaceAll(text, '<ul class="_subContent_cpv9r_356"> <li> <a href="https://www.instagram.com/crsves/" target="_blank" rel="noopener"> Instagram </a> </li><li> <a href="https://github.com/crsves" target="_blank" rel="noopener"> Instagram </a> </li><li> <a href="mailto:crsves@asia.com" target="_blank" rel="noopener"> BOOTH </a> </li> </ul>', '<ul class="_subContent_cpv9r_356"> <li><a href="https://www.instagram.com/crsves/" target="_blank" rel="noopener">Instagram: @crsves</a></li><li><a href="https://discord.com/" target="_blank" rel="noopener">Discord: @crsves</a></li><li><a href="mailto:crsves@asia.com" rel="noopener">Email: crsves@asia.com</a></li><li><a href="https://github.com/crsves" target="_blank" rel="noopener">GitHub: @crsves</a></li> </ul>');

  text = replaceAll(text, '<div class="_headingDesc_1mtkv_18"><p>請透過此表單或</p><p><a href="https://www.instagram.com/crsves/" target="_blank" rel="noreferrer">Twitter(X) 私訊</a>進行聯繫。</p><p>如有委託需求，請一同告知詳情、希望完成日期及預算等。</p></div>', '<div class="_headingDesc_1mtkv_18"><p>Name: crsves</p><p>Location: taiwan</p><p><a href="https://www.instagram.com/crsves/" target="_blank" rel="noreferrer">Instagram: @crsves</a></p><p>Discord: @crsves</p><p>Email: crsves@asia.com</p><p>GitHub: @crsves</p></div>');
  text = replaceAll(text, 'placeholder="meme醬"', 'placeholder="crsves"');
  text = replaceAll(text, 'placeholder="info@example.com"', 'placeholder="crsves@asia.com"');
  text = replaceAll(text, '<div class="_error_1mtkv_208" data-js="contact-error"><p>發生錯誤，無法傳送。</p><p>！！非常抱歉，請再次嘗試或</p><p><a href="https://www.instagram.com/crsves/" target="_blank" rel="noreferrer">Twitter(X) 私訊</a>直接聯繫。</p></div>', '<div class="_error_1mtkv_208" data-js="contact-error"><p>發生錯誤，無法傳送。</p><p>請改用 Instagram、Discord 或電子郵件聯繫。</p><p><a href="https://www.instagram.com/crsves/" target="_blank" rel="noreferrer">Instagram: @crsves</a> ｜ crsves@asia.com</p></div>');

  text = replaceAll(text, 'href="../profile/index.html"', 'href="/profile/index.html"');
  text = replaceAll(text, 'href="../../profile/index.html"', 'href="/profile/index.html"');
  text = replaceAll(text, 'href="profile/index.html"', 'href="/profile/index.html"');
  text = replaceAll(text, 'href="../contact/index.html"', 'href="/contact/index.html"');
  text = replaceAll(text, 'href="../../contact/index.html"', 'href="/contact/index.html"');
  text = replaceAll(text, 'href="contact/index.html"', 'href="/contact/index.html"');
  text = replaceAll(text, 'href="../works/index.html"', 'href="/works/index.html"');
  text = replaceAll(text, 'href="../../works/index.html"', 'href="/works/index.html"');
  text = replaceAll(text, 'href="works/index.html"', 'href="/works/index.html"');
  text = replaceAll(text, 'href="../index.html"', 'href="/index.html"');
  text = replaceAll(text, 'href="../../index.html"', 'href="/index.html"');

  if (relativeFile.startsWith('works/') && relativeFile !== 'works/index.html' && !relativeFile.startsWith('works/index.html?')) {
    text = replaceAll(text, '<a href="/index.html" class="_link_2f0wn_81" data-js="hamburger-menu-link"> Works </a>', '<a href="/works/index.html" class="_link_2f0wn_81" data-js="hamburger-menu-link"> Works </a>');
    text = replaceAll(text, '<a href="/index.html" class="_menuLink_10du9_60"> Works </a>', '<a href="/works/index.html" class="_menuLink_10du9_60"> Works </a>');
  }

  fs.writeFileSync(filePath, text);
}

console.log(`Updated ${htmlFiles.length} HTML files.`);