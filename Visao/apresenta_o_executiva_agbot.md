# PLANO EXECUTIVO DE INOVAÇÃO & VISÃO ESTRATÉGICA

## AgBot: Plataforma Robótica Solar, Open-Source e Ecossistema Cooperativo para a Agricultura Familiar

---

## 1. Visão Geral e Proposta de Valor

O **AgBot** é um ecossistema robótico agrícola, autônomo, modular e de tração por esteiras alimentado por **energia solar**. Muito além de um hardware individual, o projeto foi concebido como uma **Plataforma Tecnológica e Social em Rede** focada na democratização da automação no campo.

Designed for smallholders, agroecological farms, traditional communities, and agrarian settlement cooperatives, the project addresses three structural bottlenecks:

1. **Inversão Demográfica e Penosidade**: O acelerado envelhecimento da população rural (idade média superior a 52 anos no RS) e a escassez severa de mão de obra braçal para roçada e manejo orgânico.
2. **Barreira Financeira do Agrotech Tradicional**: Máquinas importadas e ecossistemas proprietários custam acima de R\$ 300.000,00, aprisionando o produtor em contratos abusivos e peças de reposição inacessíveis.
3. **Isolamento do Pequeno Produtor**: A limitação de escala e diversidade que impede agricultores familiares de atenderem mercados consumidores de alto valor de forma contínua.

---

## 2. O Pilar Open-Source: Justificativas Técnicas e Sociais

A opção pela arquitetura **Open-Source** (código, projetos mecânicos CAD, esquemáticos eletrônicos KiCAD e firmwares abertos) não é um detalhe metodológico, mas o **coracional estratégico do projeto**.

```
                   O TRIÂNGULO DA SOBERANIA TECNOLÓGICA OPEN-SOURCE
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 1. DEMOCRATIZAÇÃO E ACESSIBILIDADE                                          │
 │    • Eliminação de royalties, licenças de software e custos de R&D embutidos.│
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 2. MANUTENABILIDADE LOCAL ("REPARABILIDADE NA ROÇA")                        │
 │    • Componentes padrão off-the-shelf; qualquer oficina ou IF faz o reparo.  │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 3. SOBERANIA TECNOLÓGICA E ADAPTABILIDADE REGIONAL                           │
 │    • Liberação contra o aprisionamento tecnológico (vendor lock-in).        │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Justificativa Técnica

* **Reparabilidade e Manutenção Descentralizada**: Máquinas agrícolas modernas utilizam sistemas criptografados que exigem técnicos credenciados para diagnosticar falhas simples. O AgBot utiliza componentes industriais padrão (*off-the-shelf*), conectores automotivos selados (Deutsch DT) e controladores abertos (ROS2 e ESP32). Se um componente falha, o próprio produtor, uma oficina mecânica rural ou a cooperativa local pode diagnosticar e trocar a peça em poucas horas.
* **Inovação Aberta e Evolução Contínua**: O desenvolvimento modular aberto permite que universidades (como IFRS, UCS, UFRGS) e desenvolvedores globais criem novos módulos operacionais específicos (ex: novos braços de colheita ou sensores de pragas) sem refazer o veículo-base.
* **Segurança e Resiliência de Software**: O uso do ecossistema ROS2 (*Robot Operating System*) garante estabilidade industrial, testes automatizados e autonomia offline total — o AgBot opera com precisão centimétrica via RTK-GPS local, sem depender de conexão contínua com a nuvem ou servidores proprietários no exterior.

### 2.2 Justificativa Social

* **Soberania Tecnológica do Campo**: Impede a dependência das grandes corporações do agronegócio, garantindo que o conhecimento sobre a produção de tecnologia agrícola pertença às comunidades e cooperativas locais.
* **Formação de Capital Humano e Sucessão Familiar**: O caráter aberto do projeto transforma o interior num polo de qualificação técnica. Jovens agricultores deixam de ser apenas trabalhadores braçais para se tornarem operadores de tecnologia, programadores de rotas e gestores da frota robótica.
* **Redução Drástica do Custo de Aquisição**: Ao eliminar margens corporativas de patentes e royalties de software, o custo direto de fabricação da unidade motriz cai para **~R\$ 21.280,00**, permitindo que o kit comercial chegue ao agricultor por **R\$ 38.000,00**.

---

## 3. A Plataforma e a Formação de Rede a Longo Prazo

O AgBot opera em um modelo de **Rede Cooperativa Inteligente**, no qual a tecnologia robótica serve como catalisadora de novos arranjos produtivos e comerciais.

```
                            REDE COOPERATIVA AGROBOT
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                    PLATAFORMA CENTRAL / IA COOPERATIVA                      │
 │ • Planejamento Integrado de Safra / Visão Computacional Coletiva             │
 │ • Gestão de Frotas de AgBots e Logística de Entrega das Caixas              │
 └──────────────────────┬──────────────────────────────┬───────────────────────┘
                        │                              │
                        ▼                              ▼
 ┌──────────────────────────────┐              ┌──────────────────────────────┐
 │   PRODUTOR A (Assentamento)  │              │   PRODUTOR B (Assentamento)  │
 │ • AgBot (Módulo Raízes)      │              │ • AgBot (Módulo Folhosas)    │
 │ • Monta 40% da Caixa         │              │ • Monta 60% da Caixa         │
 └──────────────┬───────────────┘              └──────────────┬───────────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       │
                                       ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       CAIXA COMPARTILHADA DA REDE                           │
 │     Diversidade Orgânica Completa ── Entregue ao Consumidor Final           │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Consórcio de Produção e "Caixas Compartilhadas"

