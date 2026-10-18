# ESPECIFICAÇÃO TÉCNICA E DETALHAMENTO DE MÓDULOS OPERACIONAIS: AGBOT

## DOCUMENTO DE ENGENHARIA DE DETALHAMENTO DE HARDWARE E SOFTWARE

---

## SUMÁRIO DE ARQUITETURA DE INTERFACE UNIVERSAL

Todos os módulos operacionais compartilham uma **Interface Física, Elétrica e de Comunicação Padronizada** que permite o engate e desengate rápido (*Plug-and-Play*) em menos de 3 minutos por um único operador local, sem a necessidade de ferramentas complexas.

```
                  INTERFACE PADRONIZADA DE ACOPLAMENTO AGBOT
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                      CHASSI BASE DO AGBOT (RECEPTOR)                        │
  │  • 2x Trilhos Guia de Engate Rápido em Aço Inox com Trava Mecânica Dupla     │
  │  • Conector Industrial Hermético Harting Han-Eco / Amphenol IP67            │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼ (Potência DC)                  ▼ (Sinais de Controle)           ▼ (Dados de Alta Velocidade)
  ┌──────────────────┐         ┌──────────────────┐             ┌──────────────────┐
  │ Barramento 24V DC│         │ Barramento CAN   │             │ Ethernet IP67    │
  │ (Até 50A Pico)   │         │ (CANopen / J1939)│             │ (Câmeras / Depth)│
  └──────────────────┘         └──────────────────┘             └──────────────────┘
```

* **Interface Mecânica:** Trilhos laterais em liga de alumínio usinado 6061-T6 com pinos de travamento por pressão pneumática ou alavanca mecânica rápida.
* **Interface Elétrica de Potência:** Conector de contato de alta corrente nominal $24\text{V DC}$ (suportando até $50\text{A}$ contínuos) com proteção contra inversão de polaridade.
* **Interface de Comunicação e Sensores:** 
  * Barramento **CAN-Bus 2.0B** operando a $500\text{ kbps}$ para comandos de atuadores e leitura de sensores de baixa frequência.
  * Conexão **Ethernet GigE M12 (IP67)** dedicada para transmissão de vídeo de alta definição e matrizes de pontos 3D diretamente para a unidade de processamento central da base.

---

## MÓDULO 01: ROÇADOR E MANEJO DE PLANTAS DE COBERTURA (M01-MOW)

