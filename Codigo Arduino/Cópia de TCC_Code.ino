/**
  Exemplo de codificacao e organizacao
  Name: monitor_esp32.ino
  Purpose: monitor

  @author Thiago B. Lo
  @version 1.0 27/08/2022
                                +-----------------------+
                                | O      | USB |      O |
                                |        -------        |
                            3V3 | [ ]               [ ] | VIN
                            GND | [ ]               [ ] | GND
  Touch3/HSPI_CS0/ADC2_3/GPIO15 | [ ]               [ ] | GPIO13/ADC2_4/HSPI_ID/Touch4
CS/Touch2/HSPI_WP/ADC2_2/GPIO2  | [ ]               [ ] | GPIO12/ADC2_5/HSPI_Q/Touch5
   Touch0/HSPI_HD/ADC2_0/GPIO4  | [ ]               [ ] | GPIO14/ADC2_6/HSPI_CLK/Touch6
                  U2_RXD/GPIO16 | [ ]               [ ] | GPIO27/ADC2_7/Touch7
                  U2_TXD/GPIO17 | [ ]               [ ] | GPIO26/ADC2_9/DAC2
               V_SPI_CS0/GPIO5  | [ ]  ___________  [ ] | GPIO25/ADC2_8/DAC1
           SCK/V_SPI_CLK/GPIO18 | [ ] |           | [ ] | GPIO33/ADC1_5/Touch8/XTAL32
     U0_CTS/MSIO/V_SPI_Q/GPIO19 | [ ] |           | [ ] | GPIO32/ADC1_4/Touch9/XTAL32
            SDA/V_SPI_HD/GPIO21 | [ ] |           | [ ] | GPIO35/ADC1_7
             CLK2/U0_RXD/GPIO3  | [ ] |           | [ ] | GPIO34/ADC1_6
             CLK3/U0_TXD/GPIO1  | [ ] |           | [ ] | GPIO39/ADC1_3/SensVN
     SCL/U0_RTS/V_SPI_WP/GPIO22 | [ ] |           | [ ] | GPIO36/ADC1_0/SensVP
           MOSI/V_SPI_WP/GPIO23 | [ ] |___________| [ ] | EN
                                |                       |
                                |  |  |  ____  ____  |  |
                                |  |  |  |  |  |  |  |  |
                                |  |__|__|  |__|  |__|  |
                                | O                   O |
                                +-----------------------+
  GPIO15                          GPIO13
  GPIO2  LED-BUITIN               GPIO12
  GPIO4  DS18B20                  GPIO14
  GPIO16                          GPIO27
  GPIO17                          GPIO26
  GPIO5  DHT-22                   GPIO25
  GPIO18                          GPIO33
  GPIO19                          GPIO32
  GPIO21 I2C-SDA                  GPIO35
  GPIO3                           GPIO34 LDR Ky-018
  GPIO1                           GPIO39
  GPIO22 I2C-SCL                  GPIO36
  GPIO23

  Dispositivos I2C:
  - LCD SSD1306.
  - BMP280
  - ADS1115 16 bits ADC
  Digitais:
  - DS18B20 Sensor temperatura DallasTemperature
  - DHT-22 Sensor temperatura umidade DHT
  Analogicos:
  - LDR Sensor de iluminação

  Bibliotecas:
  - Adafruit_BMP280_Library
  - Adafruit_BusIO
  - Adafruit_GFX_Library
  - Adafruit_SSD1306
  - Adafruit_Unified_Sensor
  - DallasTemperature
  - DHT_sensor_library
  - FirebaseClient 
  - OneWire

*/
/******************************************************************************/

#include <Arduino.h>
#if defined(ESP32) || defined(ARDUINO_RASPBERRY_PI_PICO_W) || defined(ARDUINO_GIGA) || defined(ARDUINO_OPTA)
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#elif __has_include(<WiFiNINA.h>) || defined(ARDUINO_NANO_RP2040_CONNECT)
#include <WiFiNINA.h>
#elif __has_include(<WiFi101.h>)
#include <WiFi101.h>
#elif __has_include(<WiFiS3.h>) || defined(ARDUINO_UNOWIFIR4)
#include <WiFiS3.h>
#elif __has_include(<WiFiC3.h>) || defined(ARDUINO_PORTENTA_C33)
#include <WiFiC3.h>
#elif __has_include(<WiFi.h>)
#include <WiFi.h>
#endif

#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_BMP280.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <FirebaseClient.h>

