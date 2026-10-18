# PLANO DIRETOR E ESPECIFICAÇÃO DE PROJETO: AGBOT
## Ecossistema Robótico Solar, Open-Source e Plataforma Cooperativa para a Agricultura Familiar

---

## SUMÁRIO EXECUTIVO

O **Projeto AgBot** representa uma mudança de paradigma na mecanização e gestão da agricultura de pequena e média escala, agroecológica e de assentamentos rurais. Trata-se de um ecossistema integrado que combina:

1. **Hardware Robótico Aberto (Open Hardware):** Um veículo terrestre autônomo sobre esteiras, movido a energia solar e baterias de lítio-ferro-fosfato ($\text{LiFePO}_4$), de construção modular e de alta reparabilidade local.
2. **Scout Aéreo e Doca Inteligente:** Um drone autônomo e uma central de comunicação/recarga local ($\text{AgHub}$) com capacidade de processamento na borda (*Edge AI*) e base $\text{RTK-GNSS}$ centimétrica.
3. **Módulos Operacionais Intercambiáveis:** Um conjunto de 7 ferramentas plug-and-play para roçada, plantio, análise de solo, controle bioacústico/laser, irrigação cirúrgica, colheita robótica e climatização de estufas.
4. **Plataforma Social e Comercial em Rede:** Um aplicativo cooperativo baseado em Aprendizado Federado (*Federated Learning*) que orquestra a produção consorciada entre pequenos produtores e operacionaliza a distribuição direta de "Caixas Família Compartilhadas" ao consumidor final.

---

## 1. PERSPECTIVA TÉCNICA E ARQUITETURA DE ENGENHARIA

### 1.1 Arquitetura Mecânica e Mecatrônica do AgBot Base

O veículo terrestre ($\text{AgBot}$) foi dimensionado para operar em terrenos acidentados, solos úmidos e de baixa aderência, minimizando a compactação do solo e garantindo tração constante.

```
                     ARQUITETURA DE FONTES DE ENERGIA E TRAÇÃO
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Painel Solar Fotovoltaico Monocristalino Flexible 200W (Teto Ajustável)      │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ MPPT Solar Charge Controller 24V
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Pack de Baterias LiFePO4 24V 50Ah com Smart BMS (CAN / RS485 Bus)           │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ 24V DC Direct Bus
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Driver Duplo Roboteq / Sabertooth IP66 (2x 60A Contínuo com Regeneração)     │
  └──────────┬──────────────────────────────────────────────────────┬───────────┘
             │ Motor Izq (24V 800W)                                 │ Motor Der (24V 800W)
             ▼                                                      ▼
  ┌──────────────────────────────┐                       ┌──────────────────────────────┐
  │ Redutor Planetário (1:50)    │                       │ Redutor Planetário (1:50)    │
  │ + Esteira de Borracha Esquerda│                      │ + Esteira de Borracha Direita│
  └──────────────────────────────┘                       └──────────────────────────────┘
```

* **Estrutura e Chassi:** Construído em alumínio estrutural naval 6061-T6 com corte a laser e dobra CNC, conferindo resistência mecânica contra torção e redução de massa morta.
* **Sistema de Rodagem:** Esteiras contínuas de borracha vulcanizada reforçada com malha de aço interna. Rodas motoras e guias usinadas em polietileno de ultra alto peso molecular ($\text{UHMW-PE}$), imunes à corrosão por adubos e ácidos orgânicos.
* **Propulsão Elétrica:** Dois motores Brushless ($\text{BLDC}$) de $24\text{V}$ / $800\text{W}$ com acoplamento direto a redutores planetários industriais de estágio duplo com relação de redução $1:50$, gerando torque elevado em baixas rotações (até $120\text{ Nm}$ por esteira).
* **Gestão Energética e Alimentação:**
  * Painel solar fotovoltaico monocristalino flexível de $200\text{Wp}$ montado no topo do veículo com inclinação ajustável.
  * Controlador de carga de alta eficiência $\text{MPPT}$ ($98\%$ de eficiência).
  * Banco de baterias $\text{LiFePO}_4$ de $24\text{V} / 50\text{Ah}$ ($1,2\text{ kWh}$ nominais), garantindo mais de 3.500 ciclos de carga e descarga sem perda severa de capacidade.
