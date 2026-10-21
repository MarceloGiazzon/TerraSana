# AgBot OpenSource - Technical Specifications & Hardware Architecture
**Project:** Autonomous Agricultural Ecosystem (Linha 30 - Caxias do Sul / RS)  
**System Architecture:** Multi-Agent System (AgBot Ground Worker + Infodrone Scout + AgHub AC Central Dock)  
**Document Version:** 2.1 (Expanded with Mushroom Module 07, Drone Aerial Mist Payload, and 16m² Chamber Plan)

---

## 1. System Overview & Multi-Agent Architecture

The ecosystem operates as a distributed multi-agent system (MAS) configured for intensive agroecological production, lawn management, orchard monitoring, and mushroom cultivation across $10,200\text{ m}^2$ of vegetable plots, $2,000\text{ m}^2$ of lawn, $600\text{ m}^2$ of humid forest (log cultivation), and a $16\text{ m}^2$ indoor mushroom chamber.

```
                            ┌─────────────────────────────────┐
                            │    AgHub AC (Central Station)   │
                            │  220V Grid / Raspberry Pi 5     │
                            └────────────────┬────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌─────────────────────────┐                 ┌─────────────────────────┐
          │  AgBot (Ground Worker)  │ ◄── ESP-NOW ──► │ Infodrone (Air Scout)   │
          │  RTK / 4x4 / Modules 1-7│    / Wi-Fi 6    │ F405 / Camera / Mist    │
          └─────────────────────────┘                 └─────────────────────────┘
```

---

## 2. Full Bill of Materials (BOM) & Component Costs

### 2.1 AgBot Core (Ground Worker Unit)

| Subsystem | Component Description | Specifications | Qty | Cost (BRL) | Purpose / Explanation |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Chassis & Frame** | Custom Aluminum 6061-T6 + Stainless Steel Joints | Modular 800mm x 600mm chassis, IP65 sealed electronics bay. | 1 | R$ 2,800.00 | Provides structural rigidity and corrosion resistance against wet soil and compost. |
| **Drivetrain** | 24V DC Planetary Gear Motors (250W each) | High-torque 1:60 ratio, integrated quadrature encoders (1024 CPR). | 4 | R$ 3,200.00 | Delivers 4x4 differential drive capability across muddy terrain and steep inclines. |
| **Motor Drivers** | Dual SmartDrive SDS2440 or Sabertooth 2x60A | 60A continuous output per channel with regenerative braking and overcurrent protection. | 2 | R$ 1,600.00 | Controls traction motors via PWM/UART with closed-loop speed regulation. |
| **Main Processing** | Teensy 4.1 + ESP32-S3 Dual MCU Board | Teensy (Cortex-M7 @ 600MHz) for real-time control; ESP32-S3 for Wi-Fi/BLE & CAN. | 1 | R$ 650.00 | Low-level motor control, safety watchdog, sensor fusion, and wireless telemetry. |
| **Navigation & RTK** | u-blox ZED-F9P Multi-Band GNSS Receiver | Centimeter-level RTK GNSS + Helical High-Gain Antenna (L1/L2). | 1 | R$ 1,800.00 | Provides 1cm to 2cm positioning accuracy for autonomous row navigation without fences. |
| **IMU & Attitude** | BNO085 9-DOF System-in-Package | Integrated accelerometer, gyroscope, magnetometer with onboard sensor fusion. | 1 | R$ 220.00 | Maintains orientation, pitch, roll, and dead-reckoning when GNSS signals are occluded. |
| **Power System** | LiFePO4 Battery Pack 24V 30Ah | 8S LiFePO4 cells with 60A Smart BMS (Bluetooth telemetry). | 1 | R$ 2,600.00 | Provides 2.5 to 4 hours of continuous operation per charge cycle. |
| **Safety & Obstacles** | Ultrasonic Transducers + Solid-State LiDaR | 4x Waterproof Ultrasonic Sensors (AJ-SR04M) + Benewake TF-Luna LiDaR. | 1 | R$ 780.00 | Emergency braking, close-range collision avoidance, and cliff detection. |
| **Module Coupling** | Quick-Latch Magnetic & CAN Interface | Heavy-duty quick release pins, 24V power bus bar, and 4-pin CAN bus socket. | 1 | R$ 850.00 | Enables tool-less swapping of Modules 01 through 07 in under 60 seconds. |
| **SUBTOTAL (AGBOT CORE)** | | | | **R$ 14,500.00** | |

