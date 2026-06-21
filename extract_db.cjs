const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://mhelewhkrscejjvksmyi.supabase.co';
const ANON_KEY = 'sb_publishable_KO83njiZO0EDeewRs15sGw_pwnd_VXt';

async function fetchTable(tableName) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: SUPABASE_URL.replace('https://', ''),
            path: `/rest/v1/${tableName}?select=*`,
            method: 'GET',
            headers: {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch(e) {
                        resolve(data);
                    }
                } else {
                    console.error(`Error fetching ${tableName}: ${res.statusCode} ${data}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(e);
            resolve(null);
        });

        req.end();
    });
}

async function main() {
    console.log('Fetching swm_failure_analyses...');
    const analyses = await fetchTable('swm_failure_analyses');
    
    console.log('Fetching profiles...');
    const profiles = await fetchTable('profiles');
    
    if (analyses) {
        fs.writeFileSync('swm_failure_analyses.json', JSON.stringify(analyses, null, 2));
        console.log(`Saved ${analyses.length} records to swm_failure_analyses.json`);
    }
    
    if (profiles) {
        fs.writeFileSync('profiles.json', JSON.stringify(profiles, null, 2));
        console.log(`Saved ${profiles.length} records to profiles.json`);
    }
    
    console.log('Done.');
}

main();
