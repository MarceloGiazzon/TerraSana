# Módulo 07 — Climatizador e Gerenciador de Estufas / Cogumelos

## 1. Visão Geral
Monitoramento e controle microclimático para estufas e salas de cultivo de cogumelos.

## 2. Especificações Técnicas
- **Nebulização**: Gerador piezoelétrico ultrassônico Inox 2,4 MHz (1,5 L/h)
- **Ventilação**: Soprador axial IP68 c/ Filtro HEPA H13
- **Sensores**: Sensor NDIR CO2 (0-10.000 ppm), Temp/Umidade SHT40, Radiação PAR

## 3. Arquitetura ROS 2
Controle em malha fechada PID local para CO2 (<800 ppm) e Umidade (>85%).

## 4. BOM (Bill of Materials)
| Componente | Qtd | Custo Est. (R$) |
| :--- | :---: | :---: |
| Nebulizador Ultrassônico Inox | 1 | R$ 380,00 |
| Soprador IP68 + Caixa HEPA H13 | 1 | R$ 320,00 |
| Sensor NDIR CO2 RS485 | 1 | R$ 290,00 |
| Sensor Temp/Umidade SHT40 IP67 | 1 | R$ 180,00 |
| Case ESP32-S3 + Deutsch DT | 1 | R$ 280,00 |
| **TOTAL** | | **R$ 1.450,00** |
