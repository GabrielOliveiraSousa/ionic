// MQTT Configuration
const MQTT_BROKER = 'wss://test.mosquitto.org:8081'; // WebSocket connection
const TOPIC_LED = 'wokwi/esp32/led/control';
const TOPIC_TEMPERATURE = 'wokwi/esp32/temperature';

let client = null;
let ledState = false;


function initMQTT() {
  
  if (typeof mqtt === 'undefined') {
    console.error('MQTT library not loaded! ');
    document.getElementById('mqttStatus').textContent = 'Erro:  Biblioteca MQTT não carregada';
    document.getElementById('mqttStatus').style.color = 'red';
    return;
  }

  connectMQTT();
}


function connectMQTT() {
  const clientId = 'ionic_' + Math.random().toString(16).substr(2, 8);
  
  console.log('Connecting to MQTT broker...');
  console.log('Broker:', MQTT_BROKER);
  console.log('Client ID:', clientId);
  
  client = mqtt.connect(MQTT_BROKER, {
    clientId: clientId,
    clean: true,
    connectTimeout:  4000,
    reconnectPeriod: 1000,
  });

  client.on('connect', function () {
    console.log('✓ Connected to MQTT broker');
    document.getElementById('mqttStatus').textContent = 'Conectado ao MQTT';
    document.getElementById('mqttStatus').style.color = 'green';
    
    // Subscribe to temperature topic
    client.subscribe(TOPIC_TEMPERATURE, function (err) {
      if (! err) {
        console.log('✓ Subscribed to temperature topic:', TOPIC_TEMPERATURE);
      } else {
        console.error('✗ Subscribe error:', err);
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
    console.log('MQTT reconnecting...');
    document.getElementById('mqttStatus').textContent = 'Reconectando... ';
    document.getElementById('mqttStatus').style.color = 'orange';
  });
}


window.toggleLED = function() {
  console.log('toggleLED called');
  
  if (! client || ! client.connected) {
    alert('MQTT não está conectado!');
    console.error('MQTT not connected');
    return;
  }

  ledState = !ledState;
  const message = ledState ? 'ON' : 'OFF';
  
  console.log('Publishing to', TOPIC_LED, ':', message);
  
  client.publish(TOPIC_LED, message, { qos: 1 }, function(err) {
    if (! err) {
      console.log('✓ LED command sent:', message);
      updateLEDUI(ledState);
    } else {
      console.error('✗ Publish error:', err);
    }
  });
};


function updateLEDUI(isOn) {
  const ledIcon = document.getElementById('ledIcon');
  const ledButton = document.getElementById('ledButton');
  const ledStatus = document.getElementById('ledStatus');
  
  if (isOn) {
    ledIcon.setAttribute('name', 'bulb');
    ledIcon.style.color = '#ffd534';
    ledButton.innerHTML = '<ion-icon slot="start" name="power"></ion-icon> Desligar LED';
    ledButton.setAttribute('color', 'success');
    ledStatus.textContent = 'Status:  Ligado';
    ledStatus.style.color = 'green';
  } else {
    ledIcon.setAttribute('name', 'bulb-outline');
    ledIcon.style.color = 'gray';
    ledButton.innerHTML = '<ion-icon slot="start" name="power"></ion-icon> Ligar LED';
    ledButton.setAttribute('color', 'danger');
    ledStatus.textContent = 'Status: Desligado';
    ledStatus. style.color = 'gray';
  }
}


function updateTemperature(temp) {
  const tempElement = document.getElementById('temperatureValue');
  
  if (! tempElement) {
    console.error('Temperature element not found');
    return;
  }
  
  tempElement.textContent = temp.toFixed(1) + ' °C';
  
  
  if (temp < 20) {
    tempElement.style.color = '#3880ff'; // Blue for cold
  } else if (temp < 30) {
    tempElement.style.color = '#2dd36f'; // Green for normal
  } else {
    tempElement.style.color = '#eb445a'; // Red for hot
  }
  
  console.log('Temperature updated:', temp. toFixed(1) + '°C');
}


function disconnectMQTT() {
  if (client) {
    client.end();
    console.log('Disconnected from MQTT');
  }
}


window.logout = async function() {
  disconnectMQTT();
  try {
    const auth = window.firebaseAuth;
    if (auth) {
      await auth.signOut();
    }
    mostrarTela('tela1');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    mostrarTela('tela1');
  }
};


document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, setting up MQTT...');
  
  
  const originalMostrarTela = window.mostrarTela;
  if (originalMostrarTela) {
    window.mostrarTela = function(telaId) {
      originalMostrarTela(telaId);
      
      if (telaId === 'tela2') {
        console.log('Dashboard shown, connecting MQTT...');
        setTimeout(initMQTT, 500); 
      } else if (telaId === 'tela1') {
        console.log('Login screen shown, disconnecting MQTT...');
        disconnectMQTT();
      }
    };
  }
});