```
                            MÓDULO 01: ROÇADOR DE PRECISÃO
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                     ESTRUTURA DE PROTEÇÃO EM AÇO INOX                       │
  │  ┌───────────────────────────────────────────────────────────────────────┐  │
  │  │ Atuador Linear de Altura (24V DC - Curso 120mm - Codificador Hall)    │  │
  │  └──────────────────────────────────┬────────────────────────────────────┘  │
  │                                     │ Ajuste Z (30mm a 150mm)               │
  │                                     ▼                                       │
  │  ┌───────────────────────────────────────────────────────────────────────┐  │
  │  │ Motor BLDC Industrial 500W IP68 com Encoder e Sensor Térmico KTY      │  │
  │  └──────────────────────────────────┬────────────────────────────────────┘  │
  │                                     │ Tração Direta / Eixo Balanceado       │
  │                                     ▼                                       │
  │  ┌───────────────────────────────────────────────────────────────────────┐  │
  │  │ Disco Duplo Anti-Torção + 4 Lâminas Flutuantes Aço 1095 Temperado       │  │
  │  └───────────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Descrição Geral e Objetivo Agroecológico
O Módulo M01 foi projetado para a roçada seletiva e o manejo de plantas de cobertura (adubação verde) sem revolvimento do solo. Ele permite cortar a vegetação rasteira mantendo a palhada sobre a terra para conservação da umidade e controle térmico do solo.

### 2. Componentes e Especificações Mecatrônicas
* **Atuador Principal de Corte:** Motor elétrico sem escovas ($\text{BLDC}$) de alta densidade de torque, $24\text{V}$, $500\text{W}$ nominais ($1200\text{W}$ de pico por até 10 segundos). Grau de vedação $\text{IP68}$.
* **Conjunto de Lâminas:** Disco duplo balanceado dinamicamente em alumínio estrutural com 4 lâminas flutuantes em aço alto carbono AISI 1095 temperado. As lâminas usam sistema de pivô retrátil que reduz danos caso atinjam pedras ou troncos rígidos.
* **Ajuste Dinâmico de Altura (Eixo Z):** Atuador linear mecânico $24\text{V DC}$ com curso de $120\text{mm}$ e sensor de efeito Hall acoplado, permitindo variação da altura de corte entre $30\text{mm}$ e $150\text{mm}$ em relação ao nível da superfície.
* **Sensores de Monitoramento Local:**
  * Sensor de corrente de efeito Hall de alta precisão (detecção de sobrecarga por enroscamento em vegetação densa).
  * Sensor de temperatura de acoplamento térmico no estator do motor ($KTY84$).
  * Encoders de rotação magnéticos integrados ($0-3000\text{ RPM}$).

### 3. Integração e Protocolos de Software (ROS 2)
* **Nó ROS 2:** `agbot_mow_node`
* **Publicação de Tópicos:**
  * `/mod01/telemetry` (`agbot_msgs/MowerTelemetry`): Envia velocidade angular ($\text{RPM}$), corrente consumida ($\text{A}$), temperatura do motor ($\text{^\circ C}$) e altura atual do corte ($\text{mm}$).
* **Subscrição de Tópicos:**
  * `/mod01/cmd_height` (`std_msgs/Float32`): Ajusta a altura da lâmina em metros.
  * `/mod01/cmd_cutter` (`std_msgs/Bool`): Liga/Desliga o motor de corte com rampeamento suave de aceleração.
* **Comportamento de Segurança:** Em caso de aumento súbito de corrente ($> 35\text{A}$ por mais de $300\text{ms}$), o nó ROS executa um recuo de emergência subindo o atuador $50\text{mm}$ e reduzindo a rotação do motor para prevenir queima do driver.

---

## MÓDULO 02: SEMEADORA E ADUBADEIRA DE PRECISÃO (M02-SEED)

```
                       MÓDULO 02: SEMEADORA DE PRECISÃO
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Reservoir Duplo Divisório (20L Sementes / 30L Adubo Granulado Organomineral) │
  └──────────────────────┬──────────────────────────────┬───────────────────────┘
                         │                              │
                         ▼                              ▼
  ┌──────────────────────────────┐              ┌──────────────────────────────┐
  │ Dosador Disco Alveolar       │              │ Dosador Carretel Helicoidal  │
  │ Motor de Passo NEMA 23 (IP65)│              │ Motor de Passo NEMA 23 (IP65)│
  └──────────────┬───────────────┘              └──────────────┬───────────────┘
                 │ Sementes / Pulso                            │ Adubo / Pulso
                 └──────────────────────┬──────────────────────┘
                                        │ Tubos Condutores Flexíveis
                                        ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Sulcador de Disco Duplo Desalinhado + Célula de Carga Carga Vertical        │
  │ + Roda Compactadora V-Shape em Borracha Autocleaner                        │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Descrição Geral e Objetivo Agroecológico
O Módulo M02 realiza o plantio direto de precisão e a adubação localizada em sulco para sementes de pequeno e médio porte (feijão, milho, hortaliças, adubos verdes). Garante a dosagem semente a semente, evitando o desperdício de insumos.

### 2. Componentes e Especificações Mecatrônicas
* **Reservatórios:** Reservatório duplo em polietileno moldado por rotação ($\text{PEAD}$) com capacidade total de $50\text{ litros}$ ($20\text{L}$ para sementes e $30\text{L}$ para adubo granulado/organomineral) com sensores capacitivos de nível baixo.
* **Mecanismo Dosador de Sementes:** Disco alveolar trocável acionado por motor de passo NEMA 23 com caixa de redução planetária $1:10$ de alta precisão angular, estanque com proteção $\text{IP65}$.
* **Mecanismo Dosador de Adubo:** Carretel helicoidal dosador usinado em polímero técnico autolubrificante ($\text{POM-C}$) acionado por segundo motor de passo independente.
* **Sulcador e Compactador:** Disco duplo sulcador desalinhado em aço manganês resistente à abrasão com mola de pressão ajustável. Roda compactadora traseira em formato V de borracha flexível autocleaner.
* **Sensores Integrados:**
  * Sensor óptico infravermelho de contagem de sementes por fotodiodo duplo (confirmação de queda de semente e detecção de tubos entupidos).
  * Célula de carga no braço de pressão do sulcador para monitoramento da compactação do solo.

