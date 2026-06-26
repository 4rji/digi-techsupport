Hopkins TS Lab
This space contains a list of devices that should always be reachable by Technical Support, and
also the policy on using the equipment.
Support Lab Device Policy
The lab devices are shared devices that all of Technical Support can use. Please keep the
following in mind when using these devices:
Using the lab equipment
1.
If reconfiguring or testing a device for an extended period, please enter your name and a
a.
message in the banner section of the Configuration. As usual, please normalize the device
when you are complete. The saved configuration files may be found under
\\digi.com\Shared\Training\Tech Support\Lab Devices Backup Configurations\
Equipment should be returned to the state it was previously in before you started after you
b.
are finished working on a device.'
You must take a backup of the device before you start working with the device.
c.
After you are finished with a device, ensure that the backup you took is loaded on the
i.
device so it returns to the previous state.
If you need to adjust cables (Ethernet, SFP, loopback plugs, etc.) connected to a device,
d.
these need to be put back into their original place when you are finished.
These are shared devices. As such, other Technical Support personnel may be working on
e.
the same device at the same time. If you need exclusive access to a device temporarily,
notify the team that you will be using the particular device and for how long.
If reconfiguring or testing a device for an extended period, please enter your name &
f.
message in the banner section of the Configuration. As usual, please normalize the device
when you are complete. The saved configuration files may be found under "X:\Lab Devices
Backup Configurations\Lab Backup Files"
Do not change the IP address of the device, as this may cause the device to become
g.
inaccessible for everyone.
CEx
2.
Load the existing backup file for the current firmware version to the device before any CEx
a.
testing occurs to ensure the device is in the desired state prior to firmware upgrade. The
This document is confidential Page 1 of 13

existing backup files can be found here: \\digi.com\Shared\Training\Tech Support\Lab
Devices Backup Configurations\
Immediately after upgrading firmware to the version that is being tested for CEx, take a
b.
backup of the device and upload it to the shared backup folder:
\\digi.com\Shared\Training\Tech Support\Lab Devices Backup Configurations\
Once CEx is completed, reload the backup file taken in letter b above so the device goes
c.
back to the desired state for the lab.
The following cable colors are being used in the lab for specific purposes:
3.
Blue - CAT 6 cable - Connectivity between a Digi device and a lab switch for network
a.
connectivity.
Red - CAT 6 cable - Connectivity between the switches and the Digi network (DO NOT
b.
TOUCH).
Green - CAT 6 cable - Serial connectivity between the Digi devices and end serial device.
c.
Yellow - Fiber cable - Connectivity between Digi devices and the fiber switch for network
d.
connectivity.
Device List
Below is a list of devices that are online in the Technical Support lab for everyone to use.
NOTE: Some devices on the list show both a letter and number for the rack in which they are
located. The number after the letter denotes the shelf where the device resides within the
lettered rack.
P Address MAC Device Type Special Current Default Cur
Address Notes Usernam Passwor rent
e/Passwo d Loc
rd atio
n
10.10.65.20 00409D PortServer TS Loopback: root/dbps Rac
- ETH 23BC0A 8 MEI Port 1 k A
This document is confidential Page 2 of 13

