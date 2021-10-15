const BME280 = require('bme280-sensor');
const cron = require('node-schedule');
const fs = require('fs');
const http = require('http');

const storage = "/home/public/tempmon.json";
const bme280 = new BME280({
    i2cBusNo: 1,
    i2cAddress: 0x76
});

function readSensorData(callback) {
  bme280.readSensorData()
      .then((data) => {
        callback(data);
      })
      .catch((err) => {
        console.log(`BME280 read error: ${err}`);
        callback(null);
  });
}

function readToFile() {
  readSensorData(function(data) {
    if (data != null) {
      var data_out = {time: unixTime(), temp: round(data.temperature_C), humidity: round(data.humidity), pressure: round(data.pressure_hPa)};
 
      if (fs.existsSync(storage)) {
        var json = JSON.parse(fs.readFileSync(storage));
        json.push(data_out);

        json = arrayCleanup(json);
        fs.writeFileSync(storage, JSON.stringify(json));
      } else {
        var array_out = [];
        array_out.push(data_out);
        fs.writeFileSync(storage, JSON.stringify(array_out));
      }
    }
  });
}

bme280.init()
  .then(() => {
    console.log('BME280 initialization succeeded');
    cron.scheduleJob("*/5 * * * *", function() {
      readToFile();
    });
    initHttp();
  })
  .catch((err) => console.error(`BME280 initialization failed: ${err} `));

function round(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function unixTime() {
  return Math.floor(+new Date() / 1000);
}

function arrayCleanup(arr) {
  if (arr.length > 600) {
    return arr.slice(-600);
  } else {
    return arr;
  }
}

function initHttp() {
  const server = http.createServer((req, res) => {
    if (req.url == "/tempmon_data") {
      res.setHeader('Content-Type', 'application/json');
      readSensorData(function(data) {
        if (data == null) {
          res.statusCode = 500;
          res.end(JSON.stringify({success: false, error: "Could not read data from sensor.", data: null}));
        } else {
          res.statusCode = 200;
          var data_out = {success: true, error: null, data: {time: unixTime(), temp: round(data.temperature_C), humidity: round(data.humidity), pressure: round(data.pressure_hPa)}};
          res.end(JSON.stringify(data_out));
        }
      })
    } else {
      res.statusCode = 400;
      res.end();
    }
  });

  server.listen(65069, "127.0.0.1", () => {
    console.log(`HTTP server running at 127.0.0.1:65069`);
  });
}
