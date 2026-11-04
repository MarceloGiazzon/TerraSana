# AgBot OpenSource - Especificações Técnicas e Arquitetura de Hardware
**Projeto:** Ecossistema Agrícola Autônomo (Linha 30 - Caxias do Sul / RS)  
**Arquitetura do sistema:** Sistema Multiagente (AgBot de solo + Infodrone de reconhecimento + Estação Central AgHub AC)  
**Versão do documento:** 2.1 (ampliada com o Módulo 07 de cogumelos, a carga de nebulização aérea do drone e a planta da câmara de 16 m²)

---

## 1. Visão geral e arquitetura multiagente

O ecossistema opera como um sistema multiagente (SMA) distribuído, configurado para produção agroecológica intensiva, manejo de gramado, monitoramento de pomar e cultivo de cogumelos em $10.200\text{ m}^2$ de canteiros de hortaliças, $2.000\text{ m}^2$ de gramado, $600\text{ m}^2$ de mata úmida (cultivo em toras) e uma câmara interna de cogumelos de $16\text{ m}^2$.

```
                            ┌─────────────────────────────────┐
                            │  AgHub AC (Estação Central)     │
                            │  Rede 220V / Raspberry Pi 5     │
                            └────────────────┬────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌─────────────────────────┐                 ┌─────────────────────────┐
          │  AgBot (Robô de solo)   │ ◄── ESP-NOW ──► │ Infodrone (Aéreo)       │
          │  RTK / 4x4 / Módulos 1-7│    / Wi-Fi 6    │ F405 / Câmera / Névoa   │
          └─────────────────────────┘                 └─────────────────────────┘
```

---

## 2. Lista completa de materiais (BOM) e custos

### 2.1 Núcleo do AgBot (unidade de solo)

| Subsistema | Componente | Especificações | Qtd | Custo (R$) | Finalidade |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Chassi e estrutura** | Alumínio 6061-T6 sob medida + juntas de aço inox | Chassi modular de 800 mm x 600 mm, compartimento eletrônico vedado IP65. | 1 | R$ 2.800,00 | Garante rigidez estrutural e resistência à corrosão por solo úmido e composto. |
| **Tração** | Motorredutores planetários 24V CC (250 W cada) | Alto torque, redução 1:60, encoders em quadratura integrados (1024 CPR). | 4 | R$ 3.200,00 | Tração diferencial 4x4 em terreno enlameado e aclives acentuados. |
| **Drivers de motor** | Dual SmartDrive SDS2440 ou Sabertooth 2x60A | 60 A contínuos por canal, com frenagem regenerativa e proteção contra sobrecorrente. | 2 | R$ 1.600,00 | Controla os motores de tração via PWM/UART com regulação de velocidade em malha fechada. |
| **Processamento principal** | Placa dual MCU Teensy 4.1 + ESP32-S3 | Teensy (Cortex-M7 a 600 MHz) para controle em tempo real; ESP32-S3 para Wi-Fi/BLE e CAN. | 1 | R$ 650,00 | Controle de motores, watchdog de segurança, fusão de sensores e telemetria sem fio. |
| **Navegação e RTK** | Receptor GNSS multibanda u-blox ZED-F9P | GNSS RTK com precisão centimétrica + antena helicoidal de alto ganho (L1/L2). | 1 | R$ 1.800,00 | Posicionamento com precisão de 1 a 2 cm para navegar entre as linhas sem cercas. |
| **IMU e atitude** | BNO085 9-DOF System-in-Package | Acelerômetro, giroscópio e magnetômetro com fusão de sensores embarcada. | 1 | R$ 220,00 | Mantém orientação, arfagem, rolagem e navegação estimada quando o sinal GNSS é obstruído. |
| **Energia** | Bateria LiFePO4 24V 30Ah | Células LiFePO4 8S com BMS inteligente de 60 A (telemetria Bluetooth). | 1 | R$ 2.600,00 | De 2,5 a 4 horas de operação contínua por ciclo de carga. |
| **Segurança e obstáculos** | Transdutores ultrassônicos + LiDAR de estado sólido | 4 sensores ultrassônicos à prova d'água (AJ-SR04M) + LiDAR Benewake TF-Luna. | 1 | R$ 780,00 | Frenagem de emergência, desvio de colisões a curta distância e detecção de desníveis. |
| **Acoplamento de módulos** | Engate rápido magnético e interface CAN | Pinos de liberação rápida reforçados, barramento de energia 24V e soquete CAN de 4 pinos. | 1 | R$ 850,00 | Troca dos Módulos 01 a 07 sem ferramentas, em menos de 60 segundos. |
| **SUBTOTAL (NÚCLEO AGBOT)** | | | | **R$ 14.500,00** | |