* **Grau de Proteção e Vedações:** Caixas de controle herméticas metálicas com classificação $\text{IP67}$, passagem de cabos via prensa-cabos de latão niquelado e chicote elétrico industrial com conectores padrão automotivo $\text{Deutsch DT}$.

### 1.2 Módulos Operacionais Intercambiáveis (Kit de 7 Módulos)

O AgBot possui um mecanismo de engate rápido padronizado mecânico (trilho de fixação rápida com trava pneumática/manual) e elétrico (barramento de potência $24\text{V}$ e sinal $\text{CAN-Bus}$).

```
                  SISTEMA DE ENGATE RÁPIDO DE MÓDULOS (BARRAMENTO)
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ CHASSI AGBOT BASE (Interface Universal Mecânica & CAN-Bus / 24V DC Power)   │
  └───────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┘
          │ Módulo 01   │ Módulo 02   │ Módulo 03   │ Módulo 04   │ ... Módulo 07
          ▼             ▼             ▼             ▼             ▼
  ┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
  │ Roçador /   ││ Semeadora / ││ Análise de  ││ Patrulha &  ││ Climatiza-  │
  │ Cortador    ││ Adubadeira  ││ Solo Profun.││ Laser Fauna ││ ção Estufa  │
  └─────────────┘└─────────────┘└─────────────┘└─────────────┘└─────────────┘
```

1. **Módulo 01: Roçador e Manejo de Plantas de Cobertura**
   * Motor $\text{BLDC}$ de $500\text{W}$ estanque.
   * Disco de corte duplo usinado com lâminas flutuantes intercambiáveis em aço temperado.
   * Regulagem de altura de corte automatizada por atuador elétrico linear ($30\text{mm}$ a $150\text{mm}$).
2. **Módulo 02: Semeadora e Adubadeira de Precisão**
   * Dosador volumétrico acionado por motor de passo de alta precisão.
   * Disco dosador trocável para diferentes diâmetros de sementes (milho, feijão, hortaliças).
   * Sulcador de disco duplo com compactador traseiro ajustável.
3. **Módulo 03: Sensor Penetrômetro e Análise Multissensorial de Solo**
   * Haste penetradora em aço inox 316 com atuador de pressão constante.
   * Sensor industrial RS485 Modbus integrando medição de NPK (Nitrogênio, Fósforo e Potássio), $\text{pH}$, Condutividade Elétrica ($\text{EC}$), Umidade Relativa e Temperatura do solo.
4. **Módulo 04: Disuasor Laser e Guardião de Fauna/Pragas**
   * Diodo laser verde de comprimento de onda $\lambda = 532\text{nm}$ de classe 3B com varredura oscilante automatizada para afugentar aves e roedores sem danos físicos.
   * Emissor bioacústico com alto-falante ultra-sônico estanque ($\text{IP66}$) para emissão de frequências moduladas contra insetos nocivos.
5. **Módulo 05: Irrigador e Pulverizador Micro-Localizado**
   * Bomba de diafragma de alta pressão ($24\text{V}$, $100\text{ PSI}$).
   * Tanque de $60\text{ litros}$ em Polietileno de Alta Densidade ($\text{PEAD}$) rotomoldado.
   * Barra de pulverização ajustável com bicos antideriva e válvulas solenoides individuais acionadas por visão computacional (aplicação apenas sobre a planta-alvo).