| 10.10.65.21 | 00409D | PortServer TS | (serial ports    | root/dbps |     | Rac |
| ----------- | ------ | ------------- | ---------------- | --------- | --- | --- |
| - ETH       | 225B29 | 16 Rack       | 4, 9, 11, 12, 13 |           |     | k A |
& 14 no
longer work)
Loopback:
Port 1 & 2
| 10.10.65.22 | 00409D | PortServer TS | Loopback:     | root/dbps |     | Rac |
| ----------- | ------ | ------------- | ------------- | --------- | --- | --- |
| - ETH       | 453454 | 16 MEI        | Port 1        |           |     | k A |
| 10.10.65.23 | 00409D | AnywhereUS    | Port 3: Flash | root/dbps |     | Rac |
| - ETH       | 8A12EB | B/14          | Drive         |           |     | k A |
10.10.65.24 0040FF AnywhereUS Port 1: Flash admin/P@ EZ5EFA Rac
| - ETH 1     | 810B20 | B/24+       | Drive       | ssword11  | H3MT45 | k B |
| ----------- | ------ | ----------- | ----------- | --------- | ------ | --- |
| 10.10.67.20 |        |             | Digi RPM 8: |           |        |     |
| - SFP 2     |        |             | Port 2      |           |        |     |
| 10.10.65.25 | 00409D | ConnectPort | Loopback:   | root/dbps |        | Rac |
| - ETH       | 38982C | TS 16       | Port 1      |           |        | k B |
Digi RPM 8:
Port 3
| 10.10.65.26 | 00409D | ConnectPort | Loopback:       | root/dbps |     | Rac |
| ----------- | ------ | ----------- | --------------- | --------- | --- | --- |
| -ETH        | 45CEC0 | TS 16 MEI   | Port 1, Ports 7 |           |     | k B |
& 8 looped to
each other
w/cable
Digi RPM 8:
Port 4
| 10.10.65.27 | 000195E | ConnectPort | Loopback:   | root/dbps |     | Rac |
| ----------- | ------- | ----------- | ----------- | --------- | --- | --- |
| - ETH 1     | EFF20   | LTS 16 MEI  | Ports 1 - 8 |           |     | k B |
Dual
| 10.10.65.28 | 00409D | ConnectPort | Loopback:   | root/dbps |     | Rac |
| ----------- | ------ | ----------- | ----------- | --------- | --- | --- |
| - ETH 1     | BB2105 | LTS 32 MEI  | Ports 1 - 4 |           |     | k B |
W Single
This document is confidential Page 3 of 13

| 10.10.65.29 | 00409D | Digi Passport | Loopback: | root/dbps |     | Rac |
| ----------- | ------ | ------------- | --------- | --------- | --- | --- |
| - ETH 1     | 7A8C81 | 8 Single AC   | one       |           |     | k A |
Power
| 10.10.65.30 | 00409D | Digi Passport | Loopback: | root/dbps |     | Rac |
| ----------- | ------ | ------------- | --------- | --------- | --- | --- |
| - ETH 1     | 95C1A1 | 16 Dual AC    | None      |           |     | k A |
Power
| 10.10.65.31 | 00409D | Digi Passport | Loopback: | root/dbps |     | Rac |
| ----------- | ------ | ------------- | --------- | --------- | --- | --- |
| - ETH 1     | B8477D | 32 Single AC  | None      |           |     | k A |
Power
| 10.10.65.32 | 00409D | Digi Passport | Loopback: | root/dbps |     | Rac |
| ----------- | ------ | ------------- | --------- | --------- | --- | --- |
| - ETH 1     | 2E54E7 | 48 Dual AC    | None      |           |     | k A |
Power
| 10.10.65.33 | 00409D | Digi CM 48   | Loopback: | root/dbps |     | Rac |
| ----------- | ------ | ------------ | --------- | --------- | --- | --- |
| - ETH       | 23F8A9 | Single Power | None      |           |     | k A |
10.10.65.34 00409D Digi Connect Loopback: root/dbps MW568F Rac
| - ETH       | CE67AE | SP            | Port 1        |           | 3HBX2M | k A  |
| ----------- | ------ | ------------- | ------------- | --------- | ------ | ---- |
| 10.10.65.35 | 00409D | PortServer TS | Loopback:     | root/dbps |        | Shel |
| - ETH       | 22C8F6 | 4             | Port 1        |           |        | f    |
| 10.10.65.37 | 00409D | PortServer TS | Loopback:     | root/dbps |        | Shel |
| - ETH       | 89E672 | 2 P MEI       | Port 1        |           |        | f    |
| 10.10.65.38 | 0040FF | TX64-Rail-    | Loopback:     | admin/P@  | ZG8KAA | Rac  |
| -           | 828300 | Single-       | Serial port 1 | ssword11  | C5J64W | k A  |
| WAN/ETH1    |        | Cellular      |               |           |        | Shel |
f
Missing
cables - No
access
10.10.65.39 0040FF Digi Connect Loopback: admin/P@ 77F8ZS Rac
| - ETH 1 | 8316F0 | EZ 8 IO | Serial port 1 | ssword11 | QRGCKF | k A |
| ------- | ------ | ------- | ------------- | -------- | ------ | --- |
USB:
10.10.65.41 00409D Digi One IAP Loopback: root/dbps CDYC2R Shel
| - ETH | CE6089 | HAZ | None |     | 5EJQ99 | f   |
| ----- | ------ | --- | ---- | --- | ------ | --- |
This document is confidential Page 4 of 13