#define WIFI_SSID "IFPR-IoT"
#define WIFI_PASSWORD "j^SFDRy5v6470kKHD7"

// #define WIFI_SSID "tblo"
// #define WIFI_PASSWORD "losaum12"

// #define WIFI_SSID "Redmi 12C"
// #define WIFI_PASSWORD "03102006"

#define API_KEY "AIzaSyA7M2fuyG3owV9dWM706YMJnqQ9Jbe6DSo"
#define USER_EMAIL "daiarthur053@gmail.com"
#define USER_PASSWORD "20122007"
#define DATABASE_URL "https://teste-7fa12.firebaseio.com"
#define FIREBASE_PROJECT_ID "teste-7fa12"

// Definindo os pinos dos sensores
#define ONE_WIRE_BUS 4    // Pino de dados do DS18B20
#define DHTPIN 5          // Pino de dados do DHT-22
#define DHTTYPE DHT22     // Tipo do sensor DHT
#define LDR_PIN 34        // Pino analógico para o LDR

// Display OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C  // Endereço I2C padrão para o SSD1306

const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -3 * 3600; // Horário de Brasília
const int daylightOffset_sec = 0;

const String dispositivo = "qWbPQi24SgIkXsXpkI3N";

DefaultNetwork network; 
UserAuth user_auth(API_KEY, USER_EMAIL, USER_PASSWORD);
FirebaseApp app;

#if defined(ESP32) || defined(ESP8266) || defined(ARDUINO_RASPBERRY_PI_PICO_W)
#include <WiFiClientSecure.h>
WiFiClientSecure ssl_client;
#elif defined(ARDUINO_ARCH_SAMD) || defined(ARDUINO_UNOWIFIR4) || defined(ARDUINO_GIGA) || defined(ARDUINO_OPTA) || defined(ARDUINO_PORTENTA_C33) || defined(ARDUINO_NANO_RP2040_CONNECT)
#include <WiFiSSLClient.h>
WiFiSSLClient ssl_client;
#endif

using AsyncClient = AsyncClientClass;

AsyncClient aClient(ssl_client, getNetwork(network));
Firestore::Documents Docs;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature DS18B20_Sensor(&oneWire);
DeviceAddress endereco_temp; // Cria um endereco temporario da leitura do sensor
DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP280 bmp;

AsyncResult aResult_no_callback;

float temperatureC;
float humidity;
int ldrValue;
float pressao;

const int intervaloLeitura = 10000;  // Intervalo de leitura de sensores em milissegundos (10 segundos)
const int intervaloMedia = 30000;   // Intervalo para calcular a média (30 segundos)
const int tamVetor = intervaloMedia / intervaloLeitura;  // Número de leituras para a média

// Vetores para armazenar as leituras dos sensores
float vetorTemperatura[tamVetor];
float vetorUmidade[tamVetor];
float vetorLDR[tamVetor];
float vetorPressao[tamVetor];

int readingIndex = 0;  // Índice para armazenar as leituras no vetor

void initWifi(){
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
      Serial.print(".");
      delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();
}

void iniciar() {
  pinMode(LED_BUILTIN,OUTPUT);
  DS18B20_Sensor.begin();
  dht.begin();
  bmp.begin();
  iniciaLCD();
  Serial.begin(115200);
  initWifi();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  Firebase.printf("Firebase Client v%s\n", FIREBASE_CLIENT_VERSION);
  Serial.println("Initializing app...");

  #if defined(ESP32) || defined(ESP8266) || defined(PICO_RP2040)
    ssl_client.setInsecure();
  #endif
    initializeApp(aClient, app, getAuth(user_auth), aResult_no_callback);
    authHandler();
    app.getApp<Firestore::Documents>(Docs);
    aClient.setAsyncResult(aResult_no_callback);
}

void iniciaLCD() {
  Wire.begin(21, 22);  // Inicializa o I2C com os pinos especificados
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("failed to start SSD1306 OLED"));
    while (1);
  }
  display.clearDisplay();
}

void tempo() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Erro ao obter hora");
        return;
    }

    // Exibir a data e hora
    Serial.printf("Data e Hora: %02d/%02d/%04d %02d:%02d:%02d\n", timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900, timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
}