6. **Módulo 06: Braço Robótico Articulado 5-DOF para Colheita**
   * Estrutura em alumínio aeronáutico anodizado com 5 graus de liberdade ($\text{DOF}$).
   * Servomotores industriais sem escovas com enconders absolutos.
   * Garra adaptativa com dedos de silicone de grau alimentício e atuador a vácuo suave.
   * Câmera stereo RGB-D Luxonis OAK-D Pro acoplada ao efetuador final.
7. **Módulo 07: Climatizador e Monitor de Estufas e Fungicultura**
   * Sensores de $\text{CO}_2$ por infravermelho não dispersivo ($\text{NDIR}$), sensor de temperatura e umidade de alta precisão SHT40.
   * Nebulizador ultrassônico industrial em aço inox para regulação instantânea de umidade em cultivo de cogumelos e hortaliças delicadas.

### 1.3 Infodrone (Scout Aéreo) e Central AgHub

```
                       ECOSSISTEMA TRIPLE-NODE (AR-TERRA-DOCA)
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                             INFODRONE (Scout Aéreo)                         │
  │ • Mapeamento Multiespectral RGB/Depth   • Cobertura Rápida de Hectares      │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Wi-Fi 6 / Telemetria LoRa 915 MHz
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                        AGHUB CENTRAL & DOCA DE APOIO                        │
  │ • Base GNSS RTK Zentimétrica            • Servidor Edge AI (Raspberry Pi 5) │
  │ • Doca Solar de Carga Automática IP65    • Gateway de Comunicação da Fazenda │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ LoRaWAN / Redes Locais Mesh
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                              AGBOT (Veículo Terrestre)                      │
  │ • Execução de Tarefas Pesadas           • Precisão Centimétrica via RTK     │
  └─────────────────────────────────────────────────────────────────────────────┘
```

* **Infodrone (Unidade de Reconhecimento):**
  * Multirrotor quadricóptero compacto baseado no ecossistema open-source $\text{ArduPilot} / \text{Pixhawk}$.
  * Câmera inteligente OAK-D Lite com processamento local em $4\text{K}$ e mapa de profundidade em tempo real.
  * Bateria de íon-lítio de alta densidade fornecendo autonomia de voo de até 28 minutos.
  * Função de levantamento fotogramétrico automatizado e geração de mapas NDVI/RGB antes da saída do robô terrestre.
* **AgHub (Central Fixa e Doca de Carga):**
  * Gabinete metálico com proteção $\text{IP65}$, contendo trilhos de carregamento condutivo por contato para o AgBot e base de atracamento para o drone.
  * **Servidor Edge AI:** Raspberry Pi 5 ($8\text{GB}\text{ RAM}$) acoplado a um SSD NVMe de alta velocidade e acelerador neural Coral TPU ou Hailo-8.
  * **Estação Base RTK:** Módulo u-blox ZED-F9P gerando correções diferenciais de GPS/GNSS ($\text{RTCM3}$) via rádio LoRa $915\text{ MHz}$, garantindo precisão de navegação centimétrica ($< 2\text{ cm}$) para o AgBot e Infodrone sem dependência de internet móvel.

### 1.4 Software de Borda, Navegação e Algoritmos de Visão

O software interno do robô é estruturado sobre o **ROS 2 (Robot Operating System 2 - versão Jazzy/Humble)** rodando em Linux Ubuntu Server RT (Real-Time Kernel).

```
                      ARQUITETURA DE SOFTWARE E PILHA ROS 2
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                            ROS 2 APPLICATION LAYER                          │
  │  • Nav2 (Navegação Autônoma)          • Lifecycle Nodes (Gestão de Estado) │
  │  • Behavior Trees (Tomada de Decisão) • YOLOv8 Detection & Mapping Engine  │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ DDS (Data Distribution Service)
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         HARDWARE ABSTRACTION LAYER                          │
  │  • Micro-ROS em ESP32 (Atuadores/CAN) • Driver u-blox RTK GNSS (NMEA/RTCM) │
  │  • Drivers OAK-D Stereo Camera       • Modbus Master Driver (Sensores)      │
  └─────────────────────────────────────────────────────────────────────────────┘
```