10.10.65.42 0040FF Digi Connect Loopback: admin/P@ JXGX2V Shel
| - ETH 1     | 85F14C | EZ 4 WS    | Serial port 1 | ssword11  | 88C24Y | f   |
| ----------- | ------ | ---------- | ------------- | --------- | ------ | --- |
| 10.10.65.43 | 00042D | WR11-L600- |               | username  |        | Upp |
| - ETH       | 095FBF | DE1-SU     |               | /password |        | er  |
Shel
f
| 10.10.65.44 | 00042D | WR11-L800- |     | username  |     | Upp  |
| ----------- | ------ | ---------- | --- | --------- | --- | ---- |
| - ETH       | 072C49 | DE1-XU     |     | /password |     | er   |
|             |        | (WR11-XT)  |     |           |     | Shel |
f
| 10.10.65.45 | 00042D | WR21-M72B- |     | username  |     | Upp  |
| ----------- | ------ | ---------- | --- | --------- | --- | ---- |
| - LAN 0     | 0A3D4F | DE1-SB     |     | /password |     | er   |
|             |        | (MC7354)   |     |           |     | Shel |
f
| 10.10.65.46 | 00042D | WR31-L52A- |     | username  |     | Upp |
| ----------- | ------ | ---------- | --- | --------- | --- | --- |
| - LAN0      | 076A9A | DE1-TB     |     | /password |     | er  |
Shel
f
| 10.10.65.47 | 00042D | WR44-L5G1- |     | username  |     | Upp |
| ----------- | ------ | ---------- | --- | --------- | --- | --- |
| - LAN 0     | 05EA62 | NE1-SU     |     | /password |     | er  |
Shel
f
10.10.65.48 0004F3 Digi IX25-4G Loopback: admin/pas J96BAQ Shel
| - WAN | B79FA5 |     | Serial Port | sword11 | 7ERR67 | f   |
| ----- | ------ | --- | ----------- | ------- | ------ | --- |
10.10.65.49  0004F3 Digi TX65- Loopback: admin/pas H67C5X Shel
| -   | A0453E | Dual-Wi-Fi | Serial Port | sword11 | 74MVYK | f   |
| --- | ------ | ---------- | ----------- | ------- | ------ | --- |
WAN/ETH1
| 10.10.65.50 | 0004F3 | Digi IX10 | This is a   | admin/P@ | Q3KMP7 | Upp  |
| ----------- | ------ | --------- | ----------- | -------- | ------ | ---- |
| - ETH       | 9F5522 |           | dedicated   | ssword11 | SC9GS3 | er   |
|             |        |           | DAL device  |          |        | Shel |
|             |        |           | for the DOM |          |        | f    |
Server.
Please resist
This document is confidential Page 5 of 13

using this
device.
| 10.10.65.51 | 0040FF | LR54W xOS - |              | username  | 5WN4G | Upp  |
| ----------- | ------ | ----------- | ------------ | --------- | ----- | ---- |
| - LAN 0     | 0F44F8 | DO NOT      |              | /password | 5GRVT | er   |
|             |        | UPGRADE TO  |              |           |       | Shel |
|             |        | DAL         |              |           |       | f    |
| 10.10.65.52 | 00042D | WR11-M600-  | This is a    | username  |       | Upp  |
| - ETH       | 0AB0A1 | DE1-XB      | dedicated    | /password |       | er   |
|             |        |             | SarOS device |           |       | Shel |
|             |        |             | for the DOM  |           |       | f    |
Server.
Please resist
using this
device.
| 10.10.65.55 | 002704 | AcceleratedC |     | admin/def |     | Upp  |
| ----------- | ------ | ------------ | --- | --------- | --- | ---- |
| - ETH       | 312b57 | oncepts/630  |     | ault      |     | er   |
|             |        | 0-CX         |     |           |     | Shel |
f
| 10.10.65.56 | 002704 | AcceleratedC |     | admin/P@ |     | Upp  |
| ----------- | ------ | ------------ | --- | -------- | --- | ---- |
| - WAN       | 2C9195 | oncepts/6350 |     | ssword11 |     | er   |
|             |        | -SR          |     |          |     | Shel |
f
| 10.10.65.57 | 002704 | EX15 | Loopback:     | admin/P@ | FJP4RM | Shel |
| ----------- | ------ | ---- | ------------- | -------- | ------ | ---- |
| - 2/WAN     | 3FE607 |      | Serial Port 1 | ssword11 | MZT0   | f    |
| 10.10.65.58 | 0004F3 | IX15 | Loopback:     | admin/P@ | ZQ46NS | Upp  |
| - ETH       | 340D98 |      | Port 1        | ssword11 | 1DD4P6 | er   |
Shel
f
| 10.10.65.59 | 0004F3 | Connect IT | Loopback: | admin/P@ | AWHQ8  | Shel |
| ----------- | ------ | ---------- | --------- | -------- | ------ | ---- |
| - ETH       | 977A8C | Mini       | Port 1    | ssword11 | ZD0X6D | f    |
Y
Digi RPM 10:
Port 2
This document is confidential Page 6 of 13

