// v009/site/scripts/_projects_desktop_pi_iot.js

import { esc, qsa } from './__utils.js';

const SSID = 'YOUR_HOTSPOT_NAME';
const PW = 'YOUR_PASSWORD';
const HOME = 'YOUR_NORMAL_WIFI';
const BROKER = '10.42.0.1';

const h = a => ['h', a];
const c = a => ['c', a];
const n = a => ['n', a];
const t = (a, b) => ['t', a, b];

const WIFI = `import network, time

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect("${SSID}", "${PW}")
while not wlan.isconnected():
    time.sleep(0.5)
print("Connected! IP:", wlan.ifconfig()[0])`;

const DIAGRAM = `<svg class="pi-diagram" viewBox="0 0 420 170" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
<rect x="10" y="10" width="100" height="150" rx="8"/>
<text x="60" y="92" text-anchor="middle" stroke="none" fill="currentColor" font-size="13" font-weight="bold">Pico WH</text>
<text x="102" y="52" text-anchor="end" stroke="none" fill="currentColor" font-size="10">GP15 (pin 20)</text>
<text x="102" y="132" text-anchor="end" stroke="none" fill="currentColor" font-size="10">GND (pin 18)</text>
<circle cx="110" cy="60" r="3.5" fill="currentColor"/><circle cx="110" cy="140" r="3.5" fill="currentColor"/>
<path d="M110 60H150l8-10 12 20 12-20 12 20 12-20 12 20 8-10H280V88"/>
<path d="M266 88H294L280 114Z" fill="#e05340" fill-opacity=".55"/>
<path d="M266 114H294M280 114V140H110M300 90l12-10M304 102l12-10"/>
<text x="190" y="40" text-anchor="middle" stroke="none" fill="currentColor" font-size="11">330 ohm</text>
<text x="326" y="122" stroke="none" fill="currentColor" font-size="11">red LED</text>
<text x="326" y="136" stroke="none" fill="currentColor" font-size="9">long leg up</text>
</svg>`;

const T = (x, y, s, a = 'start', z = 11) => `<text x="${x}" y="${y}" text-anchor="${a}" stroke="none" fill="currentColor" font-size="${z}">${s}</text>`;
const SV = (h, b) => `<svg class="pi-diagram" viewBox="0 0 420 ${h}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const BOX = (x, y, w, h, a, b) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${T(x + w / 2, y + h / 2 - (b ? 2 : -4), a, 'middle', 12)}${b ? T(x + w / 2, y + h / 2 + 14, b, 'middle', 9) : ''}`;
const PICO = (h, pins) => `<rect x="10" y="10" width="100" height="${h - 20}" rx="8"/>${T(60, h - 18, 'Pico WH', 'middle', 13)}${pins.map(([y, s]) => `<circle cx="110" cy="${y}" r="3.5" fill="currentColor"/>${T(102, y - 8, s, 'end', 10)}`).join('')}`;
const RES = (x, y) => `M${x} ${y}l8-10 12 20 12-20 12 20 12-20 12 20 8-10`;
const AR = (x1, y, x2) => { const d = x2 > x1 ? -1 : 1; return `<path d="M${x1} ${y}H${x2}M${x2 + 6 * d} ${y - 4}L${x2} ${y}L${x2 + 6 * d} ${y + 4}"/>`; };
const LED = (x, y) => `<path d="M${x - 14} ${y}h28l-14 26z" fill="#e05340" fill-opacity=".55"/><path d="M${x - 14} ${y + 26}h28M${x + 18} ${y + 2}l12-10M${x + 22} ${y + 14}l12-10"/>`;
const WIRE = (y, c) => `<path d="M110 ${y}H300" stroke="${c}"/><circle cx="300" cy="${y}" r="3.5" fill="currentColor"/>`;

