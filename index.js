const express = require('express')
const app = express()
const port = 3000

const { Pool, Client } = require('pg')
 
const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'game_store',
  password: '123',
  port: 5432,
})

app.get('/', async (req, res) => {
  const games = (await pool.query('SELECT * FROM "games"')).rows;
  let result = "<select>";
  games.forEach(item => {
    result += `<option value="${item.id}">${item.name}</option>`;
  })
  result += "</select>";
  res.send(result);
})

app.get('/add_account/:id', async (req, res) => {
  await pool.query(`INSERT INTO "bank_account"("number", "sum", "blocked") VALUES ('${req.params.id}', '0', '0')`);
  res.send("Добавлен аккаунт " + req.params.id);
})

app.get('/set_money/:number/:money', async (req, res) => {
  // - Сделать UPDATE на изменение суммы
  await pool.query(`UPDATE "bank_account" SET "sum"='${req.params.money}' WHERE "number"='${req.params.number}'`);
  res.send(`Сумма счета ${req.params.number} была изменена на ${req.params.money}`);
})
app.get('/transfer/:sender/:recipient/:money', async (req, res) => {
  // - Перевод денег по счетам с sender на recipient
  if (req.params.money <= 0) {
    res.send("Нельзя отправить отрицательную и нулевую сумму");
    return;
  }
  await pool.query(`BEGIN;`);
  // получаем количество денег на счету отправителя(sender)
  const accountQuery = 
    await pool.query(`SELECT "sum", "blocked" FROM "bank_account" WHERE "number"='${req.params.sender}'`);
  const accountSum = accountQuery.rows[0].sum;
  if (Number(accountQuery.rows[0].blocked)) {
    res.send("Счет отправителя заблокирован");
    await pool.query(`ROLLBACK;`);
    return;
  }
  if (accountSum < Number(req.params.money)) {
    res.send("У Вас недостаточно средств");
    await pool.query(`ROLLBACK;`);
    return;
  }
  // получаем количество денег на счету получателя(recipient)
  const recipientAccountQuery =
    await pool.query(`SELECT "sum", "blocked" FROM "bank_account" WHERE "number"='${req.params.recipient}'`);
  const recipientSum = recipientAccountQuery.rows[0].sum;
  // суммируем отправляему сумму и обновляем количесво денег на счету получателя(recipient)
  if (Number(recipientAccountQuery.rows[0].blocked)) {
    res.send("Счет получателя заблокирован");
    await pool.query(`ROLLBACK;`);
    return;
  }
  // вычитаем отправляему сумму и обновляем количество денег на счету отправителя(sender)
  await pool.query(
    `UPDATE "bank_account" SET "sum"='${accountSum - Number(req.params.money)}' WHERE "number"='${req.params.sender}'`);
  
  await pool.query(
    `UPDATE "bank_account" SET "sum"='${recipientSum + Number(req.params.money)}' WHERE "number"='${req.params.recipient}'`);
  
    await pool.query(`COMMIT;`);
  
   res.send(`Со счета ${req.params.sender} на счет  ${req.params.recipient} были отправлены ${req.params.money}`);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