| 10.10.65.60 | 00409D | AnywhereUS |           | root/dbps |     | Shel |
| ----------- | ------ | ---------- | --------- | --------- | --- | ---- |
| - ETH       | 9546B4 | B/5        |           |           |     | f    |
| 10.10.65.61 | 0004F3 | Digi IX14  | Loopback: | root/pass |     | Upp  |
| - ETH       | 0E4374 |            | None      | word      |     | er   |
Shel
f
| 10.10.65.62 | 002704 | Digi EX12 | Loopback: | admin/P@ | A0PZMR | Shel |
| ----------- | ------ | --------- | --------- | -------- | ------ | ---- |
| - 2/WAN     | 4166EF |           | Port 1    | ssword11 | V8WCV  | f    |
X2
| 10.10.65.63 |        | Windows XP   |           | Zach/test |     | Des  |
| ----------- | ------ | ------------ | --------- | --------- | --- | ---- |
|             |        | Test Machine |           |           |     | k    |
| 10.10.65.64 | 00409D | Connect ES 8 | Loopback: | root/dbps |     | Shel |
| - ETH       | AE0D07 |              | Port 4    |           |     | f    |
Digi RPM 10:
Port 1
10.10.65.65 00409D Digi One SP Loopback: root/dbps NZX4FB Shel
| - ETH | CE0B21 |     | Port 1 |     | D9T8E9 | f   |
| ----- | ------ | --- | ------ | --- | ------ | --- |
10.10.65.66 00409D ConnectPort Loopback: root/dbps DQSXEY Shel
| - ETH       | CE6DB2  | TS 8 MEI  | Port 1    |          | 2F2SRJ | f    |
| ----------- | ------- | --------- | --------- | -------- | ------ | ---- |
| 10.10.65.67 | 0040FF1 | TX54 Dual | Loopback: | admin/P@ | AW3HJ7 | Upp  |
| -           | 14D70   | Cellular  | None      | ssword11 | TQGBY4 | er   |
| WAN/ETH1    |         |           |           |          |        | Shel |
Wi-Fi Hot
f
Spot is setup.
PSK for AP
WR54_AWUS
B+ is ‘Broken
Tacoʼ
| 10.10.65.68 | 0040FF | TX64 LTE-A     | Loopback: | admin/P@ | CDGDC | Upp  |
| ----------- | ------ | -------------- | --------- | -------- | ----- | ---- |
| -           | 810E40 | Dual Cellular, | None      | ssword11 | MRXMT | er   |
| WAN/ETH1    |        | Dual Wi-Fi     |           |          | VR    | Shel |
f
This document is confidential Page 7 of 13

| 10.10.65.69 | 00409D | AXON 1 port |           | admin/DT |        | Shel |
| ----------- | ------ | ----------- | --------- | -------- | ------ | ---- |
| - ETH       | 601523 | device      |           | Sadmin   |        | f    |
| 10.10.65.70 | 00409D | EX50-2      | Loopback: | admin/P@ | 27R8WZ | Shel |
| - 1/WAN     | E106E5 |             | None      | ssword11 | RHQ242 | f    |
| 10.10.65.71 | 002704 | IX20W       | Loopback: | admin/P@ | MFFEJ5 | Shel |
| -           | 432943 |             | None      | ssword11 | AEG1BE | f    |
WAN/ETH1
| 10.10.65.72 | 00409D | Digi EX50 | Loopback: | admin/P@ | YE4QNT | Shel |
| ----------- | ------ | --------- | --------- | -------- | ------ | ---- |
| - 1/WAN     | DE26B5 |           | None      | ssword11 | JRGPN9 | f    |
10.10.65.73 0004F3 IX10 w/Cat 6 Loopback: admin/P@ JXBCYN Shel
| - ETH | 4606A9 | CBRS | Port 1 | ssword11 | 5N72FE | f   |
| ----- | ------ | ---- | ------ | -------- | ------ | --- |
w/SIMs.
The 2 CBRS
SIM cards in
the device
will only work
if Engineering
has their APs
powered on
upstairs, and
if they have
an internet
connection
on them to
provide the
IX10 with
internet
access.
| 10.10.65.74 | 0040FF | AnywhereUS | Manager     | admin/P@ | 34B643 | Rac |
| ----------- | ------ | ---------- | ----------- | -------- | ------ | --- |
| - ETH       | 825A18 | B 8 Plus   | Port: 18574 | ssword11 | FQKC2X | k A |
w/Wi-Fi
USB:
Flashdrive
Port 1
This document is confidential Page 8 of 13

