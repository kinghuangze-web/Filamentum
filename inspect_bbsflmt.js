const AdmZip = require('adm-zip');
const path = require('path');

const filePath = path.join(__dirname, 'data/魔创哑光 PETG Matte.bbsflmt');
try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    console.log('--- Zip Entries ---');
    zipEntries.forEach(entry => {
        console.log(entry.entryName);
        if (entry.entryName.endsWith('.json')) {
            console.log('--- CONTENT of ' + entry.entryName + ' ---');
            console.log(zip.readAsText(entry));
        }
    });
} catch (e) {
    console.error('Error reading zip:', e);
}
