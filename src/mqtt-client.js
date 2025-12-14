import mqtt from 'mqtt';

// MQTT Configuration
const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt'; // WebSocket secure connection
const TOPIC_LED = 'ionic/esp32/led';
const TOPIC_TEMPERATURE = 'ionic/esp32/temperature';

let client = null;
let ledState = false;

// Connect to MQTT Broker
export function connectMQTT() {
  const clientId = 'ionic_' + Math.random().toString(16).substr(2, 8);
  
  client = mqtt.connect(MQTT_BROKER, {
    clientId: clientId,
    clean: true,
    connectTimeout:  4000,
    reconnectPeriod: 1000,
  });

  client.on('connect', function () {
    console.log('Connected to MQTT broker');
    document.getElementById('mqttStatus').textContent = 'Conectado ao MQTT';
    document.getElementById('mqttStatus').style.color = 'green';
    
    // Subscribe temperature topic
    client.subscribe(TOPIC_TEMPERATURE, function (err) {
      if (! err) {
        console.log('Subscribed to temperature topic');
      }
    });
  });

  client.on('message', function (topic, message) {
    console.log('Received message:', topic, message.toString());
    
    if (topic === TOPIC_TEMPERATURE) {
      const temp = parseFloat(message.toString());
      updateTemperature(temp);
    }
  });

  client.on('error', function (error) {
    console.error('MQTT Error:', error);
    document.getElementById('mqttStatus').textContent = 'Erro na conexão';
    document.getElementById('mqttStatus').style.color = 'red';
  });

  client.on('offline', function () {
    console.log('MQTT offline');
    document.getElementById('mqttStatus').textContent = 'Desconectado';
    document. getElementById('mqttStatus').style.color = 'orange';
  });

  client.on('reconnect', function () {
    console.log('MQTT reconnecting.. .');
    document.getElementById('mqttStatus').textContent = 'Reconectando... ';
    document.getElementById('mqttStatus').style.color = 'orange';
  });
}

// Toggle LED
window.toggleLED = function() {
  if (! client || !client.connected) {
    alert('MQTT não está conectado!');
    return;
  }

  ledState = !ledState;
  const message = ledState ? 'ON' : 'OFF';
  
  client.publish(TOPIC_LED, message, { qos: 1 }, function(err) {
    if (!err) {
      updateLEDUI(ledState);
    }
  });
};

// Atualiza a UI do LED
function updateLEDUI(isOn) {
  const ledIcon = document.getElementById('ledIcon');
  const ledButton = document.getElementById('ledButton');
  const ledStatus = document. getElementById('ledStatus');
  
  if (isOn) {
    ledIcon.name = 'bulb';
    ledIcon.style.color = '#ffd534';
    ledButton.textContent = 'Desligar LED';
    ledButton.color = 'success';
    ledStatus.textContent = 'Status: Ligado';
    ledStatus.style.color = 'green';
  } else {
    ledIcon.name = 'bulb-outline';
    ledIcon.style.color = 'gray';
    ledButton.innerHTML = '<ion-icon slot="start" name="power"></ion-icon>Ligar LED';
    ledButton.color = 'danger';
    ledStatus.textContent = 'Status: Desligado';
    ledStatus.style. color = 'gray';
  }
}

// Atualiza a temperatura na UI
function updateTemperature(temp) {
  const tempElement = document.getElementById('temperatureValue');
  tempElement.textContent = temp.toFixed(1) + ' °C';
  
  // Troca a cor com base na temperatura
  if (temp < 20) {
    tempElement.style.color = '#3880ff'; // Blue for cold
  } else if (temp < 30) {
    tempElement.style.color = '#2dd36f'; // Green for normal
  } else {
    tempElement.style.color = '#eb445a'; // Red for hot
  }
}

// Disconecta MQTT
export function disconnectMQTT() {
  if (client) {
    client.end();
    console.log('Desconectado do MQTT');
  }
}

// Inicializa o MQTT quando a tela2 é exibida
document.addEventListener('DOMContentLoaded', function() {
  // Connect to MQTT when user logs in (tela2 is shown)
  const originalMostrarTela = window.mostrarTela;
  window.mostrarTela = function(telaId) {
    originalMostrarTela(telaId);
    
    if (telaId === 'tela2') {
      connectMQTT();
    } else if (telaId === 'tela1') {
      disconnectMQTT();
    }
  };
});