Wi-Fi Access:
https://10.10.6
5.67:9001
NOTE: Also
use above IP
for testing
Manager over
Wi-Fi
10.10.65.75 0040FF AnywhereUS Manager admin/P@ 9R7QRP Rac
- ETH 2 825948 B 24 Plus Port: 18575 ssword11 ETK4P3 k B
w/Wi-Fi (this is not
10.10.67.24
the default
- SFP 1
port)
USB: Hub
Port 1
USB: Mouse
Port 2
USB:
Flashdrive
Port 24
Wi-Fi Access:
https://10.10.6
5.67:9000
NOTE: Also
use above IP
for testing
Manager over
Wi-Fi
Digi RPM 8 -
Port 1
10.10.65.76 0004F3 Connect EZ Loopback: admin/P@ PZRJSV Shel
- ETH 63E836 Mini Port 1 ssword11 XX35YW f
This document is confidential Page 9 of 13

| 10.10.65.77 | 002704 | IX20 |           | admin/P@ | Z56NAG | Shel |
| ----------- | ------ | ---- | --------- | -------- | ------ | ---- |
| - ETH 1     | 4DEDDF |      |           | ssword11 | 72616V | f    |
| 10.10.65.78 | 0004F3 | IX30 | Loopback: | admin/P@ | 54Q53G | Shel |
| - ETH 1     | 3ED322 |      | None      | ssword11 | GCNY2V | f    |
| 10.10.65.79 | 0004F3 | IX40 | Loopback: | admin/P@ | YD2XG8 | Shel |
| -           | 9AB0E3 |      | Port 1    | ssword11 | GC37W  | f    |
| WAN/ETH1    |        |      |           |          | M      |      |
10.10.65.80 0040FF Connect EZ 8 Loopback: admin/P@ 2ZRDK9 Rac
| - ETH 1     | 8305A8 | MEI | Port 1     | ssword11 | M539XQ | k A |
| ----------- | ------ | --- | ---------- | -------- | ------ | --- |
| 10.10.67.25 |        |     | USB:       |          |        |     |
| - SFP 1     |        |     | Flashdrive |          |        |     |
Port 1
| 10.10.65.81 | 0040FF | Connect EZ | Loopback: | admin/P@ | P76PBE | Rac |
| ----------- | ------ | ---------- | --------- | -------- | ------ | --- |
| - ETH 2     | 830D10 | 16 MEI     | Port 1    | ssword11 | NM3AV7 | k A |
USB:
Flashdrive
Port 1
| 10.10.65.82 | 0040FF | Connect EZ | Loopback:       | admin/P@ | J9W9JH | Rac |
| ----------- | ------ | ---------- | --------------- | -------- | ------ | --- |
| - ETH 1     | 830CF8 | 32         | Port 1, Ports 3 | ssword11 | TQWED7 | k A |
& 4 looped to
10.10.67.21 -
each other
SFP 1
w/cable
USB:
Flashdrive
Port 1
10.10.65.83 0040FF Connect IT NOTE:  A Digi admin/P@ GR33QB Rac
| - ETH 1 | 830798 | 48  | RPM 8 is | ssword11 | C5PT6B | k B |
| ------- | ------ | --- | -------- | -------- | ------ | --- |
connected to
10.10.67.22
serial port 1.
- SFP 1
Power
Controller
Outlets for
RPM 8:
This document is confidential Page 10 of 13

Port 1:
AWUSB/24+
Port 2:
AWUSB/24
Port 3: CP TS
16
Port 4: CP TS
16 MEI
Port 5:
CEZ/32 MEI
Port 6:
CIT/48
NOTE 2: A
Digi RPM 10
is connected
to serial port
48.
Power
Controller
Outlets for
RPM 10:
Port 1:
Connect ES
Port 2: CIT
Mini
NOTE 3:
Serial port 3
is connected
to serial port
3 of the CEZ
32 MEI
(10.10.65.84)
NOTE 4:
Loopback:
Serial ports 2,
4, & 6
This document is confidential Page 11 of 13

