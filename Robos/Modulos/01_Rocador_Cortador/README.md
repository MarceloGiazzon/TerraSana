# Módulo 01 — Roçador e Manejo de Ervas Daninhas (AgBot)

## 1. Visão Geral
Roçada de vegetação rasteira e ervas daninhas sem o uso de herbicidas químicos.

## 2. Especificações Técnicas
- **Largura de Corte**: 500 mm
- **Sistema de Corte**: Disco duplo em Alumínio 6061-T6 c/ 4 lâminas flutuantes (Aço 1095)
- **Motorização**: BLDC IP67 600W (24V)
- **Atuador Linear**: 1000N IP67 (Curso 100mm, corte ajustável 20-120mm)
- **Sensores**: Hall (RPM) + Sensor Corrente (Anti-Stall)

## 3. Arquitetura ROS 2
- **Publica**: /mod01/telemetry (RPM, Corrente A, Altura mm)
- **Subscreve**: /mod01/cmd_height (Float32), /mod01/cmd_power (Bool)
- **Proteção Anti-Stall**: Corte do motor em I > 35A por >200ms e elevação automática.

## 4. BOM (Bill of Materials)
| Componente | Qtd | Custo Est. (R$) |
| :--- | :---: | :---: |
| Motor BLDC 600W 24V IP67 | 1 | R$ 750,00 |
| Atuador Linear 1000N IP67 | 1 | R$ 420,00 |
| Disco e Lâminas Flutuantes Aço 1095 | 1 | R$ 380,00 |
| Driver MOSFET Controller 24V 50A | 1 | R$ 350,00 |
| Conectores Deutsch DT 12-pin | 1 | R$ 150,00 |
| **TOTAL** | | **R$ 2.200,00** |