const DG = {
    wifi: SV(135, PICO(120, []) + BOX(310, 10, 100, 100, 'Raspberry Pi', 'hotspot 10.42.0.1') + '<path d="M110 100H310" stroke-dasharray="4 6"/><path d="M199.4 89.4Q210 80.6 220.6 89.4M188.8 78.8Q210 61.2 231.2 78.8M178.2 68.2Q210 41.8 241.8 68.2"/><circle cx="210" cy="100" r="3" fill="currentColor"/>' + T(210, 126, 'SSID + password', 'middle', 10)),
    blink: SV(125, '<rect x="60" y="20" width="300" height="70" rx="8"/><rect x="40" y="40" width="20" height="30"/><rect x="190" y="35" width="50" height="40"/>' + T(215, 60, 'chip', 'middle', 11) + '<circle cx="310" cy="45" r="7" fill="#e05340" fill-opacity=".7"/><path d="M322 38l10-8M324 48l12-6"/>' + T(310, 72, 'onboard LED', 'middle', 10) + T(50, 90, 'USB', 'middle', 10) + T(210, 112, 'No wiring: Pin("LED") is built into the board', 'middle', 10)),
    button: SV(190, PICO(190, [[40, 'GP14 (pin 19)'], [100, 'GP15 (pin 20)'], [160, 'GND (pin 18)']]) + '<path d="M110 40H170M210 40H240V160M110 160H290M170 40L204 22"/><circle cx="170" cy="40" r="3.5" fill="currentColor"/><circle cx="210" cy="40" r="3.5" fill="currentColor"/><circle cx="240" cy="160" r="3.5" fill="currentColor"/><path d="M110 100h20"/><path d="' + RES(130, 100) + 'H290V118"/>' + LED(290, 118).replace(/M\d+ 144h28/, 'M276 144h28') + '<path d="M290 144V160"/>' + T(190, 62, 'button', 'middle', 10) + T(168, 86, '330 ohm', 'middle', 10) + T(306, 156, 'red LED', 'start', 11)),
    timer: SV(120, '<path d="M20 70H400"/><path d="' + Array.from({ length: 32 }, (_, i) => `M${20 + i * 12} 66v8`).join('') + '" stroke-width="1.5"/><path d="M104 70V40M224 70V40M344 70V40"/>' + T(104, 32, 'task', 'middle', 11) + T(224, 32, 'task', 'middle', 11) + T(344, 32, 'task', 'middle', 11) + T(164, 56, '2000 ms', 'middle', 10) + T(284, 56, '2000 ms', 'middle', 10) + T(210, 104, 'Each small tick is one pass of the loop checking the clock', 'middle', 10)),
    temp: SV(135, '<rect x="10" y="10" width="400" height="90" rx="8"/>' + T(210, 28, 'Pico WH chip, no external parts', 'middle', 11) + BOX(25, 42, 95, 40, 'temp sensor') + BOX(160, 42, 70, 40, 'ADC 4') + BOX(270, 42, 60, 40, 'volts') + BOX(350, 42, 50, 40, 'deg C') + AR(120, 62, 160) + AR(230, 62, 270) + AR(330, 62, 350) + T(210, 124, '27 - (volts - 0.706) / 0.001721', 'middle', 10)),
    mqtt: SV(140, BOX(10, 20, 100, 70, 'Pico WH', 'breadbot_01') + BOX(160, 20, 100, 70, 'Pi broker', 'Mosquitto 1883') + BOX(310, 20, 100, 70, 'laptop or Pi', 'mosquitto_pub') + AR(110, 40, 160) + AR(160, 70, 110) + AR(310, 40, 260) + AR(260, 70, 310) + T(10, 114, 'Pico publishes team1/sensor/telemetry', 'start', 10) + T(10, 130, 'Pico subscribes to team1/actuator/cmd', 'start', 10)),
    servo: SV(190, PICO(190, [[50, 'GP16 (pin 21)'], [100, 'VBUS (pin 40)'], [150, 'GND (pin 38)']]) + WIRE(50, '#f0a830') + WIRE(100, '#e05340') + WIRE(150, 'currentColor') + '<rect x="300" y="30" width="100" height="140" rx="8"/><circle cx="365" cy="100" r="16"/>' + T(350, 22, 'Servo', 'middle', 11) + T(205, 44, 'signal (orange)', 'middle', 10) + T(205, 94, '5V (red)', 'middle', 10) + T(205, 144, 'GND (brown)', 'middle', 10)),
    lcd: SV(190, PICO(190, [[40, 'GP0 (pin 1)'], [80, 'GP1 (pin 2)'], [120, 'VBUS (pin 40)'], [160, 'GND (pin 38)']]) + WIRE(40, '#477aff') + WIRE(80, '#f0a830') + WIRE(120, '#e05340') + WIRE(160, 'currentColor') + '<rect x="300" y="20" width="100" height="160" rx="8"/>' + T(308, 44, 'SDA', 'start', 10) + T(308, 84, 'SCL', 'start', 10) + T(308, 124, 'VCC', 'start', 10) + T(308, 164, 'GND', 'start', 10) + '<rect x="340" y="78" width="52" height="26" rx="3"/>' + T(366, 96, 'LCD', 'middle', 11)),
    i2c: SV(190, PICO(190, [[40, '3V3 (pin 36)'], [80, 'GP4 (pin 6)'], [120, 'GP5 (pin 7)'], [160, 'GND (pin 38)']]) + WIRE(40, '#e05340') + WIRE(80, '#477aff') + WIRE(120, '#f0a830') + WIRE(160, 'currentColor') + '<rect x="300" y="20" width="100" height="160" rx="8"/>' + T(308, 44, 'VCC', 'start', 10) + T(308, 84, 'SDA', 'start', 10) + T(308, 124, 'SCL', 'start', 10) + T(308, 164, 'GND', 'start', 10) + T(360, 104, 'I2C', 'middle', 11))
};

