'use strict';

const bodyParser = require('body-parser');
const browserify = require('browserify-middleware');
const express = require('express');
const { join } = require('path');
const app = express();

app.use(bodyParser.json());
const broadcasterDirectoryPath = join(__dirname, 'broadcaster');
const clientPath = join(broadcasterDirectoryPath, 'client.js');
app.use('/broadcaster/index.js', browserify(clientPath));
app.get('/broadcaster/index.html', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
app.get('/', (req, res) => res.redirect('broadcaster/index.html'));

const server = app.listen(3000, () => {
  const address = server.address();
  console.log(`http://localhost:${address.port}\n`);
});
