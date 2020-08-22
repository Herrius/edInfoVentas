let ws = null, theChart = null;
const dataChart = [5, 15, 12];

const setSystemMessage = data => {
  systemMessage.textContent = data;
}
let data = {};
const login = async () => {
  const user = {
    user: usrName.value,
    password: password.value
  }
  const header = new Headers();
  header.append("Content-Type", "application/json");
  const config = {
    method: "POST",
    headers: header,
    body: JSON.stringify(user)
  }
  const response = await fetch("/login", config);
  switch (response.status) {
    case 200:
      data = await response.json();
      setSystemMessage("Conectado correctamente");
      connectWs(data.data);
      loadChart();
      break;
    case 401:
      setSystemMessage("usuario o contraseña no valido");
      break;
    default:
      setSystemMessage("ocurrio un error inesperado " + response.status);
      break;
  }
}
btnLogin.addEventListener("click", e => {
  e.preventDefault();
  login();
})

const connectWs = data => {
  ws = new WebSocket(`ws://localhost:3000?user=${data.user}&token=${data.token}`);
  ws.onopen = e => {
    setSystemMessage("Conectado al ws");
  }
  ws.onerror = e => {
    setSystemMessage(e);
  }
  ws.onmessage = e => {
    const data = JSON.parse(e.data);
    switch (data.type) {
      case "message":
        content.innerHTML = `<p>${data.user} : ${data.message}</p>`
        break;
      case "sale":
        dataChart[data.data_product] += data.data_quantity;
        theChart.update();
        break;
      case "pong":

        break;
    }
  }
  setInterval(() => {
    ws.send(JSON.stringify({ type: "ping" }))
  }, 60000)
}

btnSendMessage.addEventListener("click", e => {
  e.preventDefault();
  const data = {
    type: "message",
    message: txtmsg.value
  }
  if (ws.readyState && ws.readyState != 3) {
    ws.send(JSON.stringify(data))
    txtmsg.value = "";
  }
})

btnSale.addEventListener("click", e => {
  e.preventDefault();
  const cantidad = parseInt(quantity.value, 10);
  if (cantidad < 1) {
    alert("no puedes vender menos de uno");
    return "";
  }
  const data = {
    type: "sale",
    product: parseInt(product.value, 10),
    quantity: cantidad
  }
  ws.send(JSON.stringify(data))
})

const loadChart = () => {
  var ctx = document.getElementById('myChart').getContext('2d');
  theChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['zapatos', 'camisas', 'billeteras'],
      datasets: [{
        label: '# of Votes',
        data: dataChart,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  });
}