* **Navegação e Planejamento de Trajetória:**
  * Uso do pacote **Nav2** e algoritmos $\text{SLAM}$ (Simultaneous Localization and Mapping) visuais e baseados em odometria de esteiras e IMU de 9 eixos.
  * Mapeamento de rotas em malha com contorno de obstáculos dinâmicos (animais, cercas, rochas e operadores).
* **Visão Computacional na Borda:**
  * Redes neurais leves da família **YOLOv8/YOLOv10** convertidas para formato TensorRT/OpenVINO rodando na câmera inteligente OAK-D.
  * Identificação instantânea de ervas daninhas, classificação de maturidade de frutos (escala de cor RGB e volume 3D) e detecção de pragas foliares.

---

## 2. PERSPECTIVA SOCIAL, AMBIENTAL E DE SOBERANIA

### 2.1 A Escolha Open-Source: Soberania Tecnológica e "Reparabilidade na Roça"

O agronegócio corporativo impõe um modelo de dependência tecnológica extrema através de criptografia de peças, softwares fechados e proibição de reparos independentes (*Right to Repair*). O Projeto AgBot rompe frontalmente com esta lógica.

```
                      MATRIZ COMPARATIVA DE REPARABILIDADE
  ┌───────────────────────────────┬─────────────────────────────────────────────┐
  │ PARÂMETRO                     │ AGBOT OPEN-SOURCE                           │
  ├───────────────────────────────┼─────────────────────────────────────────────┤
  │ Esquemáticos e Projetos       │ 100% Públicos (KiCAD / CAD FreeCAD)         │
  │ Peças de Reposição            │ Componentes Industriais Padrão Off-the-shelf│
  │ Reparo do Software            │ ROS 2 / Python / Micro-ROS Aberto           │
  │ Local de Manutenção           │ Oficina da Cooperativa ou Mecânico Local    │
  │ Custo Médio de Manutenção     │ Redução de até 80% em relação aos proprietários│
  └───────────────────────────────┴─────────────────────────────────────────────┘
```

* **Reparabilidade Local Instantânea:** Todas as peças mecânicas foram desenhadas para usinagem simples ou corte a laser comum. Componentes eletrônicos usam padrões amplamente difundidos no mercado industrial ($\text{CAN-Bus}$, $\text{RS485}$, rolamentos e retentores padrão $\text{ISO}$).
* **Empoderamento Comunitário:** Institutos Federais ($\text{IFs}$), Universidades Regionais e Escolas Agrícolas tornam-se polos de fabricação, customização e manutenção dos AgBots, gerando conhecimento científico e técnico no próprio território rural.

### 2.2 Sucessão Familiar e Inversão da Pirâmide Demográfica Rural

O envelhecimento da população no campo e o êxodo rural juvenil são alimentados pela penosidade do trabalho braçal sem acesso a tecnologias modernas.

* **Revalorização do Trabalho Agrícola:** O AgBot altera o papel do jovem no campo: de executor de esforço físico repetitivo e prejudicial à saúde (como a capina manual sob sol forte ou o transporte de cargas pesadas) para **Gestor e Operador de Sistemas Robóticos**.
* **Inclusão Digital Aplicada:** A interface amigável do sistema permite programar missões de campo através de tablets ou smartphones com poucos toques, unindo saberes tradicionais da terra com tecnologia de ponta.

### 2.3 Agroecologia, Mitigação Climática e Bioeconomia

* **Balanço Negativo de Carbono:** Ao substituir tratores e roçadeiras a combustão (diesel/gasolina) por tração solar-elétrica direta, o AgBot elimina a emissão de CO2 e fuligem na propriedade.
* **Eliminação de Defensivos Químicos Nocivos:** O manejo mecânico cirúrgico de plantas concorrentes aliado ao combate fotofísico (luz UV/Laser) permite que pequenos produtores realizem a transição agroecológica completa, obtendo certificação orgânica de maior valor agregado.