### 3. Integração e Protocolos de Software (ROS 2)
* **Nó ROS 2:** `agbot_seed_node`
* **Algoritmo de Sincronismo:** O nó lê o tópico `/odom` do robô base e ajusta dinamicamente a frequência de rotação dos motores de passo para manter o espaçamento pré-configurado entre plantas independentemente da variação de velocidade da base.
* **Serviços ROS 2:**
  * `/mod02/calibrate_seeds` (`agbot_srvs/CalibrateSeed`): Define o número de pulsos por semente com base na variedade de cultura selecionada no aplicativo.
* **Diagnóstico de Falhas:** Emite alertas em caso de erro de miss-fire (ausência de queda de semente durante $3$ ciclos de dosagem contínuos).

---

## MÓDULO 03: SENSOR PENETRÔMETRO E ANÁLISE MULTISSENSORIAL DE SOLO (M03-SOIL)

```
                     MÓDULO 03: ANÁLISE MULTISSENSORIAL DE SOLO
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Guia Linear Industrial Nema 34 + Atuador Fuso de Esferas (Curso 400mm)      │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Avanço Vertical Controlado
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Célula de Carga Tipo S (0-100 kgf) + Haste de Inox 316 com Ponta Cônica     │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Inserção no Solo
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Sensor Multiparamétrico de Solo Modbus RS485 Integrado na Ponta            │
  │ • NPK (Eletroquímico)   • Condutividade (EC)   • Umidade / Temp / pH        │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Descrição Geral e Objetivo Agroecológico
O Módulo M03 mapeia fisicamente e quimicamente a saúde do solo em profundidade sem a necessidade de coletar e enviar amostras físicas a laboratórios externos. Ele mede a compactação do solo e teores de nutrientes em tempo real.

### 2. Componentes e Especificações Mecatrônicas
* **Mecanismo de Penetração Vertical:** Guia linear recirculante com fuso de esferas acionado por motor NEMA 34 com codificador absoluto, oferecendo curso vertical de $400\text{mm}$ e força de penetração axial de até $1000\text{ N}$.
* **Haste e Célula de Carga (Penetrômetro):** Haste sólida em aço inoxidável AISI 316 com ponta cônica padronizada ($\text{ASAE S313.3}$). Célula de carga tipo "S" de $100\text{ kgf}$ montada em série para medir o perfil de resistência mecânica à penetração em função da profundidade.
* **Sensor Multiparamétrico RS485:** Módulo de ponta integrado com eletrodos de platina e titânio para medições simultâneas via protocolo **Modbus-RTU**:
  * **NPK:** Estimativa efervescente de N (Nitrogênio), P (Fósforo) e K (Potássio) em $\text{mg/kg}$.
  * **pH:** Variação de $3$ a $14\text{ pH}$ com resolução de $0,01$.
  * **Condutividade Elétrica (EC):** $0$ a $20.000\text{ }\mu\text{S/cm}$.
  * **Umidade e Temperatura do Solo:** $0-100\%$ VWC e $-20\text{^\circ C}$ a $+80\text{^\circ C}$.

### 3. Integração e Protocolos de Software (ROS 2)
* **Nó ROS 2:** `agbot_soil_analyser_node`
* **Sequência de Operação Automatizada:**
  1. O robô base para no ponto de amostragem definido pelo mapa de planejamento.
  2. O nó solicita o travamento dos freios da base.
  3. O atuador desce a $10\text{ mm/s}$, registrando a leitura da célula de carga a cada $5\text{ mm}$ de profundidade (gerando a curva de compactação do solo).
  4. Na profundidade máxima ($300\text{ mm}$), a haste para por 5 segundos para estabilização do sensor RS485 e leitura dos parâmetros químicos.
  5. A haste recua totalmente e envia a estrutura contendo a geolocalização e os dados completos de solo.
* **Formato de Dados:** Publica no tópico `/mod03/soil_profile` (`agbot_msgs/SoilProfile`).

---

## MÓDULO 04: DISSUASOR LASER E GUARDIÃO DE FAUNA/PRAGAS (M04-LASER)

```
                       MÓDULO 04: GUARDIÃO LASER E BIOACÚSTICO
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Pan-Tilt Gimbal de Alta Velocidade (2-Eixos com Servos Brushless IP66)      │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Orientação Espacial Dynamic
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Diodo Laser Verde (λ = 532nm - 500mW Classe 3B) + Colimador de Feixe       │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Varredura Visual Anti-Fauna
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Array de Alto-Falantes Piezoelétricos Ultrassônicos (15kHz - 45kHz @ 110dB)  │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Descrição Geral e Objetivo Agroecológico
O Módulo M04 oferece proteção física e não letal de lavouras contra mamíferos, aves e pragas de insetos nocivos. Ele utiliza dissuasão óptica (laser) e acústica (ultrassom modulado), substituindo defensivos tóxicos e envenenamento de fauna.

