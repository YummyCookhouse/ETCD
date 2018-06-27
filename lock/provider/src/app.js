import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const PORT = 5000;

const items = {
  '1': {
    'name': 'testItem',
    'count': 30
  }
};

app.use(bodyParser.json());

app.get('/items/:id', function (req, res) {
  const item = items[req.params.id];
  res.json(item);
});

app.post('/orders', function (req, res) {
  const order = req.body;
  const item = items[order.item];
  item.count -= order.count;
  if (item.count < 0)  {
    console.error('out of stock for item:' + item.name);
  } else if (item.count === 0) {
    setTimeout(() => item.count = 30, 3000);
  } else {
    //console.log('Processing Order:' + JSON.stringify(order), 'Item stock:' + item.count);
  }
  res.json(item);
});


app.listen(PORT, () => {
  console.log('Service start at port: ' + PORT);
});