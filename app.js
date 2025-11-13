import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// configure EJS view engine and views directory
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    // renders views/index.ejs
    res.render('index');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
}); 