---

## 3. PERSPECTIVA COMERCIAL, MODELO DE NEGÓCIOS E ESCALA

### 3.1 Modelo de Negócios Triplo

```
                         ESTRUTURA DO MODELO DE NEGÓCIOS
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                             MODELO DE NEGÓCIOS                              │
  ├─────────────────────────────┬──────────────────────────────┬────────────────┤
  │ 1. HARDWARE E KITS          │ 2. AGBOT-AS-A-SERVICE        │ 3. PLATAFORMA  │
  │    Venda de Robôs, Docas    │    Aluguel de Frotas para   │    Comercializ.│
  │    e Módulos (Margem 44%)   │    Manejo Sazonal Comunit.   │    de Caixas   │
  └─────────────────────────────┴──────────────────────────────┴────────────────┘
```

1. **Venda de Hardware e Kits Físicos:**
   * Comercialização direta de unidades motrizes e pacotes de módulos para produtores individuais, cooperativas e órgãos governamentais de desenvolvimento agrária.
2. **Modelo AgBot-as-a-Service ($\text{AaaS}$):**
   * Locação temporária de frotas comunitárias gerenciadas por cooperativas locais. O pequeno agricultor contrata apenas os dias de trabalho necessários para roçada, plantio ou colheita, pagando uma taxa proporcional por hectare ou por dia.
3. **Plataforma de Comercialização e Gestão da Produção Consorciada:**
   * Taxa de intermediação e inteligência logística sobre as vendas de cestas orgânicas e produtos agrícolas entregues diretamente aos consumidores urbanos.

### 3.2 Tabela Detalhada de Componentes e Custos (Bill of Materials - BOM)

Abaixo apresenta-se o levantamento detalhado do custo direto de fabricação industrial para cada componente do ecossistema.

#### A. AgBot Base (Unidade Motriz Terrestre)
| Item | Descrição Técnica e Industrial | Qtd | Custo Unit. (R$) | Custo Total (R$) |
| :--- | :--- | :---: | :---: | :---: |
| A1 | Chassi Alumínio Naval 6061-T6 (Corte Laser + Solda TIG) | 1 | R$ 3.800,00 | R$ 3.800,00 |
| A2 | Conjunto de Esteiras de Borracha Vulcanizada e Rodas UHMW | 1 | R$ 3.400,00 | R$ 3.400,00 |
| A3 | Motores BLDC 24V 800W + Redutores Planetários 1:50 | 2 | R$ 1.450,00 | R$ 2.900,00 |
| A4 | Driver Duplo Roboteq / Sabertooth 2x60A IP66 | 1 | R$ 1.850,00 | R$ 1.850,00 |
| A5 | Bateria LiFePO4 24V 50Ah Smart BMS Integrado | 1 | R$ 3.200,00 | R$ 3.200,00 |
| A6 | Painel Solar Flexível 200W + MPPT Charge Controller | 1 | R$ 1.100,00 | R$ 1.100,00 |
| A7 | Módulo GNSS u-blox ZED-F9P RTK + Antena Helicial | 1 | R$ 1.450,00 | R$ 1.450,00 |
| A8 | Caixa Hermética IP67 + Chicote Elétrico Deutsch DT | 1 | R$ 1.100,00 | R$ 1.100,00 |
| **SUB**| **Subtotal AgBot Base** | | | **R$ 18.800,00** |

