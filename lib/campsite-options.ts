/**
 * Campsite options for TBD stops — rendered as purple dots on the map.
 * Each option is associated with a stop by name.
 * All sites verified on TripAdvisor, camping.info, campercontact, and/or forums.
 * All accept campervans/motorhomes.
 */
export interface CampsiteOption {
  stop: string;
  id: string;
  name: string;
  coords: [number, number]; // [lng, lat]
  rating: string;
  price: string;
  url: string;
  rec?: boolean;
  booked?: boolean;
  bookingRef?: string;
}

export const CAMPSITE_OPTIONS: CampsiteOption[] = [
  // ── Stop: Swabian Alb (21 Jul) — 10 options, broadened west ──
  // Black Forest
  {
    stop: "Swabian Alb",
    id: "S1",
    name: "Natur-Camping Langenwald, Freudenstadt",
    coords: [8.3727, 48.4588],
    rating: "4.8/5",
    price: "€56/nt",
    url: "https://camping-langenwald.de/en/welcome/",
    rec: true,
  },
  {
    stop: "Swabian Alb",
    id: "S2",
    name: "Family-Resort Kleinenzhof, Bad Wildbad",
    coords: [8.5762, 48.7374],
    rating: "4.2/5",
    price: "€64/nt",
    url: "https://www.kleinenzhof.de/en/",
  },
  {
    stop: "Swabian Alb",
    id: "S3",
    name: "Camping Schuttehof, Horb am Neckar",
    coords: [8.6728, 48.4525],
    rating: "4.1/5",
    price: "€46/nt",
    url: "https://xn--camping-schttehof-d3b.de/our-campsite/",
  },
  // Neckar Valley
  {
    stop: "Swabian Alb",
    id: "S4",
    name: "Neckarcamping Tübingen",
    coords: [9.0360, 48.5106],
    rating: "8.0/10 ADAC",
    price: "€41/nt",
    url: "https://www.neckarcamping.de/",
    rec: true,
  },
  {
    stop: "Swabian Alb",
    id: "S5",
    name: "Campingplatz Paul Walther, Rottenburg",
    coords: [8.9459, 48.4539],
    rating: "9.7/10 ADAC",
    price: "€50/nt",
    url: "https://www.rottenburg.de/campingplatz+paul+walther.28001.htm",
  },
  // On-route (A8)
  {
    stop: "Swabian Alb",
    id: "S6",
    name: "Camping Aichelberg (A8)",
    coords: [9.5549, 48.6396],
    rating: "4.0/5",
    price: "€25/nt",
    url: "https://camping-aichelberg.de/en/",
  },
  // Upper Swabia / Bodensee
  {
    stop: "Swabian Alb",
    id: "S7",
    name: "Campingplatz Sigmaringen (Danube)",
    coords: [9.2095, 48.0850],
    rating: "3.7/5",
    price: "€30/nt",
    url: "https://www.outandback.de/campingplatz_sigmaringen.html",
  },
  {
    stop: "Swabian Alb",
    id: "S8",
    name: "Camping & Ferienpark Orsingen",
    coords: [8.9367, 47.8421],
    rating: "4.5/5",
    price: "€36/nt",
    url: "https://www.camping-orsingen.de/",
  },
  {
    stop: "Swabian Alb",
    id: "S9",
    name: "Camping Hegne, Bodensee",
    coords: [9.0975, 47.7037],
    rating: "4.4/5",
    price: "€58/nt",
    url: "https://camping-hegne.de/en/camping-lake-constance/",
  },
  {
    stop: "Swabian Alb",
    id: "S10",
    name: "Camping Carpe Diem, Wildberg",
    coords: [8.7350, 48.6114],
    rating: "4.0/5",
    price: "€46/nt",
    url: "https://www.campingcarpediem.de/english/",
    booked: true,
    bookingRef: "R-00005972",
  },

  // ── Stop: Tirol (Innsbruck area, 22 Jul) — 7 options ──
  {
    stop: "Tirol",
    id: "T1",
    name: "Gerhardhof, Wildermieming",
    coords: [11.0360, 47.3142],
    rating: "4.6/5",
    price: "€45/nt",
    url: "https://www.gerhardhof.com",
    rec: true,
    booked: true,
    bookingRef: "2026-034828",
  },
  {
    stop: "Tirol",
    id: "T2",
    name: "Ferienparadies Natterer See",
    coords: [11.3419, 47.2374],
    rating: "4.5/5",
    price: "€51–73/nt",
    url: "https://www.natterersee.com/en/",
  },
  {
    stop: "Tirol",
    id: "T3",
    name: "Schloss Camping Aschach, Volders",
    coords: [11.5722, 47.2873],
    rating: "4.2/5",
    price: "€30–40/nt",
    url: "https://www.schlosscamping.com/en",
  },
  {
    stop: "Tirol",
    id: "T4",
    name: "Schwimmbad Camping, Hall in Tirol",
    coords: [11.4967, 47.2842],
    rating: "4.0/5",
    price: "€22–26/nt",
    url: "https://www.hall-wattens.at/en/hall-in-tirol/accommodation/details/campsite/camping-hall.html",
  },
  {
    stop: "Tirol",
    id: "T5",
    name: "Camping Inntal, Wiesing",
    coords: [11.8053, 47.4053],
    rating: "4.2/5",
    price: "€38–46/nt",
    url: "https://www.camping-inntal.at/en/",
  },
  {
    stop: "Tirol",
    id: "T6",
    name: "Camping Eichenwald, Stams",
    coords: [10.9866, 47.2747],
    rating: "4.1/5",
    price: "€29–34/nt",
    url: "https://www.camping-eichenwald.at",
  },
  {
    stop: "Tirol",
    id: "T7",
    name: "Alpencamping Mark, Weer",
    coords: [11.6492, 47.3063],
    rating: "4.5/5",
    price: "€25–44/nt",
    url: "https://www.alpencampingmark.com/en/",
  },

  // ── Stop: Wachau (Melk area, 23 Jul) — 7 options ──
  {
    stop: "Wachau",
    id: "W1",
    name: "Donaucamping Emmersdorf",
    coords: [15.3402, 48.2428],
    rating: "4.7/5",
    price: "€32–40/nt",
    url: "https://www.donaucamping-emmersdorf.at",
    rec: true,
  },
  {
    stop: "Wachau",
    id: "W2",
    name: "Wachau Camping Schönbühel",
    coords: [15.3710, 48.2541],
    rating: "5.0/5",
    price: "€41–46/nt",
    url: "https://www.wachaucamping-schoenbuehel.at/",
  },
  {
    stop: "Wachau",
    id: "W3",
    name: "Langthaler Farm, Pömling",
    coords: [15.2980, 48.2553],
    rating: "4.0/5",
    price: "€10–15/nt",
    url: "https://www.gasthaus-langthaler.at",
  },
  {
    stop: "Wachau",
    id: "W4",
    name: "Stellplatz Aggsbach Markt",
    coords: [15.3961, 48.2870],
    rating: "3.6/5",
    price: "€25–30/nt",
    url: "https://www.donau.com/en/wachau-nibelungengau-kremstal/sleeping-reservations/detailseite-hotel/camping/wohnmobilstellplatz-aggsbach-markt/",
  },
  {
    stop: "Wachau",
    id: "W5",
    name: "Wachau Camping Rossatz",
    coords: [15.5167, 48.3900],
    rating: "4.4/5",
    price: "€32–45/nt",
    url: "https://www.wachaucamping-rossatz.at",
  },
  {
    stop: "Wachau",
    id: "W6",
    name: "Campingplatz Melk",
    coords: [15.3277, 48.2324],
    rating: "3.5/5",
    price: "€30/nt",
    url: "https://www.visitmelk.com/en/melk-besuchen/unterbringung/campingplatz",
  },
  {
    stop: "Wachau",
    id: "W7",
    name: "ÖAMTC Donau Camping Krems",
    coords: [15.5925, 48.4038],
    rating: "3.8/5",
    price: "€51/nt",
    url: "https://www.campingkrems.at/en/",
  },

  // ── Stop: Belgium (first overnight, ~19–20 Jul) — 5 options ──
  {
    stop: "Belgium",
    id: "B1",
    name: "Camping Hof van Eeden, Heultje",
    coords: [4.82211, 51.08814],
    rating: "7.8/10",
    price: "€32/nt",
    url: "https://www.eurocampings.co.uk/belgium/antwerp/heultje/camping-hof-van-eeden-107861/",
  },
  {
    stop: "Belgium",
    id: "B2",
    name: "Camping Siesta, Wechelderzande",
    coords: [4.660, 51.252],
    rating: "8.5/10",
    price: "€31–37/nt",
    url: "https://www.eurocampings.co.uk/belgium/antwerp/wechelderzande/camping-siesta-125394/",
    rec: true,
  },
  {
    stop: "Belgium",
    id: "B3",
    name: "Camping Houtum, Kasterlee",
    coords: [4.97781, 51.23311],
    rating: "8.9/10",
    price: "€35–37/nt",
    url: "https://www.eurocampings.co.uk/belgium/antwerp/kasterlee/camping-houtum-100007/",
    rec: true,
  },
  {
    stop: "Belgium",
    id: "B4",
    name: "City Camping Antwerp",
    coords: [4.39261, 51.23347],
    rating: "7.0/10",
    price: "€41–50/nt",
    url: "https://www.eurocampings.co.uk/belgium/antwerp/antwerp/city-camping-antwerp-109400/",
  },
  {
    stop: "Belgium",
    id: "B5",
    name: "Urban Gardens, Ghent",
    coords: [3.68097, 51.04622],
    rating: "6.7/10",
    price: "€46–56/nt",
    url: "https://www.eurocampings.co.uk/belgium/east-flanders/ghent/urban-gardens-101639/",
  },
];
