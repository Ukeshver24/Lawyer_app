const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('1917', 10);
console.log('HASH:', hash);
