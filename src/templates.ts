export const TEMPLATE_FLIGHTS = [
  "       DEPARTURES       ",
  "FLIGHT  DESTINATION     ",
  "------------------------",
  "BA284   LONDON       ON ",
  "AF178   PARIS        ON ",
  "LH401   FRANKFURT    DEL",
  "EK015   DUBAI        ON ",
  "JL002   TOKYO        BRD"
];

export const TEMPLATE_WEATHER = [
  "     LOCAL  WEATHER     ",
  "                        ",
  "CITY: NEW YORK          ",
  "TEMP: 24C               ",
  "COND: PARTLY CLOUDY     ",
  "WIND: 15 KM/H           ",
  "HUMI: 60%               ",
  "                        "
];

export const TEMPLATE_SPOTIFY = [
  "NOW PLAYING...          ",
  "                        ",
  "SONG:   BLINDING LIGHTS ",
  "ARTIST: THE WEEKND      ",
  "ALBUM:  AFTER HOURS     ",
  "                        ",
  "         > ||           ",
  "                        "
];

export const generateId = () => Math.random().toString(36).substring(2, 9);