### 2. Componentes e Especificações Mecatrônicas
* **Gimbal Orientável de 2 Eixos (Pan-Tilt):** Mecanismo estanque ($\text{IP66}$) acionado por servomotores industriais sem escovas com enconders magnéticos absolutos de $14\text{ bits}$. Alcance de azimute: $360\text{^\circ}$ contínuo; inclinação: $-45\text{^\circ}$ a $+90\text{^\circ}$.
* **Emissor Laser Optoeletrônico:** Diodo laser verde com comprimento de onda $\lambda = 532\text{nm}$ e potência de saída ajustável de $100\text{mW}$ a $500\text{mW}$ (Classe 3B). Inclui sistema de lentes expansoras/colimadoras para segurança ocular a médias distâncias.
* **Sistema Bioacústico Ultrassônico:** Matriz de 4 transdutores piezoelétricos operando na faixa de frequências dinâmicas de $15\text{ kHz}$ a $45\text{ kHz}$ com pressão sonora de até $110\text{ dB}$ a $1\text{ metro}$.
* **Mecanismos de Segurança Física:**
  * Sensor de presença humana via radar Doppler em onda milimétrica ($24\text{ GHz}$) integrado: Desliga o laser instantaneamente se qualquer ser humano se aproximar a menos de $15\text{ metros}$ no raio de ação.

### 3. Integração e Protocolos de Software (ROS 2)
* **Nó ROS 2:** `agbot_guardian_node`
* **Algoritmos de Varredura:**
  * **Modo Patrulha Geofenced:** Executa padrões de varredura Lissajous sobre áreas específicas mapeadas onde aves foram identificadas pelo Infodrone.
  * **Modo Acompanhamento de Pragas:** Aceita bounding boxes da câmera OAK-D e aponta o feixe ultrassônico modulado na frequência de afugentamento específica para a espécie detectada.
* **Tópicos:**
  * Subscreve em `/perception/detected_threats` (`agbot_msgs/TargetList`).
  * Publica em `/mod04/status` (`agbot_msgs/GuardianStatus`).

---

## MÓDULO 05: IRRIGADOR E PULVERIZADOR MICRO-LOCALIZADO (M05-SPRAY)

```
                    MÓDULO 05: PULVERIZAÇÃO E IRRIGAÇÃO CIRÚRGICA
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Tanque Rotomoldado PEAD 60 Litros + Agitador Hidráulico e Retorno           │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Bomba de Diafragma 24V DC / 100 PSI (7.0 bar) / Vazão 5.5 L/min             │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Linha de Pressão Retificada
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Barra Articulada com 4 Válvulas Solenoides de Ação Rápida (Tempo Resposta 8ms)│
  │ + Bicos Anti-Deriva de Cerâmica com Variação PWM                            │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Descrição Geral e Objetivo Agroecológico
O Módulo M05 realiza a aplicação ultralocalizada de bioinsumos, caldos orgânicos, extratos vegetais e irrigação gota a gota no pé da planta. Elimina o desperdício em área total ao pulverizar estritamente sobre a folhagem da planta-alvo (*See-and-Spray*).

### 2. Componentes e Especificações Mecatrônicas
* **Reservatório e Circuito Hidráulico:** Tanque de $60\text{ litros}$ em polietileno com formato anti-ondas e agitador hidráulico de retorno continuo. Filtro de sucção em malha inox de $100\text{ mesh}$.
* **Pressurização:** Bomba elétrica de diafragma duplo $24\text{V DC}$, pressão máxima de $100\text{ PSI}$ ($7,0\text{ bar}$) e vazão máxima de $5,5\text{ L/min}$.
* **Barra de Aplicação Seletiva:** Barra lateral articulada mecanicamente com regulagem de largura de $0,8\text{m}$ a $2,2\text{m}$.
* **Válvulas Solenoides Ultra-Rápidas:** 4 solenoides de atuador direto com tempo de abertura/fechamento inferior a $8\text{ ms}$, acionadas via modulação por largura de pulso ($\text{PWM}$) para controle milimétrico do volume aplicado por metro quadrado.
* **Bicos de Pulverização:** Bicos de indução de ar com ponta em cerâmica resistentes ao desgaste e de baixa deriva provocada pelo vento.

### 3. Integração e Protocolos de Software (ROS 2)
* **Nó ROS 2:** `agbot_spray_precision_node`
* **Lógica de Visão e Ação em Malha Fechada:**
  1. A câmera de visão computacional detecta a presença de uma invasora ou planta doente e calcula sua coordenada relativa $(X, Y)$ no sistema de referência do veículo.
  2. O nó ROS calcula o atraso espacial com base na velocidade atual de avanço da esteira ($v$).
  3. A válvula solenoide correspondente à posição lateral da planta recebe um pulso de acionamento $\text{PWM}$ no instante exato em que o bico posiciona-se sobre a planta.
* **Economia Consolidada:** Redução comprovada de até $85\%$ na quantidade de insumo aplicada quando comparada à pulverização contínua convencional.

---

## MÓDULO 06: BRAÇO ROBÓTICO ARTICULADO 5-DOF PARA COLHEITA (M06-HARVEST)

```
                     MÓDULO 06: BRAÇO DE COLHEITA ROBÓTICA
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Estrutura Cinemática 5 Graus de Liberdade (Alumínio Aeronáutico Anodizado)  │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Atuação por Servos BLDC Industriais
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Efetuador Final: Garra Pneumática/Silicone Soft-Gripper Adaptativa           │
  │ + Lâmina Rotativa Ultra-Sônica Integrada + Vácuo de Retenção Suave          │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Realimentação Visual / Profundidade
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Sensor RGB-D Luxonis OAK-D Pro Integrado na Extremidade do Braço             │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Descrição Geral e Objetivo Agroecológico
O Módulo M06 possibilita a colheita automatizada de frutos e hortaliças delicadas (como tomate, pimentão, morango e frutas de pomar) sem causar ferimentos aos tecidos do vegetal, preservando o valor comercial de pós-colheita.