---

### 2.2 Infodrone (Aerial Scout Unit)

| Component | Specifications | Qty | Cost (BRL) | Purpose / Explanation |
| :--- | :--- | :---: | :---: | :--- |
| **Frame** | 7-inch Carbon Fiber Quadcopter Frame (330mm wheel base) | 1 | R$ 420.00 | Lightweight, durable frame capable of carrying payload and surviving forest conditions. |
| **Flight Controller** | SpeedyBee F405 V3 30x30 Stack | 1 | R$ 680.00 | Runs ArduPilot / PX4 firmware for autonomous waypoints and precision landing. |
| **Motors & ESCs** | 2807 1300KV Brushless Motors + 50A 4-in-1 ESC | 4 | R$ 1,100.00 | High-thrust configuration capable of lifting a 1.5kg payload. |
| **Sensors & Vision** | OAK-D Lite Spatial AI Camera (RGB + Stereo Depth) | 1 | R$ 1,450.00 | Onboard neural network processing for NDVI estimation and thermal hotspot alignment. |
| **Telemetry & GPS** | M10-5883 GNSS + Compass Module + ESP32 Wi-Fi Telemetry | 1 | R$ 380.00 | Precise positioning and high-speed data transmission to AgHub and AgBot. |
| **Power** | 4S LiPo Battery 5200mAh 80C (Set of 2) | 2 | R$ 820.00 | Provides 18–22 minutes of scouting flight time per pack. |
| **Forest Payload** | Mini Aerial Mist Dispenser (1.5L Tank + 12V Micro Pump + Nozzle) | 1 | R$ 1,950.00 | Borne payload for spraying micro-droplets on Shiitake logs in dense 600m² forest areas. |
| **SUBTOTAL (INFODRONE)** | | | **R$ 6,800.00** | |

---

### 2.3 AgHub AC (Central Grid Station)

| Component | Specifications | Qty | Cost (BRL) | Purpose / Explanation |
| :--- | :--- | :---: | :---: | :--- |
| **Main Power Supply** | Mean Well 24V 40A 1000W Industrial PFC Power Supply | 1 | R$ 650.00 | Converts 110V/220V grid AC power to stable 24V DC for chargers and docks. |
| **AC Protection** | NEMA IP65 Box + DIN Circuit Breakers (16A) + Class II Surge DPS | 1 | R$ 350.00 | Protects base station and docking units from grid voltage spikes and lightning. |
| **RTK Base Station** | u-blox ZED-F9P Base Kit + High Precision GNSS Survey Antenna | 1 | R$ 1,800.00 | Broadcasts RTCM3 correction data via LoRa/Wi-Fi to AgBot and Infodrone. |
| **Edge Server** | Raspberry Pi 5 (8GB RAM) + 512GB NVMe SSD + UPS HAT | 1 | R$ 1,200.00 | Runs ROS2 master node, Home Assistant, local AI processing, and mission queues. |
| **Wireless Gateway** | Outdoor Wi-Fi 6 AP + SX1302 915MHz LoRaWAN Gateway | 1 | R$ 1,100.00 | Provides full wireless telemetry coverage across the entire 12,200m² area. |
| **Water Supply Node** | 500L Buffer Tank + Float Valve + 12V High-Flow Transfer Pump | 1 | R$ 1,100.00 | Automated refilling station for AgBot Module 05 (Irrigation) and Module 07. |
| **Silos & Dispensers** | 2x 20L Cronic Silos + NEMA23 Stepper Motor Augers + Load Cells | 2 | R$ 1,400.00 | Automated dispensing of seeds, organic fertilizers, and mycelium substrates. |
| **Drone Docking Nest** | Retractable Roof Enclosure + Contact Charging Plates + Actuator | 1 | R$ 1,500.00 | Weather-proof housing and automatic contact charging for the Infodrone. |
| **AgBot Docking Station**| Mechanical Alignment Funnels + Copper Contact Charging Strip | 1 | R$ 900.00 | Guides AgBot to charge secondary/tertiary batteries and refill liquid tanks. |
| **Enclosure Housing** | Powder-Coated Aluminum IP65 Cabinet | 1 | R$ 1,500.00 | Houses edge server, power electronics, and charging bays outdoors safely. |
| **SUBTOTAL (AGHUB AC)** | | | **R$ 11,500.00** | |

