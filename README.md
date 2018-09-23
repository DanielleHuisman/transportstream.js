# transportstream.js

JavaScript MPEG transport stream decoder/player.

**Note:** *this project is heavily under development and nowhere near complete.*

## Implemented standards
- [ ] Transport Stream (ISO/IEC 13818-1)
  - [x] Program Association Table (PAT)
  - [x] Program Map Table (PMT)
  - [ ] Conditional Access Table (CAT)
  - [x] Packetized Elementary Stream (PES)
- [ ] DVB Service Information (ETSI EN 300 468)
  - [x] Network Information Table (NIT)
  - [ ] Bouquet Association Table (BAT)
  - [x] Service Description Table (SDT)
  - [x] Event Information Table (EIT)
  - [x] Time and Date Table (TDT)
  - [x] Time Offset Table (TOT)
  - [ ] Running Status Table (RST)
  - [ ] Discontinuity Information Table (DIT)
  - [ ] Selection Information Table (SIT)
- [ ] H.264 (ITU-T REC H.264) / MPEG-4 AVC (ISO/IEC 14496-10)
  - [x] Network Abstraction Layer (NAL)
  - [ ] *NAL unit payloads*
- [ ] H.265 (ITU-T REC H.265) / MPEG-H HEVC (ISO/IEC 23008–2)
  - *TODO*
- [ ] DVB Subtitling systems (ETSI EN 300 743)
  - Parsing
    - [x] Page Composition
    - [x] Region Composition
    - [x] CLUT Definition
    - [x] Object data
    - [x] Display Definition
    - [ ] Disparity Signaling
    - [ ] Alternative CLUT
    - [x] End of Display Set
    - [x] Stuffing
  - Rendering
    - [ ] Display
    - [x] Page
    - [x] Region
    - [ ] Object
      - [ ] Pixels
        - [ ] 2-bit code
        - [x] 4-bit code
        - [ ] 8-bit code
        - [ ] 2-to-4 table
        - [ ] 2-to-8 table
        - [ ] 4-to-8 table
      - [ ] Text
      - [ ] Compressed pixels
    - [ ] CLUT
      - [ ] 2-bit
      - [x] 4-bit
      - [ ] 8-bit
    - [ ] Disparity Signaling
    - [ ] Alternative CLUT
- *TODO*