void exibirLCD() {
    // Limpa o display OLED
    display.clearDisplay();

    // Exibe as informações no OLED
    display.setTextColor(WHITE);

    // Exibe a data e hora
    String timestamp = getCurrentTimestamp(); // Função que já retorna a data e hora formatada
    display.setCursor(0, 0);  // Posição inicial para o texto
    display.print("Data e Hora: ");
    display.print(timestamp); // Exibe a data e hora

    // Exibe a temperatura
    display.setCursor(0, 20);  // Próxima linha
    display.print("Temp: ");
    display.print(temperatureC, 0);
    display.print(" C");

    // Exibe a umidade
    display.setCursor(0, 30);
    display.print("Umidade: ");
    display.print(humidity, 0);
    display.print(" %");

    // Exibe o valor do LDR (sensor de luminosidade)
    display.setCursor(0, 40);
    display.print("LDR: ");
    display.print(ldrValue, 0);

    // Exibe a pressão
    display.setCursor(0, 50);
    display.print("Pressão: ");
    display.print(pressao, 1);
    display.print(" hPa");

    // Atualiza o display com as novas informações
    display.display();
}

void lerSensores(){
  DS18B20_Sensor.requestTemperatures(); // Envia comando para realizar a conversão de temperatura
  temperatureC = DS18B20_Sensor.getTempC(endereco_temp); // Busca temperatura para dispositivo
  Serial.println(DS18B20_Sensor.getTempC(endereco_temp), 1); // Busca temperatura para dispositivo
  humidity = dht.readHumidity();
  ldrValue = analogRead(LDR_PIN);
  pressao = bmp.readPressure() / 100.0;

  // Armazenar as leituras nos vetores
  vetorTemperatura[readingIndex] = temperatureC;
  vetorUmidade[readingIndex] = humidity;
  vetorLDR[readingIndex] = ldrValue;
  vetorPressao[readingIndex] = pressao;
  
  Serial.println("Valor Temp: ");
  Serial.print(temperatureC);
  
  Serial.println("Valor Humi: ");
  Serial.print(humidity);

  Serial.println("Valor LDR: ");
  Serial.print(ldrValue);

  Serial.println("Valor Pressao: ");
  Serial.print(pressao);

  exibirLCD();
  
  // Incrementa o índice para a próxima leitura
  readingIndex++;

  // Se atingiu o número de leituras (30 segundos = 3 leituras de 10s)
  if (readingIndex >= tamVetor) {
    // Calcular e exibir as médias
    float mediaTemp = calcularMedia(vetorTemperatura, tamVetor);
    float mediaHumi = calcularMedia(vetorUmidade, tamVetor);
    float mediaLDR = calcularMedia(vetorLDR, tamVetor);
    float mediaPressao = calcularMedia(vetorPressao, tamVetor);

    Serial.print("Média Temp: ");
    Serial.println(mediaTemp);
    Serial.print("Média Humi: ");
    Serial.println(mediaHumi);
    Serial.print("Média LDR: ");
    Serial.println(mediaLDR);
    Serial.print("Média Pressao: ");
    Serial.println(mediaPressao);

    // Reiniciar o índice para a próxima rodada de leituras
    readingIndex = 0;

    if(app.ready()){
      sendMeasurement("iluminacao_ldr", dispositivo, mediaLDR);
      sendMeasurement("umidade_dht22", dispositivo, mediaHumi);
      sendMeasurement("temperatura_ds18b20", dispositivo, mediaTemp);
      sendMeasurement("pressao_bmp280", dispositivo, mediaPressao);
    }
  }

}

float calcularMedia(float vetor[], int tam) {
  float soma = 0;
  for (int i = 0; i < tam; i++) {
    soma += vetor[i];
  }
  return soma / tam;
}

void atualizar() {
  String macAddress = WiFi.macAddress();  // Obtém o endereço MAC
  String timestamp = getCurrentTimestamp();  // Pega a hora atual (deve ser uma função que retorna a hora)

  // Caminho para o documento no Firestore
  String documentPath = "dispositivos/qWbPQi24SgIkXsXpkI3N";

  // Define os dados a serem atualizados
  Values::StringValue macValue(macAddress);
  Values::StringValue timestampValue(timestamp);

  // Cria o documento com os campos atualizados
  Document<Values::Value> doc;
  doc.add("end_mac", Values::Value(macValue));  // Atualiza o endereço MAC
  //doc.add("dthr_ult_conexao", Values::Value(timestampValue));  // Atualiza a data/hora

  doc.add("dthr_ult_conexao", Values::Value(timestampValue));  // Atualiza a data/hora

  // A máscara de atualização define que apenas esses dois campos serão atualizados
  PatchDocumentOptions patchOptions(DocumentMask("end_mac,dthr_ult_conexao"), DocumentMask(), Precondition());

  // Atualiza o documento no Firestore
  Docs.patch(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), documentPath, patchOptions, doc, aResult_no_callback);
}