---

### 2.4 AgBot Attachments & Modules (01 to 07)

| Module ID | Module Name | Core Components | Cost (BRL) |
| :---: | :--- | :--- | :---: |
| **Module 01** | **Lawn Mower Deck** | Dual 24V 150W brushless motors, 450mm stainless steel cutting blade, height actuator. | R$ 2,200.00 |
| **Module 02** | **Precision Seeder** | Micro stepper motor auger, seed vacuum pickup head, furrowing shoe, press wheel. | R$ 2,400.00 |
| **Module 03** | **Soil Probe & Sensor** | Motorized Linear Actuator, Modbus RS485 NPK + pH + Moisture 7-in-1 soil probe. | R$ 1,800.00 |
| **Module 04** | **Patrol & Security** | 360° PTZ Thermal FLIR Lepton 3.5 Camera + 50W LED Searchlight + Siren. | R$ 3,100.00 |
| **Module 05** | **Localized Irrigator** | 20L Polypropylene Tank, 12V Diaphragm Pump, Electro-solenoid nozzle array. | R$ 3,700.00 |
| **Module 06** | **Robotic Harvester** | 5-DOF Articulated Robotic Arm, Soft Silicone Gripper, OAK-D Pro Depth Camera. | R$ 8,500.00 |
| **Module 07** | **Mushroom Handler** | Ultrasonic Fogging Head, $CO_2$/Temp/Humidity Sensor Suite, 2-Tier Tray Lift. | R$ 1,200.00 |
| **TOTAL (ALL MODULES 01-07)** | | | **R$ 22,900.00** |

---

## 3. Module 07 Specification: Mushroom Handler & Environmental Sensor

Module 07 is engineered to integrate indoor gourmet mushroom cultivation (Shimeji, Paris, Portobello) and log-grown Shiitake monitoring into the AgBot platform.

```
                    ┌──────────────────────────────────────────┐
                    │    Module 07 - Structural Schematic     │
                    └──────────────────────────────────────────┘
                    │ [Ultrasonic Fogger]  [CO2/Temp/RH Sensor]│
                    │ ┌──────────────────────────────────────┐ │
                    │ │ Top Tray: Harvest Box Support        │ │
                    │ ├──────────────────────────────────────┤ │
                    │ │ Bottom Tray: Substrate Block Carrier │ │
                    │ └──────────────────────────────────────┘ │
                    │ [24V Linear Lift] [CAN Bus Interface]    │
                    └──────────────────────────────────────────┘
```

### 3.1 Electronic & Mechanical Subsystems

1. **Environmental Sensing Array**:
   * **$CO_2$ Sensor**: NDIR Sensor (SenseAir S8 / SCD30), range 0–10,000 ppm. Critical for monitoring mushroom fruiting vs. vegetative phases.
   * **Temperature & Humidity**: Sensirion SHT45 (IP67 filter cap) delivering $\pm 1.0\%$ RH and $\pm 0.1^\circ\text{C}$ accuracy.
2. **Micro-Fogging System**:
   * Piezoelectric 24V Ultrasonic Atomizer Transducer generating 1.5–3.0 micron water droplets.
   * 5L onboard water reservoir connected to AgBot’s auxiliary water port.
3. **Substrate Block & Tray Lift Mechanism**:
   * Motorized vertical scissor lift (24V 100mm/s linear actuator) with a dual-tray holder.
   * **Payload Capacity**: Up to 25 kg (holds 10x 2.5kg substrate blocks or 4 harvest crates).
4. **Firmware Communication Protocol (CAN-Bus ID: `0x07`)**:
   * Broadcasts telemetry data at 1Hz (`CO2_PPM`, `TEMP_C`, `HUMIDITY_RH`, `TRAY_ELEVATION_MM`, `FOGGER_STATE`).

---

## 4. Aerial Drone Mist Payload for 600m² Forest Shiitake Cultivation

Due to the irregular topography and dense understory of the $600\text{ m}^2$ natural forest area, physical ground access by the AgBot is limited. The Infodrone utilizes a quick-release aerial spraying payload to service Shiitake logs.