Um dos maiores desafios da pequena propriedade orgânica é a **falta de diversidade e escala**: um agricultor isolado muitas vezes produz apenas 2 ou 3 culturas, tornando difícil sustained a venda direta de cestas/caixas semanais.

* **Sincronização de Plantio e Colheita**: A plataforma central de IA orquestra o calendário de cultivo entre dezenas de pequenos produtores parceiros. O Produtor A foca em hortaliças de raiz (cenoura/beterraba), o Produtor B em folhosas, e o Produtor C em frutas e cogumelos.
* **Montagem Consorciada da Caixa**: O aplicativo organiza a rota de coleta e montagem das "Caixas Família Compartilhadas". Cada produtor contribui com sua especialidade, permitindo oferecer ao consumidor urbano uma cesta orgânica rica e diversificada.
* **Divisão Justa de Valor**: O sistema calcula automaticamente a participação de cada agricultor no valor total da caixa entregue, realizando o repasse financeiro direto com transparência via smart contratos ou contabilidade cooperativa.

### 3.2 Inteligência Artificial Federada e Aprendizado em Rede

Cada AgBot e Infodrone atuando nas propriedades coleta dados de visão computacional, acidez e umidade do solo, incidência de pragas e microclima.

* **Aprendizado Coletivo (Federated Learning)**: Quando um robô na Linha 30 identifica uma praga emergente ou estresse hídrico em um pé de tomate, o modelo de visão computacional (YOLO) é atualizado localmente e retransmitido para o servidor central da rede.
* **Prevenção Preditiva Regional**: Instantaneamente, **todos os outros AgBots da rede passam a reconhecer a praga nas fases mais precoces** e acionam medidas preventivas (como a aplicação cirúrgica de bioinsumos ou disparo de luz UV no Módulo 04/05) antes que a infestação se alastre pela região.

### 3.3 Modelo de Consórcio de Máquinas (*AgBot-as-a-Service*)

Nem todo pequeno produtor precisa adquirir individualmente um robô completo no primeiro momento.

* **Frota Compartilhada de Cooperativa**: Um grupo de 5 a 10 vizinhos pode adquirir um ou dois AgBots comunitários. A plataforma gerencia o agendamento autônomo: o robô executa a roçada na Propriedade 1 na segunda-feira, desloca-se ou é transportado via reboque `AgHub Mini` para a Propriedade 2 na terça-feira, e assim sucessivamente.
* **Aluguel Regional (R\$ 300/dia ou R\$ 1.800/mês)**: Produtores podem contratar o robô apenas nos meses de pico de manejo, transformando custos fixos de maquinário em despesas operacionais pontuais e extremamente acessíveis.

---

## 4. Detalhamento Técnico e BOM (Bill of Materials)