---

### 2.2 Infodrone (unidade aérea de reconhecimento)

| Componente | Especificações | Qtd | Custo (R$) | Finalidade |
| :--- | :--- | :---: | :---: | :--- |
| **Estrutura** | Quadricóptero de fibra de carbono 7 polegadas (entre-eixos de 330 mm) | 1 | R$ 420,00 | Estrutura leve e resistente, capaz de levar carga e suportar as condições da mata. |
| **Controladora de voo** | Stack SpeedyBee F405 V3 30x30 | 1 | R$ 680,00 | Roda firmware ArduPilot / PX4 para rotas autônomas e pouso de precisão. |
| **Motores e ESCs** | Motores brushless 2807 1300KV + ESC 4 em 1 de 50 A | 4 | R$ 1.100,00 | Configuração de alto empuxo, capaz de erguer 1,5 kg de carga. |
| **Sensores e visão** | Câmera OAK-D Lite Spatial AI (RGB + profundidade estéreo) | 1 | R$ 1.450,00 | Rede neural embarcada para estimativa de NDVI e alinhamento de pontos térmicos. |
| **Telemetria e GPS** | GNSS M10-5883 + bússola + telemetria Wi-Fi ESP32 | 1 | R$ 380,00 | Posicionamento preciso e transmissão de dados em alta velocidade para o AgHub e o AgBot. |
| **Energia** | Bateria LiPo 4S 5200 mAh 80C (par) | 2 | R$ 820,00 | De 18 a 22 minutos de voo de reconhecimento por bateria. |
| **Carga para a mata** | Mini nebulizador aéreo (tanque de 1,5 L + microbomba 12V + bico) | 1 | R$ 1.950,00 | Carga embarcada para borrifar microgotas nas toras de shiitake na área de mata densa de 600 m². |
| **SUBTOTAL (INFODRONE)** | | | **R$ 6.800,00** | |

---

### 2.3 AgHub AC (estação central ligada à rede)

| Componente | Especificações | Qtd | Custo (R$) | Finalidade |
| :--- | :--- | :---: | :---: | :--- |
| **Fonte principal** | Fonte industrial Mean Well 24V 40A 1000W com PFC | 1 | R$ 650,00 | Converte a rede de 110V/220V CA em 24V CC estável para carregadores e docas. |
| **Proteção CA** | Caixa NEMA IP65 + disjuntores DIN (16 A) + DPS classe II | 1 | R$ 350,00 | Protege a estação e as docas contra picos de tensão e descargas atmosféricas. |
| **Base RTK** | Kit base u-blox ZED-F9P + antena GNSS geodésica de alta precisão | 1 | R$ 1.800,00 | Transmite correções RTCM3 via LoRa/Wi-Fi para o AgBot e o Infodrone. |
| **Servidor de borda** | Raspberry Pi 5 (8 GB RAM) + SSD NVMe de 512 GB + HAT de nobreak | 1 | R$ 1.200,00 | Roda o nó mestre ROS2, Home Assistant, processamento local de IA e filas de missões. |
| **Gateway sem fio** | AP Wi-Fi 6 externo + gateway LoRaWAN SX1302 915 MHz | 1 | R$ 1.100,00 | Cobertura completa de telemetria sem fio em toda a área de 12.200 m². |
| **Ponto de água** | Reservatório pulmão de 500 L + boia + bomba de transferência 12V de alta vazão | 1 | R$ 1.100,00 | Estação de reabastecimento automático do Módulo 05 (Irrigação) e do Módulo 07. |
| **Silos e dosadores** | 2 silos de 20 L + roscas sem fim com motor de passo NEMA23 + células de carga | 2 | R$ 1.400,00 | Dosagem automática de sementes, adubos orgânicos e substratos com micélio. |
| **Ninho do drone** | Abrigo com teto retrátil + placas de carga por contato + atuador | 1 | R$ 1.500,00 | Abrigo contra intempéries e recarga automática por contato do Infodrone. |
| **Doca do AgBot**| Funis mecânicos de alinhamento + trilho de contato de cobre | 1 | R$ 900,00 | Guia o AgBot para carregar as baterias e reabastecer os tanques de líquido. |
| **Gabinete** | Gabinete de alumínio IP65 com pintura eletrostática | 1 | R$ 1.500,00 | Abriga ao ar livre, com segurança, o servidor, a eletrônica de potência e as baias de carga. |
| **SUBTOTAL (AGHUB AC)** | | | **R$ 11.500,00** | |