### 4.1 Payload Specifications & Spraying Mechanism
* **Tank Volume**: 1.5 Liters of ultra-pure water/nutrient solution.
* **Pump**: 12V DC Micro-Diaphragm Pump (1.2 L/min, 4 bar pressure).
* **Nozzle Array**: Dual Brass Anti-Drip Atomizing Nozzles mounted on an extended carbon fiber boom extending 25cm below the props to avoid prop-wash distortion.
* **Targeting System**: The Infodrone hovers 1.2 meters above mapped Shiitake log piles using its optical flow sensor and down-facing LiDAR, releasing a 10-second targeted mist cycle per pile.

---

## 5. Structural Layout: 16m² Indoor Mushroom Chamber (2m x 8m Plan)

The $16\text{ m}^2$ facility (2.0m width $\times$ 8.0m length $\times$ 2.4m height) is configured with an incline ramp to allow the AgBot to enter, sense microclimates, humidify, and transport harvested trays.

```
+-----------------------------------------------------------------------------------+
|  [Ramp In]  ▲                                                                     |
|  =======>   │  <------------------ 1.0m Central Aisle ----------------->          |
|  (Width 2m) │                                                                     |
|             ▼                                                                     |
| +-------------------------+                       +-----------------------------+ |
| | Shelf Unit A (4 Tiers)  |                       | Shelf Unit B (4 Tiers)      | |
| | Length: 6.5m            |                       | Length: 6.5m                | |
| | Depth:  0.5m            |                       | Depth:  0.5m                | |
| | Holds: 180 Blocks       |                       | Holds: 180 Blocks           | |
| +-------------------------+                       +-----------------------------+ |
|                                                                                   |
| [Fresh Air HEPA Inflow]                           [Exhaust Fan + CO2 Dump]        |
+-----------------------------------------------------------------------------------+
                                   <--- 8.0m --->
```

### 5.1 Environmental Controls
* **Walls/Ceiling**: 50mm PIR (Polyisocyanurate) Insulated Sandwich Panels.
* **Air Exchange**: Variable speed intake fan with HEPA H13 filtration + lower exhaust duct connected to a automated $CO_2$ relief damper controlled via AgHub.
* **Ramp Access**: 12° slope non-slip rubberized aluminum ramp (0.8m clear width) compatible with AgBot’s track wheelbase.

---

## 6. Assembly Complexity, Timeline & AI Guided Workflow

Assembly is designed to be accessible to non-specialists through a vision-guided AI assistant.

### 6.1 Assembly Matrix & Time Estimates

| Subsystem | Assembly Time | Difficulty Level (1 to 5) | Required Tools |
| :--- | :---: | :---: | :--- |
| **AgBot Base Frame & Drivetrain** | 6 - 8 hours | Level 2 (Easy) | Allen Key Set, Wrenches (8-13mm), Wire Stripper. |
| **Electronics Wiring & MCUs** | 4 - 5 hours | Level 3 (Moderate) | Soldering Iron (optional), Crimping Tool, Cable Ties. |
| **AgHub AC Base Station** | 5 - 6 hours | Level 2 (Easy) | Drill, Screwdrivers, Wall Mount Anchors. |
| **Infodrone Frame & Electronics**| 3 - 4 hours | Level 3 (Moderate) | Hex Drivers (1.5-2.5mm), Soldering Iron. |
| **Modules 01 - 05** | 2 hours each | Level 1 (Very Easy) | Screw Drivers, Quick-Latch Assembly. |
| **Module 06 (Harvester Arm)** | 4 - 5 hours | Level 4 (Advanced) | Calipers, Precision Screwdrivers. |
| **Module 07 (Mushroom)** | 2 - 3 hours | Level 2 (Easy) | Allen Keys, Hose Clamp Pliers. |
| **TOTAL ASSEMBLY TIME** | **~32 - 38 hours** | **Average: Level 2.3** | Basic Hand Tool Kit (Included in BOM). |

---

### 6.2 AI Camera-Guided Assembly & Self-Diagnostic Protocol

