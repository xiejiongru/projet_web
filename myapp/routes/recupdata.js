const { Client } = require('ssh2');

const sshConfig = {
    host: 'piensg027',
    username: 'pi',
    privateKey: require('fs').readFileSync('~/.ssh/id_rsa')
}
function readSensorData(callback) {
    const conn = new Client();
    conn.on('ready', () => {
        console.log('SSH Connected');
        conn.exec('cat /dev/shm/tph.log', (err, stream) => {
            if (err) throw err;
            let data = '';
            stream.on('data', chunk => data += chunk.toString());
            stream.on('close', () => {
                conn.end();
                callback(null, data.trim());
            });
        });
    }).on('error', err => {
        console.error('SSH Error:', err);
        callback(err, null);
 
    })
}