String getCurrentTimestamp() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Erro ao obter hora");
        return "";
    }

    char buffer[30];
    strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
    return String(buffer);
}

void authHandler() {
    unsigned long ms = millis();
    while (app.isInitialized() && !app.ready() && millis() - ms < 120 * 1000) {
        JWT.loop(app.getAuth());
        printResult(aResult_no_callback);
    }
}

void printResult(AsyncResult &aResult) {
    if (aResult.isEvent()) {
        Firebase.printf("Event task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.appEvent().message().c_str(), aResult.appEvent().code());
    }

    if (aResult.isDebug()) {
        Firebase.printf("Debug task: %s, msg: %s\n", aResult.uid().c_str(), aResult.debug().c_str());
    }

    if (aResult.isError()) {
        Firebase.printf("Error task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.error().message().c_str(), aResult.error().code());
    }

    if (aResult.available()) {
        Firebase.printf("task: %s, payload: %s\n", aResult.uid().c_str(), aResult.c_str());
    }
}

void printError(int code, const String &msg) {
    Firebase.printf("Error, msg: %s, code: %d\n", msg.c_str(), code);
}

void sendMeasurement(const String& sensorId, const String& dispositivoId, float valor) {
    String documentPath = "medicoes/";

    Document<Values::Value> doc("sensor_id", Values::Value(Values::StringValue(sensorId)));
    doc.add("dispositivo_id", Values::Value(Values::StringValue(dispositivoId)))
       .add("valor", Values::Value(Values::DoubleValue(valor)))
       .add("dthr", Values::Value(Values::StringValue(getCurrentTimestamp()))); // Timestamp formatado

    Serial.println("Criando documento de medição...");
    String payload = Docs.createDocument(aClient, Firestore::Parent(FIREBASE_PROJECT_ID), documentPath, DocumentMask(), doc);

    if (aClient.lastError().code() == 0) {
        Serial.println(doc);
        Serial.println("Documento criado com sucesso: " + payload);
    } else {
        printError(aClient.lastError().code(), aClient.lastError().message());
    }
}

unsigned long tempoAnterior = 0;  // Armazena o último tempo em que a função foi executada
long tempoLedStatus = millis();
void refreshLedStatus(){
  static bool led_status = false;   
  if(millis() > (tempoLedStatus + 1000)){
    tempoLedStatus = millis();
    // inverter LED
    led_status = !led_status;
    digitalWrite(LED_BUILTIN, led_status);

  }
}

unsigned long previousMillis = 0;
unsigned long interval = 10000;
void verificaConexao(){
  unsigned long currentMillis = millis();
  // if WiFi is down, try reconnecting every CHECK_WIFI_TIME seconds
  if ((WiFi.status() != WL_CONNECTED) && (currentMillis - previousMillis >=interval)) {
    Serial.print(millis());
    Serial.println("Reconnecting to WiFi...");
    WiFi.disconnect();
    WiFi.reconnect();
    previousMillis = currentMillis;
  }
}

void testeDS18B20(){
  DS18B20_Sensor.requestTemperatures(); // Envia comando para realizar a conversão de temperatura
  if (!DS18B20_Sensor.getAddress(endereco_temp,0)) { // Encontra o endereco do sensor no barramento
    Serial.println("SENSOR NAO CONECTADO"); // Sensor conectado, imprime mensagem de erro
  } else {
    Serial.print("Temperatura = "); // Imprime a temperatura no monitor serial
    Serial.println(DS18B20_Sensor.getTempC(endereco_temp), 1); // Busca temperatura para dispositivo
  }
}

void setup() {
  iniciar();
  testeDS18B20();
  atualizar();
}

void loop() {
  authHandler();
  Docs.loop();
  refreshLedStatus();
  verificaConexao();
 
  unsigned long tempoAtual = millis();
  // Verifica se já passou o intervalo desejado
  if (tempoAtual - tempoAnterior >= intervaloLeitura) {
    // Atualiza o tempoAnterior para o momento atual
    tempoAnterior = tempoAtual;

    // Chama a função que você deseja executar
    lerSensores();
    tempo();
  }
}