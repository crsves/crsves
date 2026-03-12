const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 1. (my skills) → (my projects)
h = h.replace('>(my skills)</p>', '>(my projects)</p>');

// 2. 1: illustration → 1: NOIR
h = h.replace('> 1: illustration <span', '> 1: NOIR <span');

// 3. category_01 dialog title → NOIR
h = h.replace('<h2 class="_title_3fli2_59">category_01</h2>', '<h2 class="_title_3fli2_59">NOIR</h2>');

// 4. Replace illustration link + barcode with View Live → https://noir.crsv.es/
const arrowSvg = '<span class="_arrow_2nwwz_35"><svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M7.10603 8.30204L6.19403 7.39004L7.82803 5.75604L8.77803 4.95804L8.75903 4.90104L6.93503 5.01504H0.551025V3.72304H6.93503L8.75903 3.83704L8.77803 3.78004L7.82803 2.98204L6.19403 1.34804L7.10603 0.436035L11.039 4.36904L7.10603 8.30204Z" fill="currentColor"></path> </svg></span>';

const oldLink = `<div class="_serviceLink_1fs6u_643"> <a href="works/index.html%3Fcategory=illustration.html" class="_root_2nwwz_1" data-invert="true"> <span class="_inner_2nwwz_27"> \u524d\u5f80\u63d2\u5716\u5217\u8868${arrowSvg} </span> </a> </div> <div class="_serviceBarcode_1fs6u_648"> <span class="_barcode_iyu6r_1" aria-hidden="true" translate="no" text="category1">category1</span> </div>`;

const newLink = `<div class="_serviceLink_1fs6u_643"> <a href="https://noir.crsv.es/" class="_root_2nwwz_1" data-invert="true" target="_blank" rel="noopener noreferrer"> <span class="_inner_2nwwz_27"> View Live${arrowSvg} </span> </a> </div> <div class="_serviceBarcode_1fs6u_648"> <span class="_barcode_iyu6r_1" aria-hidden="true" translate="no" text="NOIR">NOIR</span> </div>`;

const linkIdx = h.indexOf(oldLink);
console.log('Link found at:', linkIdx);
if (linkIdx !== -1) {
  h = h.slice(0, linkIdx) + newLink + h.slice(linkIdx + oldLink.length);
}

fs.writeFileSync('index.html', h);
console.log('Done.');

// Verify
const v = fs.readFileSync('index.html', 'utf8');
console.log('(my projects):', v.includes('(my projects)'));
console.log('1: NOIR:', v.includes('> 1: NOIR <span'));
console.log('NOIR title:', v.includes('>NOIR</h2>'));
console.log('View Live:', v.includes('View Live'));
console.log('noir.crsv.es:', v.includes('https://noir.crsv.es/'));
console.log('barcode NOIR:', v.includes('text="NOIR">NOIR'));
