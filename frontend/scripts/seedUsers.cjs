// Seed Firebase Auth users via REST API
// Usage: node scripts/seedUsers.js

const https = require('https');

const API_KEY = 'AIzaSyDolg1uzL9ruBLsSrV7K5NwhpuBmqCa0SQ';

const USERS = [
  { email: 'donkwan@idd.com', password: '96270630', displayName: 'Don Kwan' },
  { email: 'prettywong@idd.com', password: '97213344', displayName: 'Pretty Wong' },
  { email: 'derrickpang@idd.com', password: '12345678', displayName: 'Derrick Pang' },
];

function signUpUser(email, password, displayName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password, displayName, returnSecureToken: true });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const result = JSON.parse(body);
        if (res.statusCode === 200) {
          console.log(`✅ Created: ${email} (localId: ${result.localId})`);
          resolve(result);
        } else {
          console.error(`❌ Failed: ${email} — ${result.error?.message || body}`);
          resolve(null); // don't reject, continue with others
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Error: ${email} — ${err.message}`);
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== Seeding Firebase Auth Users ===\n');

  for (const user of USERS) {
    await signUpUser(user.email, user.password, user.displayName);
  }

  console.log('\n=== Done ===');
}

main();