---

### 2.4 Implementos e módulos do AgBot (01 a 07)

| Módulo | Nome | Componentes principais | Custo (R$) |
| :---: | :--- | :--- | :---: |
| **Módulo 01** | **Roçadeira de gramado** | Dois motores brushless 24V 150W, lâmina de corte inox de 450 mm, atuador de altura. | R$ 2.200,00 |
| **Módulo 02** | **Semeadora de precisão** | Rosca dosadora com micromotor de passo, cabeçote de sucção de sementes, sulcador e roda compactadora. | R$ 2.400,00 |
| **Módulo 03** | **Sonda e sensor de solo** | Atuador linear motorizado, sonda de solo 7 em 1 Modbus RS485 (NPK + pH + umidade). | R$ 1.800,00 |
| **Módulo 04** | **Patrulha e segurança** | Câmera térmica PTZ 360° FLIR Lepton 3.5 + holofote LED de 50 W + sirene. | R$ 3.100,00 |
| **Módulo 05** | **Irrigador localizado** | Tanque de polipropileno de 20 L, bomba de diafragma 12V, conjunto de bicos com eletroválvula. | R$ 3.700,00 |
| **Módulo 06** | **Colhedor robótico** | Braço robótico articulado de 5 graus de liberdade, garra de silicone macio, câmera de profundidade OAK-D Pro. | R$ 8.500,00 |
| **Módulo 07** | **Manejo de cogumelos** | Nebulizador ultrassônico, conjunto de sensores de $CO_2$/temperatura/umidade, elevador de bandejas de 2 níveis. | R$ 1.200,00 |
| **TOTAL (MÓDULOS 01-07)** | | | **R$ 22.900,00** |

---

## 3. Especificação do Módulo 07: manejo de cogumelos e sensoriamento ambiental

O Módulo 07 foi projetado para integrar à plataforma AgBot o cultivo interno de cogumelos gourmet (shimeji, paris, portobello) e o monitoramento do shiitake cultivado em toras.

```
                    ┌──────────────────────────────────────────┐
                    │    Módulo 07 - Esquema estrutural        │
                    └──────────────────────────────────────────┘
                    │ [Nebulizador ultra.] [Sensor CO2/T/UR]   │
                    │ ┌──────────────────────────────────────┐ │
                    │ │ Bandeja superior: caixas de colheita │ │
                    │ ├──────────────────────────────────────┤ │
                    │ │ Bandeja inferior: blocos de substrato│ │
                    │ └──────────────────────────────────────┘ │
                    │ [Elevador linear 24V] [Interface CAN]    │
                    └──────────────────────────────────────────┘
```

### 3.1 Subsistemas eletrônicos e mecânicos

1. **Conjunto de sensoriamento ambiental**:
   * **Sensor de $CO_2$**: sensor NDIR (SenseAir S8 / SCD30), faixa de 0 a 10.000 ppm. Essencial para distinguir as fases de frutificação e vegetativa dos cogumelos.
   * **Temperatura e umidade**: Sensirion SHT45 (tampa com filtro IP67), com precisão de $\pm 1{,}0\%$ UR e $\pm 0{,}1^\circ\text{C}$.
2. **Sistema de micronebulização**:
   * Transdutor atomizador ultrassônico piezoelétrico 24V, que gera gotas de 1,5 a 3,0 mícrons.
   * Reservatório embarcado de 5 L conectado à porta auxiliar de água do AgBot.
3. **Mecanismo de elevação de bandejas e blocos de substrato**:
   * Elevador pantográfico vertical motorizado (atuador linear 24V, 100 mm/s) com suporte para duas bandejas.
   * **Capacidade de carga**: até 25 kg (10 blocos de substrato de 2,5 kg ou 4 caixas de colheita).
4. **Protocolo de comunicação do firmware (ID CAN-Bus: `0x07`)**:
   * Transmite telemetria a 1 Hz (`CO2_PPM`, `TEMP_C`, `HUMIDITY_RH`, `TRAY_ELEVATION_MM`, `FOGGER_STATE`).

---

## 4. Carga de nebulização aérea do drone para o shiitake na mata de 600 m²

Por causa da topografia irregular e do sub-bosque denso da mata nativa de $600\text{ m}^2$, o acesso do AgBot por terra é limitado. O Infodrone usa uma carga de pulverização aérea de engate rápido para atender as toras de shiitake.

