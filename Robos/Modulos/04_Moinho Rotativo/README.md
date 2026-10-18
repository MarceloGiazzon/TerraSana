# Módulo 04 — Moinho Rotativo & Cultivador Micro-Descompactador de Solo

## 1. Visão Geral
Revolvimento localizado de canteiros, aeração do solo e incorporação de adubação verde.

## 2. Especificações Técnicas
- **Enxada Rotativa**: 450 mm de largura, 12 lâminas flutuantes em Aço Boro Carbono
- **Subsolador**: Haste flutuante para rompimento de 'pé de grade' até 180 mm
- **Motorização**: BLDC 1200W (24V) IP67 c/ Redutor Planetário 1:25 (Torque 75 Nm)
- **Ajuste de Profundidade**: Atuador linear Heavy-Duty 2500N (20 a 120 mm)

## 3. Arquitetura ROS 2
Proteção anti-pedra: Monitora corrente (50Hz). Se I > 55A por >50ms, inverte o motor em 200ms e eleva a haste.

## 4. BOM (Bill of Materials)
| Componente | Qtd | Custo Est. (R$) |
| :--- | :---: | :---: |
| Motor BLDC 1200W 24V IP67 | 1 | R$ 850,00 |
| Redutor Planetário 1:25 (80 Nm) | 1 | R$ 420,00 |
| Conjunto Moinho (12 Lâminas Boro) | 1 | R$ 380,00 |
| Atuador Linear 2500N 150mm | 1 | R$ 300,00 |
| Case ESP32-S3 + Deutsch DT | 1 | R$ 150,00 |
| **TOTAL** | | **R$ 2.100,00** |
