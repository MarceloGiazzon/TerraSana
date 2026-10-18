# ==============================================================================
# Script de Geração de Documentação Técnica dos Módulos AgBot
# Base Path: D:\WorkSpace\TerraSana\Robos\Modulos
# ==============================================================================

$basePath = "D:\WorkSpace\TerraSana\Robos\Modulos"

# Definição dos Módulos, Pastas e Conteúdos
$modulos = @(
    @{
        Folder = "01_Rocador_Cortador"
        FileName = "README.md"
        Title = "Módulo 01 — Roçador e Manejo de Ervas Daninhas"
        Content = @"
# Módulo 01 — Roçador e Manejo de Ervas Daninhas (AgBot)

## 1. Visão Geral e Aplicação Agronômica
Projetado para roçada de vegetação rasteira, plantas de cobertura e ervas daninhas entre linhas de hortaliças, parreirais e pomares na Serra Gaúcha, sem o uso de glifosato ou herbicidas químicos.

---

## 2. Especificações Técnicas de Engenharia
- **Largura Útil de Corte**: 500 mm.
- **Sistema de Corte**: Disco duplo em Alumínio 6061-T6 usinado com 4 lâminas flutuantes retráteis em **Aço Carbono 1095 temperado** (substituíveis).
- **Motorização**: Motor Brushless (BLDC) estanque IP67 de 600W (24V) acoplado diretamente ao eixo.
- **Ajuste de Altura Dinâmico**: Atuador linear elétrico IP67 de 1000N com curso de 100 mm (altura de corte ajustável dinamicamente via software entre 20 mm e 120 mm do solo).
- **Sensores Integrados**: Sensor de Efeito Hall (medição de RPM do disco) e sensor de corrente por Efeito Hall (monitoramento de esforço/travamento).

---

## 3. Arquitetura Eletrônica e Software (ROS 2)
- **Microcontrolador do Nódulo**: ESP32-S3 em case de alumínio fundido IP67.
- **Tópico Publicado**: `/mod01/telemetry` (RPM, Corrente A, Altura mm).
- **Tópico Subscrito**: `/mod01/cmd_height` (Float32), `/mod01/cmd_power` (Bool).
- **Lógica de Proteção Anti-Stall**: Se o sensor de corrente detectar travamento por pedras ou galhos espessos (I > 35A por mais de 200ms), a alimentação do motor é cut-off instantaneamente via MOSFET e a altura do módulo é elevada em 50 mm antes da tentativa de auto-religamento.

---

## 4. Bill of Materials (BOM) & Custos Estimados

| Componente | Especificação Industrial | Qtd | Custo Est. (R$) |
| :--- | :--- | :---: | :---: |
| Motor BLDC 600W 24V IP67 | Motor c/ vedação especial e eixo reforçado | 1 | R$ 750,00 |
| Atuador Linear 1000N IP67 | Curso 100mm, 24V c/ feedback potenciométrico | 1 | R$ 420,00 |
| Disco e Lâminas Flutuantes | Alumínio 6061-T6 + Aço Carbono 1095 | 1 | R$ 380,00 |
| Driver de Potência MOSFET IP66 | Controller Sabertooth / VESC adaptado 24V 50A | 1 | R$ 350,00 |
| Conectores e Chicote Deutsch | Conector Deutsch DT 12 pinos selado IP67 | 1 | R$ 150,00 |
| **CUSTO TOTAL MÓDULO 01** | | | **R$ 2.200,00** |
"@
    },
    @{
        Folder = "02_Semeadora_Adubadeira"
        FileName = "README.md"
        Title = "Módulo 02 — Semeadora & Adubadeira de Precisão"
        Content = @"
# Módulo 02 — Semeadora & Adubadeira de Precisão (AgBot)

## 1. Visão Geral e Aplicação Agronômica
Realiza a semeadura em linha ou pontual e a deposição dosada de adubo organomineral ou bioinsumos sólidos granulados, adaptado para sementes de hortaliças e adubação verde.

---

## 2. Especificações Técnicas de Engenharia
- **Capacidade dos Reservatórios**: 2x Reservatórios em Polietileno de Alta Densidade (PEAD) de 15 Litros cada (Semente + Adubo).
- **Mecanismo de Dosagem**: Discos dosadores verticais usinados em borracha de silicone atóxica de alta precisão, acionados por **Motores de Passo NEMA 23 IP65** com redutor planetário 5:1.
- **Abertura e Fechamento de Sulco**: Disco duplo sulcador em Aço Inox 304 com rodas compactadoras traseiras em poliuretano em formato V.
- **Sensores Integrados**: Sensor óptico por barreira infravermelha no tubo de queda (contagem individual de sementes caindo) e sensor ultrassônico IP67 de nível de reservatório.

---

## 3. Arquitetura Eletrônica e Software (ROS 2)
- **Dosagem Sincronizada por Velocidade**: O motor de passo ajusta sua frequência de pulso dinamicamente com base no valor de velocidade real do AgBot fornecido pelo odômetro/RTK via tópico `/odometry/filtered`.
- **Fórmula de Frequência**:
  $$f_{\text{pulso}} = \frac{v_{\text{robô}} \cdot \text{Densidade Target}}{\text{Passos por Semente}}$$

---

## 4. Bill of Materials (BOM) & Custos Estimados

| Componente | Especificação Industrial | Qtd | Custo Est. (R$) |
| :--- | :--- | :---: | :---: |
| Reservatórios PEAD 15L | Polietileno rotomoldado anti-UV | 2 | R$ 280,00 |
| Motores de Passo NEMA 23 IP65 | Torque 2.2 Nm c/ Redutor Planetário 5:1 | 2 | R$ 520,00 |
| Conjunto Sulcador Inox 304 | Disco duplo em Aço Inox 304 + Roda em V | 1 | R$ 450,00 |
| Sensores Ópticos + Ultrassom | Barreira IR de alta velocidade + Ultrassom IP67 | 2 | R$ 220,00 |
| Case Eletrônica + Conectores | Caixa Alumínio IP67 + Conector Deutsch DT | 1 | R$ 330,00 |
| **CUSTO TOTAL MÓDULO 02** | | | **R$ 1.800,00** |
"@
    },
    @{
        Folder = "03_Sensor_Solo_Profundo"
        FileName = "README.md"
        Title = "Módulo 03 — Análise de Solo Profunda (Penetrômetro e NPK/pH)"
        Content = @"
# Módulo 03 — Análise de Solo Profunda (Penetrômetro e NPK/pH)

## 1. Visão Geral e Aplicação Agronômica
Realiza amostragem física e química do solo *in-situ* em pontos georreferenciados pelo GPS-RTK, medindo compactação e parâmetros fundamentais sem necessidade de coleta manual ou envio a laboratório.

---

## 2. Especificações Técnicas de Engenharia
- **Mecanismo de Penetração**: Fuso de esferas recirculantes acionado por motor NEMA 34 com freio eletromagnético, montado sobre haste guia linear dupla de 20 mm.
- **Haste Amostradora**: Haste em Aço Inox 316 de 400 mm com ponta cônica normatizada (ASAE S313.3).
- **Célula de Carga**: Célula tipo S de alta precisão (0-100 kgf / 0-1000 N) acoplada no topo da haste.
- **Sensor Químico Multiparamétrico**: Ponteira multiparamétrica de solo Modbus RS485 (Mede: pH, Condutividade Elétrica, Umidade, Temperatura e N/P/K estimado por refletometria TDR).

---

## 3. Arquitetura Eletrônica e Software (ROS 2)
- **Ciclo Automático de Teste**:
  1. O AgBot para na coordenada (X, Y) pré-definida.
  2. O fuso de esferas desce a haste a uma velocidade constante de 30 mm/s.
  3. A célula de carga registra o perfil de resistência do solo a cada 5 mm de profundidade (gerando a curva de compactação do solo até 30 cm).
  4. Na profundidade máxima, o sensor RS485 lê a química do solo e salva os dados vinculados ao ID de coordenada RTK no banco de dados do AgHub.

---

## 4. Bill of Materials (BOM) & Custos Estimados

| Componente | Especificação Industrial | Qtd | Custo Est. (R$) |
| :--- | :--- | :---: | :---: |
| Fuso de Esferas + Guia Linear | Fuso SFU1605 400mm + Guias duplas 20mm | 1 | R$ 480,00 |
| Motor NEMA 34 c/ Freio | Torque 4.5 Nm 24V c/ freio elétrico | 1 | R$ 410,00 |
| Célula de Carga Tipo S 100kgf | Inox IP67 c/ Amplificador HX711 industrial | 1 | R$ 260,00 |
| Sensor Solo Modbus RS485 | Sonda NPK/pH/EC/Temp/Umidade Inox 316 | 1 | R$ 350,00 |
| Chassi e Conectores IP67 | Alumínio usinado + Deutsch DT-12 | 1 | R$ 150,00 |
| **CUSTO TOTAL MÓDULO 03** | | | **R$ 1.650,00** |
"@
    },
    @{
        Folder = "04_Moinho Rotativo"
        FileName = "README.md"
        Title = "Módulo 04 — Moinho Rotativo & Cultivador Micro-Descompactador de Solo"
        Content = @"
# Módulo 04 — Moinho Rotativo & Cultivador Micro-Descompactador de Solo

## 1. Visão Geral e Aplicação Agronômica
Projetado para o preparo de solo orgânico, revolvimento localizado de leiras, quebra de crostas superficiais, aeração do solo e incorporação de composto orgânico ou adubação verde diretamente no canteiro, sem destruir a biologia profunda do solo.

---

## 2. Especificações Técnicas de Engenharia
- **Mecanismo de Revolvimento**: Enxada rotativa de eixo horizontal com largura útil de 450 mm, equipada com 12 lâminas em curva tipo 'C' fabricadas em **Aço Boro Carbono** com tratamento térmico anti-desgaste.
- **Subsolador de Apoio**: Haste subsoladora central flutuante posicionada à frente do moinho para rompimento do 'pé de grade' e compactações superficiais até 180 mm de profundidade.
- **Motorização e Transmissão**: Motor Brushless (BLDC) de alto torque de 1200W (24V) IP67, acoplado a uma caixa de redução planetária usinada em aço temperado (redução 1:25), entregando até **75 Nm de torque no eixo**.
- **Controle de Profundidade**: Atuador linear elétrico heavy-duty de 2500N para regulagem milimétrica do revolvimento (de 20 mm a 120 mm de profundidade).

---

## 3. Arquitetura Eletrônica e Software (ROS 2)
- **Tópico Publicado**: `/mod04/soil_torque` (Float32), `/mod04/depth_mm` (Int16).
- **Tópico Subscrito**: `/mod04/set_depth` (Int16), `/mod04/enable` (Bool).
- **Algoritmo de Proteção contra Pedras (Serra Gaúcha)**:
  - O microcontrolador amostra a corrente do motor a 50Hz.
  - Se o pico de torque ultrapassar 55A por mais de 50ms (indicando choque contra rocha):
    1. Pausa o avanço do AgBot Base.
    2. Inverte o sentido de rotação do moinho por 200ms para desacoplar a pedra.
    3. Eleva a altura do moinho em 30 mm via atuador linear e retoma a operação.

---

## 4. Bill of Materials (BOM) & Custos Estimados

| Componente | Especificação Industrial | Qtd | Custo Est. (R$) |
| :--- | :--- | :---: | :---: |
| Motor BLDC 1200W 24V IP67 | Motor estanque de alto torque | 1 | R$ 850,00 |
| Redutor Planetário 1:25 | Redutor em Aço Temperado para 80 Nm | 1 | R$ 420,00 |
| Conjunto Moinho (12 Lâminas) | Eixo usinado + 12 lâminas Aço Boro | 1 | R$ 380,00 |
| Atuador Linear Heavy-Duty 2500N | Curso 150mm IP67 24V | 1 | R$ 300,00 |
| Chicote e Case ESP32-S3 | Caixa IP67 + Conector Deutsch DT | 1 | R$ 150,00 |
| **CUSTO TOTAL MÓDULO 04** | | | **R$ 2.100,00** |
"@
    },
    @{
        Folder = "05_Irrigador_Pulverizador"
        FileName = "README.md"
        Title = "Módulo 05 — Irrigador Cirúrgico e Pulverizador Micro-Localizado"
        Content = @"
# Módulo 05 — Irrigador Cirúrgico e Pulverizador Micro-Localizado

## 1. Visão Geral e Aplicação Agronômica
Aplicação de precisão (*See-and-Spray*) de bioinsumos líquidos (chá de compostagem, caldas protetoras orgânicas, urina de vaca curtida) e irrigação gota-a-gota direcionada à raiz da planta, sem desperdício de água ou insumos nas entrelinhas.

---

## 2. Especificações Técnicas de Engenharia
- **Tanque de Insumos**: Tanque de 60 Litros em PEAD rotomoldado com defletor interno anti-balanço e filtro de sucção de 100 mesh.
- **Sistema de Pressurização**: Bomba de diafragma Seaflo 24V de alta pressão (100 PSI / 6,8 Bar) com pressostato e vazão máxima de 5,5 L/min.
- **Barra de Pulverização**: Barra de 3 bicos com **Eletroválvulas Solenoides Rápidas de Aço Inox** (tempo de resposta de abertura/fechamento de 8 ms).
- **Bicos**: Bicos leque de cerâmica com indução de ar (anti-deriva).

---

## 3. Arquitetura Eletrônica e Software (ROS 2 & AI See-and-Spray)
- **Integração com Câmera RGB-D (OAK-D)**: A câmera localiza as plantas ou ervas daninhas. A IA calcula a posição tridimensional do alvo em relação à barra do robô.
- **Gatilho de Disparo**: Quando o bico de pulverização se alinha com a coordenada da planta/praga durante o movimento do robô, a eletroválvula correspondente é acionada por uma fração de segundo (100 ms a 300 ms), reduzindo o uso de bioinsumos em até 80%.

---

## 4. Bill of Materials (BOM) & Custos Estimados

| Componente | Especificação Industrial | Qtd | Custo Est. (R$) |
| :--- | :--- | :---: | :---: |
| Tanque PEAD 60L Rotomoldado | Formato anatômico anti-balanço | 1 | R$ 380,00 |
| Bomba Diafragma Seaflo 24V 100PSI | Vazão 5.5L/min, IP66 | 1 | R$ 420,00 |
| Eletroválvulas Ultra-Rápidas Inox | Abertura em 8ms, 24V solenoide | 3 | R$ 450,00 |
| Barra + Bicos Cerâmicos Anti-deriva | Tubulação em Inox 304 + Bicos Indução Ar | 1 | R$ 320,00 |
| Sensores e Chicote Deutsch | Sensor Nível PEAD + Conector IP67 | 1 | R$ 330,00 |
| **CUSTO TOTAL MÓDULO 05** | | | **R$ 1.900,00** |
"@
    },
    @{
        Folder = "06_Braco_Colheita"
        FileName = "README.md"
        Title = "Módulo 06 — Braço Robótico Colhedor de Hortaliças/Frutas (5-DOF)"
        Content = @"
# Módulo 06 — Braço Robótico Colhedor de Hortaliças/Frutas (5-DOF)

## 1. Visão Geral e Aplicação Agronômica
Colheita seletiva e sem danos físicos de frutos (tomate, morango, pimentão) e hortaliças de canteiro, operando através de visão computacional para avaliação do ponto ideal de maturação.

---

## 2. Especificações Técnicas de Engenharia
- **Cinemática**: Braço articulado de 5 Graus de Liberdade (5-DOF) + Garra final.
- **Estrutura**: Tubos em Fibra de Carbono 3K com juntas e elos usinados em **Alumínio Aeronáutico 7075-T6** anodizado.
- **Atuadores das Juntas**: Servotores Brushless Industriais de Alta Precisão (*Harmonic Drives*) com encoders absolutos de 14-bits.
- **Garra Final (Effector)**: Garra com dedos em silicone macio de grau alimentício atóxico, equipada com micro-lâmina ultrassônica de corte de pedúnculo e sensor de pressão tátil (FSR) nas pontas.
- **Sensor de Visão na Garra**: Câmera estéreo estanque OAK-D Lite montada no pulso do braço (*Eye-in-Hand*).

---

## 3. Arquitetura Eletrônica e Software (MoveIt 2)
- **Pacotes Utilizados**: `ROS 2 MoveIt 2`, `IKFast` (Cinemática Inversa).
- **Pipeline de Colheita**:
  1. A câmera de visão global identifica o fruto e valida a cor/maturação via rede neural YOLOv8.
  2. O MoveIt 2 calcula a trajetória do braço livre de colisões até o fruto.
  3. A câmera do pulso alinha a garra milimetricamente ao pedúnculo.
  4. Os dedos de silicone fecham até o sensor FSR indicar força de 2.5 N (segurar sem amassar).
  5. A lâmina ultrassônica corta o pedúnculo e o braço deposita o fruto suavemente na caixa de colheita.

---

## 4. Bill of Materials (BOM) & Custos Estimados

| Componente | Especificação Industrial | Qtd | Custo Est. (R$) |
| :--- | :--- | :---: | :---: |
| Servomotores Harmonic Drives | Juntas de precisão 24V c/ Encoders 14bit | 5 | R$ 2.400,00 |
| Estrutura Fibra Carbono/7075-T6 | Tubos Carbono 3K + Elos usinados 7075 | 1 | R$ 950,00 |
| Câmera OAK-D Lite IP67 | Processamento VPU Spatial AI no pulso | 1 | R$ 680,00 |
| Garra Soft-Gripper Ultrassônica | Dedos Silicone + Sensor FSR + Lâmina Piezo | 1 | R$ 520,00 |
| Eletrônica Local e Conectores | Driver CANopen / ROS2 + Conector Deutsch | 1 | R$ 350,00 |
| **CUSTO TOTAL MÓDULO 06** | | | **R$ 4.900,00** |
"@
    },
    @{
        Folder = "07_Cogumelo_Climatizacao"
        FileName = "README.md"
        Title = "Módulo 07 — Climatizador e Gerenciador de Estufas / Cogumelos"
        Content = @"
# Módulo 07 — Climatizador e Gerenciador de Estufas / Cogumelos

## 1. Visão Geral e Aplicação Agronômica
Módulo de acoplamento rápido ou operação estacionária para monitoramento e controle microclimático em ambientes protegidos (estufas de hortaliças e salas de cultivo de cogumelos comestíveis/Lentinula edodes).

---

## 2. Especificações Técnicas de Engenharia
- **Sistema de Nebulização**: Gerador piezoelétrico ultrassônico de névoa fria em Aço Inox (frequência de 2,4 MHz) com capacidade de 1,5 L/h de água micronizada.
- **Exaustão / Ventilação**: Soprador de fluxo axial estanque IP68 com duto ajustável e filtro HEPA H13 integrado.
- **Matriz de Sensores Climáticos**:
  - Sensor NDIR de CO2 (faixa de 0 a 10.000 ppm).
  - Sensor de Temperatura e Umidade Relativa de alta precisão (±0,1°C, ±1,5% UR).
  - Sensor de Luz PAR (Radiação Fotossinteticamente Ativa).

---

## 3. Arquitetura Eletrônica e Software (ROS 2)
- **Tópico Publicado**: `/mod07/environment` (Temp, Umidade, CO2, PAR).
- **Controle PID Integrado**: O módulo executa localmente um controlador PID de umidade e CO2. Se o nível de CO2 na sala de cogumelos ultrapassar 800 ppm, o exaustor HEPA é acionado; se a umidade cair abaixo de 85%, o nebulizador ultrassônico é ativado instantaneamente.

---

## 4. Bill of Materials (BOM) & Custos Estimados

| Componente | Especificação Industrial | Qtd | Custo Est. (R$) |
| :--- | :--- | :---: | :---: |
| Nebulizador Ultrassônico Inox | Piezoelétrico 2.4 MHz 1.5 L/h | 1 | R$ 380,00 |
| Soprador Axial IP68 + Filtro HEPA | Soprador 24V IP68 com caixa HEPA H13 | 1 | R$ 320,00 |
| Sensor NDIR CO2 Industrial | Faixa 0-10.000 ppm Modbus RS485 | 1 | R$ 290,00 |
| Sensor Temp/Umidade SHT40 | Sensor IP67 c/ capa sintetizada em bronze | 1 | R$ 180,00 |
| Case ESP32-S3 + Conectores | Alumínio IP67 + Conector Deutsch DT | 1 | R$ 280,00 |
| **CUSTO TOTAL MÓDULO 07** | | | **R$ 1.450,00** |
"@
    }
)

# Execução da Criação dos Arquivos
Write-Host "Iniciando a criação da documentação técnica na pasta: $basePath" -ForegroundColor Cyan

foreach ($mod in $modulos) {$targetDir = Join-Path -Path $basePath -ChildPath$mod.Folder
    $filePath = Join-Path -Path $targetDir -ChildPath$mod.FileName

    # Verifica se a pasta existe, se não existir, cria
    if (-not (Test-Path -Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir | Out-Null
        Write-Host "[CRIADA] Pasta: $targetDir" -ForegroundColor Yellow
    }

    # Salva o arquivo em formato UTF-8
    Set-Content -Path $filePath -Value$mod.Content -Encoding UTF8
    Write-Host "[OK] Documentação gerada: $filePath" -ForegroundColor Green
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Processo concluído com sucesso! Todos os módulos foram documentados." -ForegroundColor Green