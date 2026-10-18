# PROJETO EXECUTIVO DE SUBVENÇÃO ECONÔMICA
## Programa de Inovação Social, Automação Agrícola de Baixo Carbono e Mitigação do Gargalo Demográfico Rural

### **Título do Projeto**: *Plataforma Robótica Open-Source e Solar para Agricultura Familiar e Agroecológica (AgBot / AgHub)*
* **Proponente**: Agrotech / Cooperativa da Serra Gaúcha (Linha 30, Caxias do Sul/RS)
* **Eixo Temático FINEP**: Inovação Social / Agricultura Familiar, Demografia Rural e Transição Agroecológica
* **Eixo Temático Tecnova III RS**: Automação Agrícola, Transição Energética, Baixo Carbono e Sucessão Familiar no Campo

---

## 1. Resumo Executivo e Justificativa da Inovação

### 1.1 O Gargalo Estrutural: A Inversão Demográfica no Campo
A agricultura familiar enfrenta uma crise estrutural irreversível de **escassez severa de mão de obra braçal**, impulsionada pelo envelhecimento acelerado da população rural e pelo êxodo da juventude. 

* **Envelhecimento Acelerado (Dados IBGE)**: O Rio Grande do Sul possui a maior idade mediana do país (38 anos), e a idade média dos produtores rurais na Serra Gaúcha já ultrapassa os 52 anos. O trabalho braçal contínuo (roçada, capina e carregamento de carga) torna-se inviável para agricultores sêniores.
* **Êxodo da Juventude e Sucessão Familiar**: As novas gerações recusam o modelo de produção baseado no desgaste físico análogo ao século XIX. Sem tecnologia, as propriedades são abandonadas ou arrendadas para monoculturas convencionais dependentes de agrotóxicos.
* **Inacessibilidade das Soluções Atuais**: As poucas soluções robóticas comerciais existentes são importadas, custam acima de **R$ 300.000,00**, utilizam ecossistemas fechados de código e possuem manutenção inviável para a pequena propriedade.

```
                      O TRIÂNGULO DO GARGALO DEMOGRÁFICO RURAL
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. ENVELHECIMENTO DA POPULAÇÃO RURAL                                        │
│    • Dificuldade física para realizar trabalhos de alta penosidade braçal.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ÊXODO DA JUVENTUDE & FALTA DE SUCESSÃO                                   │
│    • Recusa do trabalho braçal desgastante e busca por funções tecnológicas.│
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. INFLAÇÃO E ESCASSEZ DE MÃO DE OBRA                                       │
│    • Custo insustentável e falta crônica de diaristas no interior do RS.    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
 💡 SOLUÇÃO: "O AgBot como Assistente Operacional e Sucessor Tecnológico"
```

### 1.2 A Solução Proposta
Desenvolvimento, validação e disseminação do **AgBot**, um ecossistema robótico modular de tração por esteiras, movido a **energia solar**, com vedação industrial **IP67**, código e projetos de hardware **Open-Source** (código aberto). 

A solução reduz o custo de aquisição para **~R$ 38.000,00 a R$ 44.000,00** por unidade, elimina a penosidade do trabalho no campo, permite que agricultores sêniores mantenham suas propriedades produtivas e atrai a juventude rural para a gestão de agrotechs locais.

---

## 2. P&D, Arquitetura Tecnológica e Nível de Maturidade (TRL)

* **TRL Atual (Nível de Maturidade)**: TRL 4 (Validação de componentes e arquitetura em ambiente de bancada/laboratório).
* **TRL Alvo (Pós-Projeto FINEP/Tecnova)**: TRL 8 (Sistema real concluído e qualificado em ambiente operational no campo da Linha 30).

### 2.1 Especificações da Inovação de Hardware & Software
* **Tração & Robustez**: Plataforma em esteiras de borracha com malha de aço e chassi em alumínio 6061-T6 (capacidade de rampa de até 35° no relevo acidentado da Serra Gaúcha).
* **Eletrônica & Vedação**: Caixas em alumínio fundido IP67, conectores automotivos selados (Deutsch DT) e acionamento por motores brushless de alto torque.
* **Navegação & Precisão Centimétrica**: Módulo RTK-GPS centimétrico (u-blox ZED-F9P) com precisão de 2 cm, integrado ao protocolo ROS2 / ESP32 e orquestrado por modelos de IA local (Raspberry Pi 5 no AgHub).
* **Módulos Intercambiáveis (Engate Rápido)**: Roçador/Cortador, Semeadora, Sensor de Solo Profundo (RS485/NPK), Disparador Bioacústico/Laser (Fauna), Irrigador Cirúrgico, Braço Colhedor e Climatizador de Cogumelos.