#### B. Infodrone & AgHub Base Local
| Item | Descrição Técnica e Industrial | Qtd | Custo Unit. (R$) | Custo Total (R$) |
| :--- | :--- | :---: | :---: | :---: |
| B1 | Frame Carbono 3K + Motores IP54 + ArduPilot Pixhawk | 1 | R$ 4.200,00 | R$ 4.200,00 |
| B2 | Câmera OAK-D Lite + Baterias LiPo 4S High Discharge | 1 | R$ 2.600,00 | R$ 2.600,00 |
| B3 | Doca AgHub (Gabinete Aço Epóxi + Contactores IP67) | 1 | R$ 4.280,00 | R$ 4.280,00 |
| B4 | Servidor Raspberry Pi 5 8GB + SSD NVMe + Rádio LoRa RTK Base | 1 | R$ 3.900,00 | R$ 3.900,00 |
| **SUB**| **Subtotal Infodrone & AgHub Base** | | | **R$ 14.980,00** |

#### C. Kit Completo dos 7 Módulos Operacionais
| Módulo | Especificação Principal dos Componentes | Custo Total (R$) |
| :--- | :--- | :---: |
| M01 | Motor BLDC 500W estanque + Disco usinado com lâminas temperadas | R$ 2.200,00 |
| M02 | Servos IP67 + Dosador volumétrico acrílico + Sulcador disco duplo | R$ 1.800,00 |
| M03 | Atuador linear IP67 + Haste Inox 316 + Sensor NPK/pH/EC Modbus RS485 | R$ 1.650,00 |
| M04 | Diodo Laser 532nm + Emissor bioacústico ultrassônico IP66 | R$ 1.250,00 |
| M05 | Bomba diafragma 100 PSI + Tanque 60L PEAD + Solenoides + Barra Bicos | R$ 1.900,00 |
| M06 | Braço 5-DOF Alumínio Aeronáutico + Câmera OAK-D Pro + Garra Silicone | R$ 4.900,00 |
| M07 | Sensor CO2 NDIR + SHT40 + Nebulizador Ultrassônico Inox + Exaustor | R$ 1.450,00 |
| **SUB**| **Subtotal Kit 7 Módulos** | **R$ 15.150,00** |

#### D. Consolidação Financeira da Unidade Comercial Básica
* **Custo Direto de Fabricação (BOM) do Kit Básico (AgBot Base + Módulo 01 Roçador + Mini Doca):** $\text{R\$ } 21.280,00$
* **Preço de Venda Praticado ao Consumidor/Cooperativa:** $\text{R\$ } 38.000,00$
* **Margem Bruta Unitária:** $\text{R\$ } 16.720,00$ ($44\%$ de Margem Bruta)

### 3.3 A Rede Comercial Cooperativa: "Caixas Família Compartilhadas"

O principal entrave do pequeno agricultor familiar não é apenas produzir, mas alcançar o mercado consumidor urbano com constância, diversidade e preço justo.

```
                  FLUXO DA REDE DE "CAIXAS COMPARTILHADAS"
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │               PLATAFORMA CENTRAL DE IA DE SAFRA (Nuvem / App)              │
  │ • Planejamento do Calendário de Cultivo    • Gestão Logística de Entrega     │
  └──────────────────────┬──────────────────────────────┬───────────────────────┘
                         │                              │
                         ▼                              ▼
  ┌──────────────────────────────┐              ┌──────────────────────────────┐
  │    PRODUTOR A (Hortaliças)   │              │   PRODUTOR B (Cogumelos/Fruta)│
  │  Manejo com AgBot Módulo 01  │              │ Manejo com AgBot Módulo 07   │
  └──────────────┬───────────────┘              └──────────────┬───────────────┘
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        │
                                        ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                  PONTO DE CONSOLIDAÇÃO DA COOPERATIVA                       │
  │  • Montagem automatizada de "Caixas Família Compartilhadas" Diversificadas   │
  └─────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                 ENTREGA DIRETA AO CONSUMIDOR FINAL URBANO                   │
  └─────────────────────────────────────────────────────────────────────────────┘
```

