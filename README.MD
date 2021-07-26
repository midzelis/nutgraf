# nutgraf
> A small and simple NUT (Network UPS Tools) data collector that relays all of the variables to Telegraf or any other server. 

## Installation

```
npm install -g nutgraf
nutgraf
```
-or-
```
docker run \
-d \
-e NUT_HOST="nutserver" \
-e NUT_PORT=3493 \
-e NUTGRAF_LOGGING_URL="http://telegraf:10800/nutgraf-collector" \
midzelis/nutgraf
```
-or-
```
Use the provided docker-compose.yml file to plug into your existing docker compose configuration.
```

## Running
When nutgraf starts, it will connect to the specified NUT server, list all of the UPSes (if multiple) query all of the variables, save it into a JSON object, and send it to the configured logging URL. 

All variables are sent through unmodified, except that values are converted into ints, floats, or left along as strings. 

2 synthetic variables may be added to the data payload: nutgraf.ups.name, and nutgraf.ups.realpower. 

| Variable                | Description 
| ----------------------- | ---------------------------------------------------------------------------------------------- 
| `nutgraf.ups.name`        | The name of the UPS, according to NUT server       
| `nutgraf.ups.realpower`   | Current power usage in Watts. 

Note `nutgraf.ups.realpower` is derived from multiplying  `output.current` * `output.voltage`, if these fields are present. If your UPS doesn't provide these variables, but you know UPS Max Output Power Capacity (in Watts), set the ENV VAR `NUTGRAF_MAX_WATTS_$UPSNAME$` (where `$UPSNAME$` is the name of the UPS according to NUT) to automatically calculate it as `ups.load` / 100 * `NUTGRAF_MAX_WATTS_$UPSNAME$`

## Env Variables
| Variable                       | Description 
| ------------------------------ | ---------------------------------------------------------------------------------------------- 
| `NUT_HOST`                     | The host running the NUT server.   
| `NUT_PORT`                     | The port running the NUT server. 
| `NUTGRAF_LOGGING_URL`          | The host to send collected UPS statistics from NUT. 
| `NUTGRAF_MAX_WATTS_$UPSNAME$`  | If your UPS can't provide current/voltage, use this value to estimate watts from load, replace `$UPSNAME` with the name of the UPS this wattage applies to. 
| `NUGRAF_QUIET`                 | Make nutgraf not output anything to stdout. 

## Telegraf configuration
Here's is a sample configuration that uses the generic HTTP Listener v2 to collect incoming JSON data into telegraf. 

```toml
# Generic HTTP write listener
[[inputs.http_listener_v2]]
## Address and port to host HTTP listener on
  service_address = ":10800"
#
#   ## Path to listen to.
  path = "/nutgraf-collector"

  data_format = "json"
  json_name_key = "nutgraf.measurement.name"
  tag_keys = ["nutgraf.ups.name"]
```

### Sample Output
```
[
  {
    'battery.charge': 100,
    'battery.charge.low': 10,
    'battery.charge.warning': 20,
    'battery.mfr.date': 'CPS',
    'battery.runtime': 2231,
    'battery.runtime.low': 300,
    'battery.type': 'PbAcid',
    'battery.voltage': 13.9,
    'battery.voltage.nominal': 12,
    'device.mfr': 'CPS',
    'device.model': ' CP 1350C',
    'device.type': 'ups',
    'driver.name': 'usbhid-ups',
    'driver.parameter.pollfreq': 30,
    'driver.parameter.pollinterval': 2,
    'driver.parameter.port': 'auto',
    'driver.parameter.synchronous': 'no',
    'driver.version': '2.7.4',
    'driver.version.data': 'CyberPower HID 0.4',
    'driver.version.internal': 0.41,
    'input.transfer.high': 140,
    'input.transfer.low': 90,
    'input.voltage': 124,
    'input.voltage.nominal': 120,
    'output.voltage': 124,
    'ups.beeper.status': 'enabled',
    'ups.delay.shutdown': 20,
    'ups.delay.start': 30,
    'ups.load': 17,
    'ups.mfr': 'CPS',
    'ups.model': ' CP 1350C',
    'ups.productid': 501,
    'ups.realpower.nominal': 298,
    'ups.status': 'OL',
    'ups.test.result': 'Done and passed',
    'ups.timer.shutdown': -60,
    'ups.timer.start': 0,
    'ups.vendorid': 764,
    'nutgraf.ups.name': 'CP1500'
  },
  {
    'ambient.humidity': 0,
    'ambient.temperature': 30,
    'battery.charge': 100,
    'battery.date': '07/15/2020',
    'battery.packs': 0,
    'battery.runtime': 3292,
    'battery.runtime.low': 120,
    'battery.voltage': 54.6,
    'device.mfr': 'APC',
    'device.model': 'Smart-UPS X 1500',
    'device.serial': 'YOU_WISH',
    'device.type': 'ups',
    'driver.name': 'snmp-ups',
    'driver.parameter.mibs': 'apcc',
    'driver.parameter.pollinterval': 2,
    'driver.parameter.port': '192.168.4.137',
    'driver.parameter.synchronous': 'no',
    'driver.version': '2.7.4',
    'driver.version.data': 'apcc MIB 1.2',
    'driver.version.internal': 0.97,
    'input.frequency': 60,
    'input.sensitivity': 'high',
    'input.transfer.high': 127,
    'input.transfer.low': 106,
    'input.transfer.reason': 'smallMomentarySpike',
    'input.voltage': 122.6,
    'input.voltage.maximum': 123.2,
    'input.voltage.minimum': 122.5,
    'output.current': 1.7,
    'output.frequency': 60,
    'output.voltage': 122.6,
    'output.voltage.nominal': 120,
    'ups.firmware': 'UPS 09.1 (ID20) ',
    'ups.id': 'APC UPS',
    'ups.load': 17.4,
    'ups.mfr': 'APC',
    'ups.mfr.date': '05/04/2012',
    'ups.model': 'Smart-UPS X 1500',
    'ups.serial': 'YOU_WISH',
    'ups.status': 'OL',
    'ups.temperature': 27.7,
    'ups.test.date': '06/16/2021',
    'ups.test.result': 'Ok',
    'nutgraf.ups.name': 'APC',
    'nutgraf.ups.realpower': 208.8
  }
]
```

## License

MIT