### 2. Componentes e Especificações Mecatrônicas
* **Geometria e Materialidade:** Armadura robótica articulada tipo antropomórfica com 5 graus de liberdade ($\text{DOF}$) em liga de alumínio 7075-T6 e fibra de carbono. Raio de alcance total de $850\text{mm}$ com capacidade de carga útil no efetuador de $1,5\text{ kg}$.
* **Atuadores Articulares:** Actuadores industriais integrados contendo motor $\text{BLDC}$, redutor harmônico sem folga (*harmonic drive* $1:100$), encoder absoluto duplo e driver $\text{CANopen}$ interno.
* **Efetuador Final (Garra Multifuncional):**
  * Dedos adaptativos fabricados em silicone de grau alimentício acionados por minipneumática ou vácuo.
  * Lâmina cirúrgica oscilante ultrassônica ($20\text{ kHz}$) para pedúnculos rígidos.
  * Ventosa de apoio com bomba de sucção micro-venturi.
* **Sensoriamento na Borda do Braço:** Câmera estéreo $\text{RGB-D Luxonis OAK-D Pro}$ instalada próxima ao efetuador final com iluminador infravermelho VCSEL ativo para operação noturna.

### 3. Integração e Protocolos de Software (ROS 2)
* **Estrutura de Software:**
  * Integração completa com o **MoveIt 2** para planejamento de trajetória sem colisão com o dossel das plantas.
  * Modelo cinemático inverso acelerado por GPU rodando localmente no computador central.
* **Pipeline de Execução:**
  1. Identificação do Fruto $\rightarrow$ Modelo YOLOv8-Pose encontra o centroide e a orientação do fruto e pedúnculo em espaço 3D.
  2. Planejamento de Tragetória $\rightarrow$ MoveIt 2 gera o caminho suave evitando galhos e folhas rídidas.
  3. Agarre e Corte $\rightarrow$ Dedos de silicone fecham com pressão monitorada por sensor de força tátil; a lâmina ultrassônica corta o pedúnculo.
  4. Depósito $\rightarrow$ Fruto é depositado na caixa de armazenamento instalada sobre o chassi.

---

## MÓDULO 07: CLIMATIZADOR E MONITOR DE ESTUFAS E FUNGICULTURA (M07-CLIMA)