Abaixo apresenta-se a discriminação completa dos componentes de nível industrial, especificações de engenharia e estimativa de custos para fabricação do ecossistema robótico completo.

### 4.1 AgBot Base (Veículo Terrestre de Tração IP67)

*Plataforma em esteiras de borracha com malha de aço interna, chassi de alumínio industrial e vedação IP67.*

| Componente / Sub-sistema | Especificações de Engenharia e Nível Industrial | Custo Estimado (R\$) |
| :--- | :--- | :---: |
| **Chassi & Estrutura** | Perfis e chapas de alumínio 6061-T6 (4mm), corte a laser, solda TIG, pintura eletrostática a pó com tratamento anticorrosivo. | R\$ 3.800,00 |
| **Sistema de Lagartas/Esteiras** | 2x Esteiras de borracha vulcanizada reforçadas com malha interna de aço + rodas de tração e guia usinadas em UHMW. | R\$ 3.400,00 |
| **Sistema de Propulsão** | 2x Motores BLDC (Brushless) 24V 800W com redutores planetários industriais de alto torque (1:50) e freio eletromagnético. | R\$ 2.900,00 |
| **Driver de Potência** | Controlador duplo Roboteq / Sabertooth IP66 2x60A contínuo com comunicação CAN-Bus, PWM e regeneração de energia. | R\$ 1.850,00 |
| **Armazenamento de Energia** | Bateria LiFePO4 24V 50Ah Smart BMS (comunicação RS485/CAN, célula prismática Grade A, +3500 ciclos de vida útil). | R\$ 3.200,00 |
| **Navegação & RTK Móvel** | Módulo GNSS Centimétrico u-blox ZED-F9P RTK + Antena Helicial Multi-Banda (precisão de 2 cm em campo). | R\$ 1.450,00 |
| **Gabinete & Conectores** | Caixa hermética em alumínio fundido IP67, chicote elétrico com conectores automotivos selados Deutsch DT e relés estado sólido. | R\$ 1.200,00 |
| **SUBTOTAL AGBOT BASE** | **Unidade Motriz de Tração Terrestre** | **R\$ 17.800,00** |

### 4.2 Infodrone & AgHub Central de Apoio

*Unidade aérea de sensoriamento avançado e estação base de inteligência local / recarga solar.*

| Componente / Sub-sistema | Especificações de Engenharia e Nível Industrial | Custo Estimado (R\$) |
| :--- | :--- | :---: |
| **Infodrone (Scout Aéreo)** | Frame em fibra de carbono 3K 8", motores brushless selados IP54, Pixhawk/ArduPilot, câmera 3D RGB/Depth OAK-D Lite e 2x baterias 4S LiPo. | R\$ 6.800,00 |
| **Doca AgHub AC** | Gabinete industrial em aço epóxi IP65, rampa de atracamento em alumínio, contactores de carga automática 24V 1000W IP67. | R\$ 4.280,00 |
| **Servidor IA & RTK Base** | Servidor local Raspberry Pi 5 8GB com SSD NVMe Industrial 256GB + Estação Base RTK GNSS de teto + Transceptor LoRa Longo Alcance. | R\$ 3.900,00 |
| **SUBTOTAL CENTRAL & DRONE** | **Infraestrutura Fixo-Aérea da Propriedade** | **R\$ 14.980,00** |

### 4.3 Kit de 7 Módulos de Trabalho Intercambiáveis

*Ferramentas de engate rápido padrão mecânico e elétrico.*