---

## 3. Impacto Demográfico, Social e Sustentabilidade Ambiental

| Eixo de Impacto | Indicadores Mensuráveis do Projeto |
| :--- | :--- |
| **Mitigação do Gargalo Demográfico** | Redução de 90% do esforço físico exigido em tarefas pesadas (capina, roçada e transporte), estendendo a vida útil produtiva de agricultores sêniores com segurança e ergonomia. |
| **Aumento da Atratividade e Sucessão Familiar** | Transformação do trabalho braçal em gestão tecnológica digital (via aplicativo/dashboard), incentivando a fixação de jovens agricultores no meio rural. |
| **Arquitetura Open-Source e Reparável** | Disponibilização pública de arquivos CAD (chassi), esquemáticos (KiCAD) e firmware, permitindo que escolas técnicas locais (IFRS Caxias, UCS) e oficinas rurais realizem manutenção sem dependência de multinacionais. |
| **Descarbonização & ESG** | Substituição total de combustível fóssil (óleo diesel/gasolina de tratores) por tração 100% elétrica alimentada por painéis solares. Emissão NULA de $CO_2$ na operação. |

---

## 4. Plano de Trabalho e Cronograma de Metas (12 Meses)

1. **Meses 1 a 2 — Fase 1: Aquisição da BOM & Componentes Industriais**:
   * Aquisição de 100% dos componentes industriais (Motores Brushless, RTK u-blox, Baterias LiFePO4, esteiras reforçadas e estrutura do AgHub AC).
2. **Meses 3 a 5 — Fase 2: Montagem da Frota Piloto (AgBot IP67 + Infodrone)**:
   * Integração mecânica das esteiras, montagem do chicote automotivo selado Deutsch DT, fabricação dos 7 módulos de trabalho e validação de bancada do AgHub.
3. **Meses 6 a 8 — Fase 3: Auto-Tuning da IA e Mapeamento RTK na Linha 30**:
   * Mapeamento de bordas, rotinas de auto-tuning de PID por Inteligência Artificial, testes de navegação autônoma na horta e calibração da visão por computador (YOLO) para pragas.
4. **Meses 9 a 12 — Fase 4: Validação em Campo, Homologação Open-Source e Relatório Final**:
   * Operação plena em campo gerando dados para certificação de baixo carbono, publicação dos repositórios Open-Source e prestação de contas técnica ao edital (FINEP/Tecnova).

---

## 5. Orçamento Detalhado e Aplicação dos Recursos da Subvenção

Abaixo, o orçamento estimado para aprovação na faixa de **R$ 200.000,00** (compatível com os aportes do Tecnova III / FINEP Centelha):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DISTRIBUIÇÃO DO RECURSO SOLICITADO                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. MATERIAIS DE CONSUMO & COMPONENTES (BOM):                  R$  75.000,00 │
│    • Motores, esteiras, baterias LiFePO4, RTK u-blox, IP67.                 │
│ 2. EQUIPAMENTOS DE INFRAESTRUTURA DE P&D (AgHub / Solar):     R$  42.000,00 │
│    • Painéis solares, inversores híbridos, servidor Pi 5 e Doca.            │
│ 3. SERVIÇOS DE TERCEIROS (Corte a laser, PCB, Usinagem):      R$  28.000,00 │
│ 4. EQUIPE TÉCNICA E BOLSAS DE P&D (Agronomia/Robótica/TI):    R$  45.000,00 │
│ 5. PROPRIEDADE INTELECTUAL & DADOS ESG (Certificações):       R$  10.000,00 │
├─────────────────────────────────────────────────────────────────────────────┤
│ VALOR TOTAL SOLICITADO NO EDITAL:                            R$ 200.000,00  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Governança e Qualificação da Equipe Técnica

A proposta se apoia em uma equipe multidisciplinar com competências complementares:
* **Coordenação Geral & IA/TI**: Responsável pela arquitetura de software, modelos de inteligência artificial preditiva e orquestração do Dashboard.
* **Engenharia Mecânica & Automação**: Responsável pela modelagem CAD, análise estrutural das esteiras e integração do barramento CAN-Bus.
* **Agronomia & Fitossanidade**: Responsável pela validação agronômica, saúde do solo (NPK), consórcios e calibração da sucaria/cogumelos.
* **Inovação & Importação**: Responsável pela gestão da cadeia de mantimentos (BOM) e negociação direta de componentes.
* **Gestão Financeira & Operacional**: Responsável pela prestação de contas dos recursos públicos e gestão das rotas comerciais.