### 4.1 Especificações da carga e mecanismo de pulverização
* **Volume do tanque**: 1,5 litro de água ultrapura ou solução nutritiva.
* **Bomba**: microbomba de diafragma 12V CC (1,2 L/min, 4 bar de pressão).
* **Bicos**: dois bicos atomizadores antigotejamento de latão, montados numa haste de fibra de carbono que se estende 25 cm abaixo das hélices para evitar a distorção causada pelo fluxo de ar.
* **Sistema de mira**: o Infodrone paira a 1,2 metro acima das pilhas de toras de shiitake mapeadas, usando o sensor de fluxo óptico e o LiDAR voltado para baixo, e libera um ciclo de névoa direcionado de 10 segundos por pilha.

---

## 5. Planta estrutural: câmara interna de cogumelos de 16 m² (planta de 2 m x 8 m)

A instalação de $16\text{ m}^2$ (2,0 m de largura $\times$ 8,0 m de comprimento $\times$ 2,4 m de altura) tem uma rampa de acesso para que o AgBot possa entrar, medir microclimas, umidificar e transportar as bandejas colhidas.

```
+-----------------------------------------------------------------------------------+
|  [Rampa]    ▲                                                                     |
|  =======>   │  <------------------ Corredor central de 1,0 m ----------->         |
|  (Larg. 2m) │                                                                     |
|             ▼                                                                     |
| +-------------------------+                       +-----------------------------+ |
| | Estante A (4 níveis)    |                       | Estante B (4 níveis)        | |
| | Comprimento: 6,5 m      |                       | Comprimento: 6,5 m          | |
| | Profundidade: 0,5 m     |                       | Profundidade: 0,5 m         | |
| | Capacidade: 180 blocos  |                       | Capacidade: 180 blocos      | |
| +-------------------------+                       +-----------------------------+ |
|                                                                                   |
| [Entrada de ar com HEPA]                          [Exaustor + alívio de CO2]      |
+-----------------------------------------------------------------------------------+
                                   <--- 8,0 m --->
```

### 5.1 Controle ambiental
* **Paredes e teto**: painéis sanduíche isolantes de PIR (poli-isocianurato) de 50 mm.
* **Troca de ar**: ventilador de admissão com velocidade variável e filtragem HEPA H13 + duto de exaustão inferior ligado a um damper automático de alívio de $CO_2$ controlado pelo AgHub.
* **Rampa de acesso**: rampa de alumínio emborrachado antiderrapante com 12° de inclinação (0,8 m de largura livre), compatível com a bitola do AgBot.

---

## 6. Complexidade de montagem, cronograma e montagem guiada por IA

A montagem foi pensada para ser acessível a não especialistas, com a ajuda de um assistente de IA guiado por visão.

### 6.1 Matriz de montagem e estimativas de tempo

| Subsistema | Tempo de montagem | Dificuldade (1 a 5) | Ferramentas necessárias |
| :--- | :---: | :---: | :--- |
| **Estrutura e tração do AgBot** | 6 a 8 horas | Nível 2 (fácil) | Jogo de chaves Allen, chaves de boca (8-13 mm), desencapador de fios. |
| **Fiação eletrônica e MCUs** | 4 a 5 horas | Nível 3 (moderado) | Ferro de solda (opcional), alicate de crimpagem, abraçadeiras. |
| **Estação AgHub AC** | 5 a 6 horas | Nível 2 (fácil) | Furadeira, chaves de fenda, buchas de fixação. |
| **Estrutura e eletrônica do Infodrone**| 3 a 4 horas | Nível 3 (moderado) | Chaves hexagonais (1,5-2,5 mm), ferro de solda. |
| **Módulos 01 a 05** | 2 horas cada | Nível 1 (muito fácil) | Chaves de fenda, montagem do engate rápido. |
| **Módulo 06 (braço colhedor)** | 4 a 5 horas | Nível 4 (avançado) | Paquímetro, chaves de precisão. |
| **Módulo 07 (cogumelos)** | 2 a 3 horas | Nível 2 (fácil) | Chaves Allen, alicate para abraçadeira de mangueira. |
| **TEMPO TOTAL DE MONTAGEM** | **~32 a 38 horas** | **Média: nível 2,3** | Kit básico de ferramentas manuais (incluso na BOM). |

---

### 6.2 Montagem guiada por câmera com IA e protocolo de autodiagnóstico