```
┌────────────────────────┐      Video Stream       ┌────────────────────────┐
│ User Assembly Table    │ ──────────────────────► │ AI Vision Server (VLM) │
│ Component + Smartphone │                         │ Segment Anything + YOLO│
└────────────────────────┘                         └───────────┬────────────┘
            ▲                                                  │
            │              Voice & Visual Overlay              │
            └──────────────────────────────────────────────────┘
```

1. **AI Vision Guidance Process**:
   * The builder places components on a flat surface and points a smartphone/webcam at the workspace.
   * A Vision-Language Model (VLM) running on the AgHub server identifies the parts using real-time segmentation.
   * The AI speaks step-by-step instructions (e.g., *"Pick up Motor Driver board A and connect the red 24V wire to terminal 1"*), highlighting the correct terminal with an augmented reality overlay on the screen.

2. **Automated Self-Diagnostic Auto-Check (Post-Assembly)**:
   * Once a subsystem is wired and powered on, the ESP32/Teensy controller initiates an internal self-test (`POST` - Power-On Self Test) over the CAN-Bus:

```cpp
// Internal Self-Diagnostic Sequence Example
void runAutoCheck() {
    bool canStatus     = checkCANBusInterface();     // Verify ID response
    bool imuStatus     = checkBNO085Ping();          // Verify I2C address 0x4A
    bool rtkStatus     = checkUbloxSerial();         // Verify UART @ 230400 bps
    float batteryVolt  = readBMSVoltage();           // Ensure 24V nominal
    
    if(canStatus && imuStatus && rtkStatus && (batteryVolt > 22.0)) {
        playBuzzerSuccessTone();
        sendMQTTAck("AGBOT_READY");
    } else {
        triggerDiagnosticLED(ERROR_CODE_WIRING);
    }
}
```

---

## 7. Global Financial Balance & Return on Investment (ROI)

### 7.1 Capital Expenditure (Capex)

| Category | Cost (BRL) |
| :--- | :---: |
| AgBot Core 4x4 Ground Worker | R$ 14,500.00 |
| Infodrone Aerial Scout + Forest Mist Payload | R$ 6,800.00 |
| AgHub AC Central Dock Station | R$ 11,500.00 |
| Attachments & Modules 01 through 06 | R$ 21,700.00 |
| Module 07 (Mushroom Handler) | R$ 1,200.00 |
| Mushroom Chamber 16m² Conversion Kit | R$ 3,800.00 |
| 2x Buffer Water Tanks (1000L Each) | R$ 1,800.00 |
| Juicing & Processing Kitchen Equipment (1L Fresh Juices) | R$ 6,380.00 |
| **TOTAL CAPEX INVESTMENT** | **R$ 67,680.00** |

---

### 7.2 Monthly Financial Statement (DRE) - 300 Organic Subscription Boxes

| Line Item | Monthly Amount (BRL) | Annual Amount (BRL) |
| :--- | :---: | :---: |
| **Gross Revenue (Boxes, Delivery Fees, Juices, Mushrooms)** | **R$ 43,750.00** | **R$ 525,000.00** |
| (-) Box Packaging, Glass Bottles & Bio-Bags | (R$ 3,042.00) | (R$ 36,504.00) |
| (-) Delivery Logistics (Gasoline + Maintenance) | (R$ 743.40) | (R$ 8,920.80) |
| (-) Crop, Substrate & Mycelium Inputs | (R$ 2,550.00) | (R$ 30,600.00) |
| (-) Energy, Water & Connectivity | (R$ 550.00) | (R$ 6,600.00) |
| (-) Digital Marketing & Instagram Meta Ads | (R$ 800.00) | (R$ 9,600.00) |
| (-) System Hardware Maintenance Reserve | (R$ 1,273.00) | (R$ 15,276.00) |
| **TOTAL OPERATING COSTS (OPEX)** | **(R$ 8,958.40)** | **(R$ 107,500.80)** |
| **NET MONTHLY PROFIT** | **R$ 34,791.60** | **R$ 417,499.20** |

$$\text{Payback Period} = \frac{\text{Capex (R\$ 67,680.00)}}{\text{Net Monthly Profit (R\$ 34,791.60)}} \approx \mathbf{1.95 \text{ months}}$$

All hardware costs are fully amortized in under **2 months of operation** while supplying 100% of organic produce requirements for 8 residents and generating over R$ 34k in monthly net income.