Digi RPM 8:
Port 6
| 10.10.65.84 | 0040FF | Connect EZ | NOTE:     | admin/P@ | C8NNYA | Rac |
| ----------- | ------ | ---------- | --------- | -------- | ------ | --- |
| - ETH 1     | 83A7A0 | 32 MEI     | Loopback: | ssword11 | 557TZM | k B |
Serial ports 1
10.10.67.23
& 2
- SFP 1
NOTE 2:
Serial port 3
is connected
to serial port
3 of the CIT
48
(10.10.65.83)
USB:
Flashdrive
Port 2
Digi RPM 8:
Port 5
10.10.65.85 0040FF Digi Connect Loopback: admin/P@ 7M6RBC Shel
| - ETH       | 86A3CC | EZ 8 TS | Ports 1 & 2 | ssword11 | NJ4CBK | f    |
| ----------- | ------ | ------- | ----------- | -------- | ------ | ---- |
| 10.10.65.88 | 00409D | TX40    | Loopback:   | admin/P@ | V4AEVH | Shel |
| -           | E3439E |         | Port 1      | ssword11 | DY7XRB | f    |
WAN/ETH1
10.10.65.89 0004F3 AnywhereUS Flashdrive: admin/P@ C5EJAP Shel
| - ETH       | 611B52 | B/2 Plus  | Port 1 | ssword11 | Y5A3QE | f    |
| ----------- | ------ | --------- | ------ | -------- | ------ | ---- |
| 10.10.65.90 | 0004F3 | Digi CTK- |        | admin/P@ | P86PDR | Shel |
| - ETH       | 7BB283 | Z4550A2M  |        | ssword11 | GHJ6DV | f    |
(S220700003
2, MC7455)
| 10.10.65.91 | 0004F3 | Digi CTK- |     | admin/P@ | AX6PZV | Shel |
| ----------- | ------ | --------- | --- | -------- | ------ | ---- |
| - ETH       | 8F1F7D | Z4500A2X  |     | ssword11 | NTHBBX | f    |
(S220800013
6, ETH)
This document is confidential Page 12 of 13

| Unplugged, | 2486F4 | Ctek CTK- |     | admin/P@ | ctek | Des |
| ---------- | ------ | --------- | --- | -------- | ---- | --- |
| DHCP Svr   | 00494C | Z4550A2W  |     | ssword11 |      | k   |
(220300490
cannot be
2, Wi-Fi)
disabled.
10.10.65.93 0040FF: Connect EZ 4 Loopback: admin/P@ M3XZZ9 Shel
| - ETH 2 | 85598C | PoE | Port 1 | ssword11 | J5AGZN | f   |
| ------- | ------ | --- | ------ | -------- | ------ | --- |
Using PoE for
power
10.10.65.94 0040FF Connect EZ 8 Loopback: admin/P@ CJNWT5 Shel
| - ETH 1 | 830500 |     | Port 1 | ssword11 | 5V7SRG | f   |
| ------- | ------ | --- | ------ | -------- | ------ | --- |
USB:
Flashdrive
Port 1
| 10.10.65.95 | 0004F3 | IX30-2 | Loopback: | admin/P@ | PC4J3D | Shel |
| ----------- | ------ | ------ | --------- | -------- | ------ | ---- |
| - ETH 2     | B58A7A |        | None      | ssword11 | XT472Z | f    |
10.10.65.96 002704 Connect IT 4 Loopback: admin/P@ root/J5R Shel
| - LAN | 373663 |     | Port 1 | ssword11 | J6SC1E | f   |
| ----- | ------ | --- | ------ | -------- | ------ | --- |
MQT
| 10.10.65.210 |     | FS SFP+ |     | Ask       |     | Rac |
| ------------ | --- | ------- | --- | --------- | --- | --- |
|              |     | Switch  |     | Zach/Scot |     | k A |
10.10.67.42
t if you
| GW -       |     |     |     | need   |     |     |
| ---------- | --- | --- | --- | ------ | --- | --- |
| 10.10.67.1 |     |     |     | access |     |     |
PC -
10.10.67.40
Cisco -
10.10.67.11
This document is confidential Page 13 of 13
