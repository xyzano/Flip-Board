export const TEMPLATE_FLIGHTS = [
  "   DEPARTURES    ",
  "FLIGHT DESTINATION ",
  "------------------",
  "BA284  LONDON      ",
  "AF178  PARIS       ",
  "LH401  FRANKFURT   ",
  "EK015  DUBAI       ",
  "JL002  TOKYO       "
];

export const TEMPLATE_WEATHER = [
  "   LOCAL WEATHER   ",
  "                   ",
  "CITY: NEW YORK     ",
  "TEMP: 24C          ",
  "COND: PARTLY CLOUD ",
  "WIND: 15 KM/H      ",
  "HUMI: 60%          ",
  "                   "
];

export const TEMPLATE_SPOTIFY = [
  "NOW PLAYING...     ",
  "                   ",
  "SONG: BINDING LIGHT",
  "ARTIST: THE WEEKND ",
  "ALBUM: AFTER HOURS ",
  "                   ",
  "        > ||       ",
  "                   "
];

export const generateId = () => Math.random().toString(36).substring(2, 9);
