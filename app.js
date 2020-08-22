const { response, json } = require("express");

const express = require("express"),
  webSocket = require("ws"),
  createError = require("http-errors"),
  url = require("url"),
  app = express(),
  token = "kfgdags415f51fd15bffevveqp";
// simulacion de una base de datos
const db = {
  "mario": "123",
  "fernando": "123",
  "era": "123"
}

app
  .use(express.static(`${__dirname}/public`))
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .get("/", (req, res) => {
    res.sendfile(`${__dirname}/public/index.html`);
  })
  .get("/chart/chart.js", (req, res) => {
    res.sendFile(`${__dirname}/node_modules/chart.js/dist/Chart.min.js`);
  })
  .post("/login", (req, res) => {
    const user = req.body.user.toLowerCase();
    const password = req.body.password;
    // verificacion del user en la "base de datos";
    if (user && password && db[user] == password) {
      res.status(200)
      res.json({
        data: {
          token,
          user
        }
      })
    } else {
      res.status(401);
      res.json({
        data: {
          err: createError(401)
        }
      })
    }
  })
const server = require("http").createServer(app);
// iniciar el servidor y el websocket (la verificacion viene luego)
const wss = new webSocket.Server({ noServer: true });
wss.on("connection", (ws, req, nameClient) => {
  // mensaje de entrada, menos al que se conecto
  wss.clients.forEach(client => {
    // envio a todos menos al que emitio el mensaje
    if (client !== ws && client.readyState === webSocket.OPEN)
      client.send(JSON.stringify({ type: "open", user: nameClient }));
  })
  // envio de mensajes a todos
  ws.on("message", message => {
    const msgJson = JSON.parse(message);
    let responseData = {}
    if (msgJson.type == "message") {
      responseData = msgJson;
      responseData.user = nameClient;
      // enviar a todos los clientes("conectados")
      wss.clients.forEach(client => {
        client.send(JSON.stringify(responseData));
      })
    }
    else if (msgJson.type == "sale") {
      responseData = {
        type: "sale",
        data_product: msgJson.product,
        data_quantity: msgJson.quantity
      }
      // enviar a todos los clientes("conectados")
      wss.clients.forEach(client => {
        client.send(JSON.stringify(responseData));
      })
    } else if (msgJson.type == "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
    }

  })
  // envio de mensaje cuando alguien se retira;
  ws.on("close", () => {
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === webSocket.OPEN)
        client.send(JSON.stringify({ type: "close", user: nameClient }));
    })
  })
})

// veriicacion de usuario
server.on("upgrade", (req, socket, head) => {
  const urlParseada = url.parse(req.url, true);
  const query = urlParseada.query;
  if (query.token != token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  const client = query.user;
  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit("connection", ws, req, client);
  })
})
// poner en marcha el servidor
server.listen(3000, () => {
  console.log("servidor corriendo en el puerto 3000");
})