const CARDS = [
    ['Quick Start', [
        ['Lab Order', [
            h('1. Boot to the command line and reboot'),
            c('sudo raspi-config nonint do_boot_behaviour B2\nsudo reboot'),
            h('2. Start the private hotspot'),
            c(`sudo nmcli device wifi hotspot ifname wlan0 ssid "${SSID}" password "${PW}"`),
            h('3. Install the broker'),
            c('sudo apt update && sudo apt install -y mosquitto mosquitto-clients'),
            h('4. Find the Pico and flash it'),
            c('mpremote devs\nmpremote a0 cp node.py :main.py + reset'),
            h('5. Test from the Pi'),
            c('mosquitto_sub -h localhost -t "#" -v\nmosquitto_pub -h localhost -t "pico/led" -m "ON"'),
            n(`Every Pico needs its own client ID. The Pi hotspot address is ${BROKER}, which is the BROKER_IP in every Pico script.`)
        ]]
    ]],
    ['Pi Basics', [
        ['Power', [
            h('Safe shutdown (wait for the green ACT LED to stop)'),
            c('sudo shutdown -h now'),
            h('Reboot'),
            c('sudo reboot'),
            n('Always shut down in software before pulling power, or the SD card can corrupt.')
        ]],
        ['Boot Mode', [
            h('Boot to the command line (saves about 400MB of RAM)'),
            c('sudo raspi-config nonint do_boot_behaviour B2\nsudo reboot'),
            h('Restore the desktop at boot'),
            c('sudo raspi-config nonint do_boot_behaviour B4\nsudo reboot'),
            h('Start the desktop from the command line'),
            c('startx'),
            c('sudo systemctl start lightdm'),
            n('If startx fails on a newer image (Pi 4, Pi 5), use the lightdm command.')
        ]],
        ['Nano', [
            h('Open or create a file'),
            c('nano script_name.py'),
            t(['Keys', 'Action'], [
                ['Ctrl+O, Enter', 'Save (write out)'],
                ['Ctrl+X', 'Exit'],
                ['Ctrl+W', 'Search'],
                ['Ctrl+K', 'Cut the whole line'],
                ['Ctrl+U', 'Paste the cut text'],
                ['Ctrl+_', 'Go to a line number']
            ])
        ]],
        ['System Info', [
            h('Pi model'),
            c('cat /proc/device-tree/model'),
            h('IP address'),
            c('hostname -I'),
            h('CPU temperature'),
            c('vcgencmd measure_temp'),
            h('Memory and disk'),
            c('free -h\ndf -h')
        ]]
    ]],
    ['Network', [
        ['Hotspot', [
            h('Start a private lab hotspot (no router needed)'),
            c(`sudo nmcli device wifi hotspot ifname wlan0 ssid "${SSID}" password "${PW}"`),
            h('Check active connections'),
            c('nmcli connection show --active'),
            h('Stop the hotspot and rejoin normal Wi-Fi'),
            c(`sudo nmcli connection down Hotspot\nsudo nmcli connection up "${HOME}"`),
            n(`The Pi is always ${BROKER} on its own hotspot. Use that as BROKER_IP.`)
        ]],
        ['Channel and Range', [
            h('See which channels nearby networks use'),
            c('nmcli device wifi list'),
            h('Start the hotspot on a chosen channel (1, 6 or 11)'),
            c(`sudo nmcli device wifi hotspot ifname wlan0 ssid "${SSID}" band bg channel 6 password "${PW}"`),
            h('Change the channel of an existing hotspot'),
            c('sudo nmcli connection modify Hotspot 802-11-wireless.band bg 802-11-wireless.channel 6\nsudo nmcli connection down Hotspot\nsudo nmcli connection up Hotspot'),
            n('The Pico WH only uses 2.4GHz, so pick the channel with the fewest nearby networks. Keep the Pi in the open, near the middle of the room, away from phone hotspots.'),
            n('While the Pi runs the hotspot its Wi-Fi has no internet. Plug in Ethernet if you need to install packages during class.')
        ]],
        ['Multiple Pis', [
            h('Give each Pi its own hotspot name and hostname'),
            c(`sudo hostnamectl set-hostname lab-a\nsudo nmcli device wifi hotspot ifname wlan0 con-name Hotspot-A ssid "${SSID}-A" password "${PW}"`),
            h('Start the hotspot automatically at boot'),
            c('sudo nmcli connection modify Hotspot-A connection.autoconnect yes'),
            h('Stop or restart it by name'),
            c('sudo nmcli connection down Hotspot-A\nsudo nmcli connection up Hotspot-A'),
            n(`Every Pi is ${BROKER} on its own hotspot, so there is no clash. A Pico picks its Pi by the SSID and password in its script, so moving a Pico to another Pi means changing only those two values.`),
            n('Client IDs only need to be unique on one broker. Use different channels (1, 6, 11) for hotspots in the same room.')
        ]],
        ['Remote Access', [
            h('Turn on SSH'),
            c('sudo raspi-config nonint do_ssh 0'),
            h('Log in from another computer on the hotspot'),
            c(`ssh <user>@${BROKER}`),
            h('Copy a file to the Pi'),
            c(`scp node.py <user>@${BROKER}:~`)
        ]],
        ['Web Server', [
            h('Serve the current folder'),
            c('python3 -m http.server 8000'),
            n(`Browse to http://${BROKER}:8000 from any device on the hotspot. Press Ctrl+C to stop.`)
        ]]
    ]],
    ['Mosquitto', [
        ['Install', [
            h('Install the broker and the command line clients'),
            c('sudo apt update && sudo apt install -y mosquitto mosquitto-clients'),
            h('Allow anonymous access on port 1883 (local lab only)'),
            c('echo -e "listener 1883\\nallow_anonymous true" | sudo tee /etc/mosquitto/conf.d/local.conf\nsudo systemctl restart mosquitto')
        ]],
        ['Admin', [
            t(['Command', 'Purpose'], [
                ['sudo systemctl status mosquitto', 'Is the broker running or crashed'],
                ['systemctl is-active mosquitto', 'One word answer: active or not'],
                ['sudo systemctl restart mosquitto', 'Reload after config changes'],
                ['sudo journalctl -u mosquitto -n 20 -f', 'Follow live connection and error logs'],
                ['ss -tulpn | grep 1883', 'Check the broker is listening on 1883']
            ])
        ]],
        ['Subscribe', [
            t(['Command', 'Purpose'], [
                [`mosquitto_sub -h ${BROKER} -t "#" -v`, 'Every topic, printing topic and message'],
                [`mosquitto_sub -h ${BROKER} -t "team1/+" -v`, 'One level wildcard (team1/sensor, team1/led)'],
                [`mosquitto_sub -h ${BROKER} -t "class/estop"`, 'One specific topic'],
                [`mosquitto_sub -h ${BROKER} -t "#" -C 5`, 'Exit after 5 messages']
            ]),
            n('Use localhost instead of the IP when running on the Pi itself.')
        ]],
        ['Publish', [
            t(['Command', 'Purpose'], [
                [`mosquitto_pub -h ${BROKER} -t "pico/led" -m "ON"`, 'Send a text command'],
                [`mosquitto_pub -h ${BROKER} -t "pico/led" -m "OFF"`, 'Turn the actuator off'],
                [`mosquitto_pub -h ${BROKER} -t "class/estop" -m "STOP" -r`, 'Retained message, new subscribers get it at once'],
                [`mosquitto_pub -h ${BROKER} -t "class/estop" -n -r`, 'Clear a retained topic']
            ])
        ]]
    ]],
    ['mpremote', [
        ['Install', [
            h('Install on the Pi'),
            c('sudo apt install -y micropython-mpremote'),
            h('Or, if the package is missing'),
            c('pipx install mpremote')
        ]],
        ['Find and Select', [
            h('List connected boards and their serial IDs'),
            c('mpremote devs'),
            t(['Selector', 'Target'], [
                ['mpremote a0 ...', '1st Pico (/dev/ttyACM0)'],
                ['mpremote a1 ...', '2nd Pico (/dev/ttyACM1)'],
                ['mpremote connect /dev/ttyACM2 ...', 'A specific port'],
                ['mpremote connect id:<serial> ...', 'A specific board by hardware ID']
            ])
        ]],
        ['Run and Flash', [
            t(['Command', 'Action'], [
                ['mpremote a0 run test.py', 'Run in RAM only, main.py untouched'],
                ['mpremote a0 cp node.py :main.py + reset', 'Save as main.py and reboot, runs on every power up'],
                ['mpremote a0 soft-reset', 'Restart the MicroPython runtime']
            ])
        ]],
        ['Files and Packages', [
            t(['Command', 'Action'], [
                ['mpremote a0 ls', 'List files on the Pico'],
                ['mpremote a0 cat :main.py', 'Print main.py from the Pico'],
                ['mpremote a0 rm :main.py', 'Delete main.py, stops auto run'],
                ['mpremote a0 mip install umqtt.simple', 'Install the MQTT library']
            ]),
            n('Installing packages needs internet. The lab hotspot has none, so install while on normal Wi-Fi.')
        ]],
        ['REPL', [
            h('Open the serial console'),
            c('mpremote a0 connect'),
            t(['Keys', 'Action'], [
                ['Ctrl+C', 'Stop the running script'],
                ['Ctrl+D', 'Soft reboot'],
                ['Ctrl+]', 'Exit back to the Pi shell']
            ])
        ]]
    ]],
    ['Pico Snippets', [
        ['Wi-Fi', [
            ['d', DG.wifi],
            c(WIFI)
        ]],
        ['Blink', [
            ['d', DG.blink],
            h('Blink the onboard LED'),
            c('import machine, time\n\nled = machine.Pin("LED", machine.Pin.OUT)\n\nwhile True:\n    led.toggle()\n    time.sleep(0.5)')
        ]],
        ['LED Circuit', [
            ['d', DIAGRAM],
            n('Parts: 1 red LED, 1 resistor (220 to 330 ohm), 2 jumper wires. The long leg (anode) faces the resistor and the short leg (cathode) goes to GND.'),
            c('import machine, time\n\nled = machine.Pin(15, machine.Pin.OUT)\n\nwhile True:\n    led.value(1)\n    time.sleep(0.5)\n    led.value(0)\n    time.sleep(0.5)')
        ]],
        ['Button', [
            ['d', DG.button],
            n('Wire the button between GP14 and any GND pin. The internal pull up makes a press read 0.'),
            c('import machine\n\nbtn = machine.Pin(14, machine.Pin.IN, machine.Pin.PULL_UP)\nled = machine.Pin(15, machine.Pin.OUT)\n\nwhile True:\n    led.value(1 if btn.value() == 0 else 0)')
        ]],
        ['Fade', [
            ['d', DIAGRAM],
            n('PWM dims the LED on GP15. Duty runs from 0 to 65535.'),
            c('import machine, time\n\npwm = machine.PWM(machine.Pin(15))\npwm.freq(1000)\n\nwhile True:\n    for d in range(0, 65536, 1024):\n        pwm.duty_u16(d)\n        time.sleep(0.02)\n    for d in range(65535, -1, -1024):\n        pwm.duty_u16(d)\n        time.sleep(0.02)')
        ]],
        ['Timer', [
            ['d', DG.timer],
            n('Never use time.sleep(5) in a main loop. Check time.ticks_ms() so the Pico can still handle messages.'),
            c('import time\n\nlast = time.ticks_ms()\ninterval_ms = 2000\n\nwhile True:\n    now = time.ticks_ms()\n    if time.ticks_diff(now, last) >= interval_ms:\n        last = now\n        print("Periodic task ran without blocking")\n    time.sleep(0.05)')
        ]],
        ['Temperature', [
            ['d', DG.temp],
            n('Reads the temperature sensor built into the Pico.'),
            c('import machine, time\n\nadc = machine.ADC(4)\n\nwhile True:\n    volts = adc.read_u16() * 3.3 / 65535\n    print(round(27 - (volts - 0.706) / 0.001721, 1), "C")\n    time.sleep(1)')
        ]],
        ['MQTT', [
            ['d', DG.mqtt],
            n('Every Pico needs a unique CLIENT_ID. Duplicates make Mosquitto disconnect the boards over and over.'),
            c(`import network, time, machine
from umqtt.simple import MQTTClient

WIFI_SSID, WIFI_PASS, BROKER_IP = "${SSID}", "${PW}", "${BROKER}"
CLIENT_ID = "breadbot_01"
TOPIC_SUB = b"team1/actuator/cmd"
TOPIC_PUB = b"team1/sensor/telemetry"

led = machine.Pin("LED", machine.Pin.OUT)

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(WIFI_SSID, WIFI_PASS)
while not wlan.isconnected():
    time.sleep(0.5)

def on_message(topic, msg):
    cmd = msg.decode().strip().upper()
    print("Received on", topic.decode(), "->", cmd)
    if cmd == "ON":
        led.value(1)
    elif cmd == "OFF":
        led.value(0)

client = MQTTClient(CLIENT_ID, BROKER_IP, keepalive=30)
client.set_callback(on_message)
client.connect()
client.subscribe(TOPIC_SUB)
client.publish(TOPIC_PUB, b'{"status": "ONLINE"}')

last = time.ticks_ms()
while True:
    try:
        client.check_msg()
        if time.ticks_diff(time.ticks_ms(), last) >= 5000:
            client.publish(TOPIC_PUB, b'{"status": "HEARTBEAT"}')
            last = time.ticks_ms()
        time.sleep(0.05)
    except OSError:
        time.sleep(2)
        machine.reset()`)
        ]],
        ['Servo', [
            ['d', DG.servo],
            n('Signal wire on GP16, 50Hz PWM. Angle runs from 0 to 180 degrees.'),
            c('import machine\n\nservo = machine.PWM(machine.Pin(16))\nservo.freq(50)\n\ndef set_angle(angle):\n    servo.duty_u16(int(1638 + (angle / 180) * 6554))\n\nset_angle(90)')
        ]],
        ['I2C Scan', [
            ['d', DG.i2c],
            n('GP4 is SDA and GP5 is SCL.'),
            c('import machine\n\ni2c = machine.I2C(0, sda=machine.Pin(4), scl=machine.Pin(5), freq=400000)\nprint("Found:", [hex(d) for d in i2c.scan()])')
        ]],
        ['LCD Text', [
            ['d', DG.lcd],
            n('A 1602 LCD with an I2C backpack. SDA goes to GP0 and SCL to GP1, and it runs from the 5V VBUS pin. Find the address with the I2C Scan snippet (often 0x27 or 0x3F) and copy DIYables_LCD_I2C.py onto the Pico first.'),
            c('mpremote a0 cp DIYables_LCD_I2C.py :'),
            c('from machine import I2C, Pin\nfrom DIYables_LCD_I2C import DIYables_LCD_I2C\nimport utime\n\nI2C_ADDR = 0x27\nLCD_ROWS = 2\nLCD_COLS = 16\n\ni2c = I2C(0, sda=Pin(0), scl=Pin(1), freq=400000)\nlcd = DIYables_LCD_I2C(i2c, I2C_ADDR, LCD_ROWS, LCD_COLS)\nlcd.backlight_on()\nlcd.clear()\n\nwhile True:\n    lcd.clear()\n    lcd.set_cursor(0, 0)\n    lcd.print("Hello there")\n    lcd.set_cursor(0, 1)\n    lcd.print("How are you?")\n    utime.sleep(2)\n\n    lcd.clear()\n    lcd.set_cursor(0, 0)\n    lcd.print("Int: ")\n    lcd.print(str(1234))\n    lcd.set_cursor(0, 1)\n    lcd.print("Float: ")\n    lcd.print(str(56.78))\n    utime.sleep(2)'),
            n('set_cursor(column, row) picks where the next print starts. Wrap numbers in str() to print them. A battery pack on VBUS and GND also worked, but unplug it before connecting USB.')
        ]],
        ['LCD Scroll', [
            ['d', DG.lcd],
            n('The screen only shows 16 characters per row, so slide a 16 character window along a longer message. A smaller sleep scrolls faster.'),
            c('from machine import I2C, Pin\nfrom DIYables_LCD_I2C import DIYables_LCD_I2C\nimport utime\n\nCOLS = 16\n\ni2c = I2C(0, sda=Pin(0), scl=Pin(1), freq=400000)\nlcd = DIYables_LCD_I2C(i2c, 0x27, 2, COLS)\nlcd.backlight_on()\nlcd.clear()\nlcd.set_cursor(0, 0)\nlcd.print("Scroll demo")\n\nmsg = "Scrolling text on a tiny screen   "\npadded = " " * COLS + msg\nloop = padded + padded\n\nwhile True:\n    for i in range(len(padded)):\n        lcd.set_cursor(0, 1)\n        lcd.print(loop[i:i + COLS])\n        utime.sleep_ms(300)')
        ]]
    ]]
];