| Módulo | Descrição do Equipamento e Componentes Incluídos | Custo Estimado (R\$) |
| :--- | :--- | :---: |
| **Módulo 01: Roçador / Cortador** | Motor Brushless 500W estanque + Disco usinado com lâminas temperadas de substituição rápida e carcaça de proteção em alumínio 3mm. | R\$ 2.200,00 |
| **Módulo 02: Semeadora / Adubadeira** | Servo mecânico de alto torque IP67 + Disco dosador em acrílico usinado + Sulcador de disco duplo e reservatório PEAD. | R\$ 1.800,00 |
| **Módulo 03: Sensor de Solo Profundo** | Actuador linear elétrico IP67 + Haste Inox 316 penetradora + Sensor industrial Modbus RS485 (NPK, pH, umidade, condutividade e temp). | R\$ 1.650,00 |
| **Módulo 04: Patrulha & Laser Fauna** | Laser Verde 532nm em case de alumínio selado + Horn Bioacústico IP66 20W + Iluminador UV de indução. | R\$ 1.250,00 |
| **Módulo 05: Irrigador & Pulverizador** | Bomba de diafragma Seaflo 24V 100PSI + Tanque 60L PEAD + Válvulas solenoides + Barra com bicos anti-gota ajustáveis. | R\$ 1.900,00 |
| **Módulo 06: Braço de Colheita 5-DOF** | Braço articulado 5 eixos em alumínio de aviação, servos industriais selados + Câmera 3D OAK-D Pro IP67 + Garras intercambiáveis de silicone atóxico. | R\$ 4.900,00 |
| **Módulo 07: Climatizador Cogumelo** | Sensor de $CO_2$ NDIR + Sensor Temp/Umidade SHT40 + Nebulizador Ultrassônico Inox 24V + Soprador estanque com filtro HEPA. | R\$ 1.450,00 |
| **SUBTOTAL MÓDULOS** | **Conjunto Completo com os 7 Módulos Operacionais** | **R\$ 15.150,00** |

### 4.4 Resumo de Inversões e Margens Consolidadas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CUSTO DE FABRICAÇÃO DO SEGUNDO KIT COMPLETO (Frota Expansão Fazenda)     │
│    • AgBot Base (R$ 17.800) + Infodrone (R$ 6.800) + Doca AgHub (R$ 4.280)  │
│    • Kit de 7 Módulos de Trabalho Intercambiáveis (R$ 15.150)               │
│    👉 CUSTO TOTAL DE FABRICAÇÃO SEGUNDO KIT: R$ 44.030,00                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. CUSTO DE FABRICAÇÃO DE UNIDADE COMERCIAL SIMPLES (Para Venda Externa)    │
│    • AgBot Base (R$ 17.800) + Módulo 01 Roçador (R$ 2.200) + Doca Mini      │
│    👉 CUSTO DIRETO DE FABRICAÇÃO (BOM): R$ 21.280,00                        │
│    👉 PREÇO DE VENDA DO KIT A TERCEIROS: R$ 38.000,00                       │
│    👉 MARGEM BRUTA DE LUCRO: R$ 16.720,00 (44% de Margem Bruta)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Estratégia de Financiamento e Sustentabilidade Econômica

Para viabilizar a implantação inicial e a escala da frota na Serra Gaúcha e em assentamentos rurais, o projeto combina três fontes financeiras:

1. **Subvenção Econômica "A Fundo Perdido" (FINEP e Tecnova III RS)**:
   * Aporte de **R\$ 150.000,00 a R\$ 400.000,00** direcionado ao P&D, consolidação dos repositórios Open-Source, prototipagem IP67 e certificação ESG de baixo carbono.
2. **Crédito Subsidiado com Garantia de Recebíveis (PRONAF Bioeconomia / Mais Alimentos / BNDES Fundo Clima)**:
   * Taxa de juros reduzida (**2,5% a 5% a.a.**) para aquisição dos AgBots por pequenos agricultores ou cooperativas.
   * **Trava de Recebíveis**: As parcelas do financiamento são descontadas diretamente da receita garantida das "Caixas Família Compartilhadas" comercializadas via plataforma.
3. **Receita Operacional Própria (A partir do Mês 6)**:
   * Venda de caixas de hortifrúti orgânico, sucos e cogumelos;
   * Receitas de aluguel de robôs (*AgBot-as-a-Service*) para produtores vizinhos;
   * Margem de 44% sobre a venda de novas unidades montadas do AgBot Comercial.

---

## 6. Conclusão e Diretrizes de Impacto

O **AgBot** transcende a definição de um equipamento agrícola: ele é uma **infraestrutura aberta de emancipação tecnológica e econômica para a agricultura familiar**. 

Ao unir **robótica de baixo custo**, **arquitetura Open-Source reparável na roça**, **energia solar limpa** e **inteligência artificial em rede para comercialização consorciada**, o projeto estabelece um novo paradigma sustentável, rentável e replicável para o campo no Brasil.