```
┌────────────────────────┐    Transmissão de vídeo ┌────────────────────────┐
│ Bancada de montagem    │ ──────────────────────► │ Servidor de visão (VLM)│
│ Componente + celular   │                         │ Segment Anything + YOLO│
└────────────────────────┘                         └───────────┬────────────┘
            ▲                                                  │
            │          Instruções por voz e sobreposição       │
            └──────────────────────────────────────────────────┘
```

1. **Processo de orientação por visão computacional**:
   * O montador coloca os componentes sobre uma superfície plana e aponta um celular ou webcam para a bancada.
   * Um modelo de visão e linguagem (VLM) rodando no servidor AgHub identifica as peças com segmentação em tempo real.
   * A IA dita as instruções passo a passo (por exemplo, *"Pegue a placa do driver de motor A e ligue o fio vermelho de 24V no borne 1"*), destacando o borne correto com uma sobreposição de realidade aumentada na tela.

2. **Autodiagnóstico automático (após a montagem)**:
   * Quando um subsistema é ligado e energizado, o controlador ESP32/Teensy inicia um autoteste interno (`POST` - Power-On Self Test) pelo CAN-Bus:

```cpp
// Exemplo da sequência interna de autodiagnóstico
void runAutoCheck() {
    bool canStatus     = checkCANBusInterface();     // Verifica a resposta do ID
    bool imuStatus     = checkBNO085Ping();          // Verifica o endereço I2C 0x4A
    bool rtkStatus     = checkUbloxSerial();         // Verifica a UART a 230400 bps
    float batteryVolt  = readBMSVoltage();           // Garante 24V nominais
    
    if(canStatus && imuStatus && rtkStatus && (batteryVolt > 22.0)) {
        playBuzzerSuccessTone();
        sendMQTTAck("AGBOT_READY");
    } else {
        triggerDiagnosticLED(ERROR_CODE_WIRING);
    }
}
```

---

## 7. Balanço financeiro geral e retorno sobre o investimento (ROI)

### 7.1 Investimento de capital (Capex)

| Categoria | Custo (R$) |
| :--- | :---: |
| Núcleo do AgBot 4x4 (robô de solo) | R$ 14.500,00 |
| Infodrone de reconhecimento + carga de nebulização para a mata | R$ 6.800,00 |
| Estação central AgHub AC | R$ 11.500,00 |
| Implementos e Módulos 01 a 06 | R$ 21.700,00 |
| Módulo 07 (manejo de cogumelos) | R$ 1.200,00 |
| Kit de adaptação da câmara de cogumelos de 16 m² | R$ 3.800,00 |
| 2 reservatórios pulmão de água (1000 L cada) | R$ 1.800,00 |
| Equipamentos de cozinha para sucos e processamento (sucos frescos de 1 L) | R$ 6.380,00 |
| **INVESTIMENTO TOTAL (CAPEX)** | **R$ 67.680,00** |

---

### 7.2 Demonstrativo de resultado mensal (DRE) - 300 cestas orgânicas por assinatura

| Item | Valor mensal (R$) | Valor anual (R$) |
| :--- | :---: | :---: |
| **Receita bruta (cestas, taxas de entrega, sucos, cogumelos)** | **R$ 43.750,00** | **R$ 525.000,00** |
| (-) Embalagens das cestas, garrafas de vidro e sacolas biodegradáveis | (R$ 3.042,00) | (R$ 36.504,00) |
| (-) Logística de entrega (combustível + manutenção) | (R$ 743,40) | (R$ 8.920,80) |
| (-) Insumos de cultivo, substrato e micélio | (R$ 2.550,00) | (R$ 30.600,00) |
| (-) Energia, água e conectividade | (R$ 550,00) | (R$ 6.600,00) |
| (-) Marketing digital e anúncios no Instagram (Meta Ads) | (R$ 800,00) | (R$ 9.600,00) |
| (-) Reserva para manutenção do hardware | (R$ 1.273,00) | (R$ 15.276,00) |
| **CUSTO OPERACIONAL TOTAL (OPEX)** | **(R$ 8.958,40)** | **(R$ 107.500,80)** |
| **LUCRO LÍQUIDO MENSAL** | **R$ 34.791,60** | **R$ 417.499,20** |

$$\text{Payback} = \frac{\text{Capex (R\$ 67.680,00)}}{\text{Lucro líquido mensal (R\$ 34.791,60)}} \approx \mathbf{1{,}95 \text{ mês}}$$

Todo o custo de hardware é amortizado em menos de **2 meses de operação**, enquanto o sistema supre 100% da demanda de hortifrúti orgânico de 8 moradores e gera mais de R$ 34 mil de lucro líquido por mês.