```
                   MÓDULO 07: CLIMATIZADOR E FUNGICULTURA
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Torre Multissensorial NDIR CO2 + SHT40 Temp/Umidade + Iluminação PAR        │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Sinalização de Clima Interno
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Nebulizador Ultrassônico de Água Inox (Piezos 2.4MHz - Névoa 1-5 mícrons)  │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ Injeção de Micro-Gotas
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ Exaustor Dual Vane IP55 Reversível para Troca de Ar e Homogeneização        │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Descrição Geral e Objetivo Agroecológico
O Módulo M07 transforma o AgBot em uma estação móvel de suporte ambiental e monitoramento contínuo para cultivos protegidos (estufas, casas de vegetação e galpões de fungicultura/cogumelos). Ele elimina pontos cegos de microclima através da navegação móvel pelas alamedas.

### 2. Componentes e Especificações Mecatrônicas
* **Torre de Sensores de Ambiência:**
  * Sensor NDIR para Concentração de Dióxido de Carbono ($\text{CO}_2$) na faixa de $0$ a $10.000\text{ ppm}$.
  * Sensor capacitivo $SHT40$ de alta precisão para temperatura (erro $\pm 0,2\text{^\circ C}$) e umidade relativa do ar (erro $\pm 1,8\%$).
  * Sensor de Radiação Fotossinteticamente Ativa ($\text{PAR} / \text{PPFD}$) para avaliação da luz disponível para plantas.
* **Sistema Nebulizador Ultrassônico Móvel:** Placa geradora de névoa limpa de alta frequência ($2,4\text{ MHz}$) em aço inox com reservatório próprio de $15\text{ litros}$, gerando gotas de diâmetro ultra-fino ($1-5\text{ \mu m}$) que evaporam no ar sem molhar diretamente as folhas ou substratos de cogumelos, prevenindo contaminações por fungos oportunistas.
* **Circulação Ativa de Ar:** Exaustor/soprador de fluxo axial de duplo estágio com velocidade variável ($0-800\text{ m}^3\text{/h}$) para desestratificação do ar quente parado nas estufas.

### 3. Integração e Protocolos de Software (ROS 2)
* **Nó ROS 2:** `agbot_greenhouse_clim_node`
* **Mapeamento Microclimático 3D:**
  * O robô percorre os corredores da estufa e associa as medições de $\text{CO}_2$, umidade e temperatura a pontos tridimensionais do mapa SLAM.
  * Gera uma matriz isotérmica e de umidade em tempo real, acionando o nebulizador ou o ventilador de forma localizada nos pontos exatos onde o clima divergir do *setpoint* ideal.
* **Exportação de Dados:** Sincroniza via rede Wi-Fi local com a Central AgHub e envia alertas ao smartphone do agricultor caso limites críticos sejam atingidos (ex: estufa superaquecida).

---

## RESUMO COMPARATIVO DE ESPECIFICAÇÕES DOS MÓDULOS

| Módulo | Nome Oficial | Massa Total (kg) | Potência Média (W) | Interface Primária | Tópico Principal ROS 2 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M01** | Roçador de Precisão | $18,5\text{ kg}$ | $500\text{ W}$ | CAN-Bus + $24\text{V High}$ | `/mod01/telemetry` |
| **M02** | Semeadora / Adubadeira | $22,0\text{ kg}$ | $120\text{ W}$ | CAN-Bus + $24\text{V DC}$ | `/mod02/seed_status` |
| **M03** | Análise de Solo Profunda | $14,2\text{ kg}$ | $200\text{ W}$ | Modbus RS485 + CAN | `/mod03/soil_profile` |
| **M04** | Guardião Laser/Bioacústico | $8,8\text{ kg}$ | $45\text{ W}$ | Ethernet IP67 + CAN | `/mod04/status` |
| **M05** | Pulverizador Micro-Local | $16,5\text{ kg}$ (Vazio) | $180\text{ W}$ | CAN-Bus + GPIO PWM | `/mod05/spray_cmd` |
| **M06** | Braço Robótico Colheita | $19,8\text{ kg}$ | $350\text{ W}$ | GigE Ethernet + CAN | `/mod06/arm_joint_states` |
| **M07** | Climatizador de Estufas | $12,0\text{ kg}$ (Vazio) | $95\text{ W}$ | CAN-Bus + RS485 | `/mod07/climate_map` |

---

## CONCLUSÃO DE ENGENHARIA

O detalhamento individualizado dos 7 módulos operacionais demonstra a flexibilidade mecatrônica da plataforma AgBot. Ao unificar conectores, barramentos de comunicação e abstrações de software via ROS 2, o sistema transforma a unidade motriz terrestre em uma ferramenta multifuncional capaz de atuar em todas as etapas do ciclo produtivo agrícola.