1. **Planejamento de Safra Unificado via IA:** O aplicativo da plataforma analisa a demanda dos clientes urbanos cadastrados e distribui as metas de plantio entre os produtores membros da rede.
2. **Especialização com Ganhos de Escala:** Em vez de cada agricultor tentar produzir dezenas de itens com baixa eficiência, o Produtor A foca em hortaliças folhosas, o Produtor B em raízes e o Produtor C em cogumelos/frutas, todos utilizando módulos AgBot apropriados.
3. **Consolidação Logística Transparente:** O robô registra a estimativa exata de colheita. Os produtos são recolhidos pela cooperativa e consolidados em cestas variadas.
4. **Rateio Automático via Contrato Inteligente:** Quando o consumidor paga pela caixa no aplicativo, o valor é distribuído instantaneamente entre os produtores de acordo com a proporção exata de alimento fornecido.

### 3.4 Estratégia de Captação e Financiamento

```
                         ESTRUTURA DE FINANCIAMENTO
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 1. SUBVENÇÃO ECONÔMICA (A Fundo Perdido)                                     │
  │    • FINEP, Tecnova III RS, Embrapii (R$ 150k a R$ 400k para P&D)            │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ 2. CRÉDITO SUBSIDIADO COM TRAVA DE RECEBÍVEIS                               │
  │    • PRONAF Bioeconomia / Mais Alimentos / BNDES Fundo Clima (2,5% a 5% a.a.)│
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ 3. RECEITA OPERACIONAL E VENDA DE KITS                                      │
  │    • Venda de Caixas, Locação AaaS e Venda de Hardware Comercial            │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. CRONOGRAMA DE IMPLEMENTAÇÃO E ROADMAP DE DESENVOLVIMENTO

O plano de ação está dividido em 3 fases estratégicas ao longo de 24 meses:

```
                            ROADMAP DE EXECUÇÃO (24 MESES)
  01-06M: FASE 1 ──────► Prototipagem IP67, Testes de Campo e Validação ROS 2
  07-12M: FASE 2 ──────► Homologação Open-Source, Liberação CAD e Piloto Cooperativo
  13-24M: FASE 3 ──────► Produção Comercial em Escala e Expansão da Plataforma
```

### Fase 1: Prototipagem Avançada e Validação Mecatrônica (Meses 01 a 06)
* Consolidação do protótipo físico IP67 do AgBot Base e dos primeiros 3 módulos operacionais (M01 Roça, M02 Semeadura, M05 Pulverização).
* Testes severos de tração e estabilidade em declives na Região da Serra Gaúcha.
* Integração da pilha ROS 2 Nav2 com correções centimétricas via RTK GNSS.

### Fase 2: Homologação Open-Source e Projeto Piloto em Cooperativa (Meses 07 a 12)
* Publicação oficial dos repositórios GitHub do firmware, schematics no KiCAD e modelos CAD industriais sob licenças GPLv3 / CERN-OHL.
* Implantação de uma unidade do ecossistema completo (Infodrone + AgHub + AgBot + 7 Módulos) em um assentamento ou cooperativa agrícola modelo.
* Validação dos algoritmos de Aprendizado Federado para detecção local de pragas.

### Fase 3: Escala Regional e Operação Comercial da Plataforma (Meses 13 a 24)
* Início da montagem em lote do Kit Comercial AgBot (30 unidades iniciais) em parceria com Institutos Federais e oficinas credenciadas.
* Lançamento oficial do aplicativo de comercialização de "Caixas Família Compartilhadas".
* Abertura de linhas de financiamento subsidiado via PRONAF Bioeconomia com trava de recebíveis na plataforma.

---

## 5. CONCLUSÃO

O **Projeto AgBot** não é apenas uma máquina agrícola; é um **ecossistema de emancipação social, inovação tecnológica e sustentabilidade econômica** para o campo. Ao aliar robótica avançada de baixo custo, licenças abertas, tração solar limpa e novos arranjos de distribuição em rede, o AgBot pavimenta o caminho para um novo modelo de agricultura familiar moderna, altamente produtiva, atraente para as novas gerações e ecologicamente regenerativa.