const block = ([k, a, b]) => {
    if (k === 'h') return `<div class="pi-h">${a}</div>`;
    if (k === 'c') return `<div class="pi-code"><button type="button" class="pi-copy">copy</button><pre>${esc(a)}</pre></div>`;
    if (k === 'n') return `<div class="pi-note">${a}</div>`;
    if (k === 't') return `<table class="pi-table"><tr>${a.map(x => `<th>${x}</th>`).join('')}</tr>${b.map(r => `<tr><td><code>${esc(r[0])}</code></td><td>${r[1]}</td></tr>`).join('')}</table>`;
    return a;
};

window._registerProject({
    id: 'pi-iot',
    label: 'Pi MQTT IoT Reference',
    layout: 'desktop',
    thumb: 'pi_iot.svg',
    desc: 'A quick reference for Raspberry Pi command line setup, a private hotspot, the Mosquitto MQTT broker, mpremote, and MicroPython snippets for Pico WH boards, with a circuit or block diagram for every Pico snippet.',
    init(container) {
        let ci = 0, si = 0;

        container.innerHTML = `
            <div class="pi-root">
                <div class="pi-side">${CARDS.map(([name], i) => `<button type="button" class="pi-card" data-i="${i}">${name}</button>`).join('')}</div>
                <div class="pi-main"><div class="pi-subs"></div><div class="pi-view"></div></div>
            </div>`;

        const subs = container.querySelector('.pi-subs');
        const view = container.querySelector('.pi-view');

        const draw = () => {
            qsa('.pi-card', container).forEach((b, i) => b.classList.toggle('active', i === ci));
            subs.innerHTML = CARDS[ci][1].map(([name], i) => `<button type="button" class="pi-sub${i === si ? ' active' : ''}" data-i="${i}">${name}</button>`).join('');
            view.innerHTML = CARDS[ci][1][si][1].map(block).join('');
        };

        container.addEventListener('click', e => {
            const card = e.target.closest('.pi-card');
            const sub = e.target.closest('.pi-sub');
            const copy = e.target.closest('.pi-copy');
            if (card) { ci = +card.dataset.i; si = 0; draw(); }
            else if (sub) { si = +sub.dataset.i; draw(); }
            else if (copy) {
                try { navigator.clipboard.writeText(copy.nextElementSibling.textContent); } catch (err) { }
                copy.textContent = 'copied';
                setTimeout(() => { copy.textContent = 'copy'; }, 1200);
            }
        });

        draw();
    }
});
