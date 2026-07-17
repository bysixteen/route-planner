/**
 * Confirmed booking extras — details that arrive in confirmation emails
 * (check-in windows, reference numbers, links, reminders) but aren't in the
 * trip database. Surfaced in the stop detail panel. Keyed by reservation
 * reference where the stop has one, otherwise by stop name.
 */
export interface BookingRef {
  label: string;
  value: string;
}

export interface TollInfo {
  /** Toll road or vignette name, e.g. "Austrian vignette (ASFINAG)". */
  name: string;
  /** "vignette" = buy before you reach the country; "booth" = pay at the gate. */
  type: "vignette" | "booth";
  /** Short context note. */
  notes?: string;
  /** Payment methods accepted, e.g. ["Card", "Cash (€)"]. */
  payment: string[];
  /** Typical cost including validity period, e.g. "€10.20 (10 days)". */
  cost?: string;
  /** URL to purchase online. */
  buyUrl?: string;
}

export interface BookingExtra {
  /** Check-in window, e.g. "12:00 – 23:00". */
  checkIn?: string;
  /** Check-out window, e.g. "07:00 – 11:30". */
  checkOut?: string;
  /** A heads-up for arrival (e.g. pitch/Wi-Fi sent the night before). */
  arrivalNote?: string;
  /** Additional copyable reference numbers (tunnel, F1 tickets…). */
  refs?: BookingRef[];
  /** Link to the campsite / operator info page. */
  siteInfoUrl?: string;
  siteInfoLabel?: string;
  /** Action items / things to note before travelling. */
  reminders?: string[];
  /** Postal address (from the confirmation email) — primary satnav target. */
  address?: string;
  /** Whether a campervan awning may be pitched here. */
  awning?: "yes" | "no" | "conditional";
  /** Short context for the awning rule (source / caveat). */
  awningNote?: string;
  /**
   * Marks a stop as booked when the confirmation only exists in a forwarded
   * email (no DB reference yet). Drives the booked status/ring/count.
   */
  confirmed?: boolean;
  /**
   * Payment progress, shown in the stop panel as "Paid in full" or
   * "Paid X · Y outstanding". `total` defaults to the stop's `cost`,
   * `currency` to the stop's currency. Set `paidInFull` for a simple
   * fully-paid marker without needing figures.
   */
  payment?: {
    total?: number;
    paid?: number;
    currency?: string;
    paidInFull?: boolean;
    /** Free-text override, e.g. "Deposit €20, balance on arrival". */
    note?: string;
  };
  /**
   * Campsite service facilities (laundry, shop, bar, playground, etc.).
   * Curated from the campsite's own website — shown in the "Campsite facilities" widget.
   */
  campsiteAmenities?: string[];
  /**
   * Sports & leisure facilities (pool, tennis, bike hire, etc.).
   * Shown in the "Sports & leisure" widget.
   */
  sports?: string[];
  /**
   * Tolls or vignettes required for the leg into or through this stop's country.
   * Shown in the "Tolls & vignettes" widget.
   */
  tolls?: TollInfo[];
}

const BY_REF: Record<string, BookingExtra> = {
  // Camping Memling, Bruges (18–20 Jul)
  RE792256C: {
    payment: { paidInFull: true },
    address: "Veltemweg 109, 8310 Brugge, Belgium",
    checkIn: "12:00 – 23:00",
    checkOut: "07:00 – 11:30",
    arrivalNote:
      "Pitch number & Wi-Fi code arrive by email the evening before arrival.",
    siteInfoUrl: "https://www.brugescamping.be/en/faq",
    siteInfoLabel: "Campsite map & transport",
    awning: "conditional",
    awningNote:
      "Room for the van plus an awning, but pitches are small and close together.",
    campsiteAmenities: ["Laundry", "Tumble dryer", "BBQ (permitted)"],
    sports: [],
  },
};

const BY_NAME: Record<string, BookingExtra> = {
  // Overnight before the outbound crossing — The Dog House, Smeeth (near the
  // Folkestone LeShuttle / Eurotunnel terminal).
  Smeeth: {
    refs: [{ label: "LeShuttle", value: "13449491" }],
    siteInfoUrl: "https://www.leshuttle.com",
    siteInfoLabel: "LeShuttle",
    reminders: [
      "Add Advance Passenger Information (API) for every passenger before check-in — passport details, legal requirement or you can't travel.",
      "UK nationals don't need a UK ETA.",
    ],
    tolls: [
      {
        name: "A16 motorway toll (France)",
        type: "booth",
        notes: "Short section from Calais heading towards Belgium — a few euros. Pay at the barrier on exit.",
        payment: ["Card (contactless)", "Cash (€)"],
      },
    ],
  },
  // Château du Gandspette (Éperlecques) — last night before the return crossing
  Calais: {
    payment: { paidInFull: true },
    address: "133 rue du Gandspette, 62910 Éperlecques, France",
    tolls: [
      {
        name: "A16/A26 motorway toll (France)",
        type: "booth",
        notes: "Applies on the return leg from Belgium into France and on the A26 towards Calais. Pay at the barrier on exit. A few euros.",
        payment: ["Card (contactless)", "Cash (€)"],
      },
    ],
    refs: [
      { label: "LeShuttle", value: "13449491" },
      { label: "Gandspette", value: "17760062" },
    ],
    siteInfoUrl: "https://www.leshuttle.com",
    siteInfoLabel: "LeShuttle",
    awning: "yes",
    awningNote:
      "Gandspette allows 1 awning per pitch (100–150 m² grassy pitches).",
    reminders: [
      "Return crossing — add Advance Passenger Information (API) before check-in.",
    ],
    campsiteAmenities: ["Laundry", "Tumble dryer", "Bar & restaurant", "Playground", "Accessible"],
    sports: ["Heated swimming pool", "Tennis", "Multi-sports court", "Outdoor fitness"],
  },
  // Hungarian GP tickets
  Hungaroring: {
    payment: { paidInFull: true },
    refs: [{ label: "F1 tickets", value: "F1HU653445" }],
    reminders: [
      "Tickets printed.",
      "Motorsport Tickets Ltd has ceased trading — your tickets remain valid at the gate.",
    ],
  },
  // Camping Bissen, Luxembourg (booked)
  Luxembourg: {
    payment: { paidInFull: true },
    address: "11 Millewee, L-9659 Heiderscheidergrund, Luxembourg",
    reminders: [
      "Awning policy isn't published — worth confirming the pitch fits an awning with reception.",
    ],
    campsiteAmenities: ["Laundry", "Tumble dryer", "Shop", "Bar & restaurant", "Playground", "Accessible"],
    sports: ["Spa & sauna (bookable)", "Bike hire", "Volleyball", "Kayaking"],
  },
  // Camping Carpe Diem, Wildberg (booked) — 90 parcelled pitches
  Wildberg: {
    payment: { paidInFull: true },
    address: "Martinshölzle 6-8, 72218 Wildberg, Germany",
    reminders: [
      "Awning policy isn't published — parcelled pitches, so confirm awning room with reception.",
    ],
    campsiteAmenities: ["Laundry", "Tumble dryer", "Bar & snack bar", "Playground"],
    sports: ["Swimming pool (unheated, Jul–Aug)", "Badminton", "Table tennis"],
    tolls: [
      {
        name: "Austrian motorway vignette (ASFINAG)",
        type: "vignette",
        notes: "Required on all Austrian motorways — buy before crossing the border. Digital vignette only from 2027 (physical stickers discontinued). Also available at Austrian border petrol stations.",
        payment: ["Card", "PayPal", "Amazon Pay"],
        cost: "€10.20 (10 days)",
        buyUrl: "https://shop.asfinag.at/en/",
      },
    ],
  },
  // Gerhardhof, Wildermieming (Ref 2026-034828) — booked "Stellplatz Transit"
  Wildermieming: {
    payment: { paid: 18.09 },
    address: "Gerhardhof 1, 6413 Wildermieming, Austria",
    arrivalNote: "Gerhardhof 1, 6413 Wildermieming. Reception +43 5264 5240.",
    awning: "conditional",
    awningNote:
      "Awnings are usually fine here, but this is a 1-night transit pitch — phone ahead to confirm (+43 5264 5240).",
    campsiteAmenities: ["Laundry", "Tumble dryer", "Dishwasher", "Shop", "Restaurant", "BBQ area", "Playground"],
    sports: ["Natural swimming pond", "Sports field", "Beach volleyball", "Bike hire"],
  },
  // Wachau (Melk) — Campingplatz der Stadt Melk, 23–24 Jul, pitch 8
  Wachau: {
    confirmed: true,
    address: "Kolomaniau 1/1, 3390 Melk, Austria",
    checkIn: "16:00 – 18:00",
    checkOut: "08:00 – 10:00",
    arrivalNote:
      "Arrive before 17:00, or phone the wardens (+43 676 844 715 6540) if you'll be later. Vacate the pitch by 11:00.",
    refs: [{ label: "Pitch", value: "Stellplatz 8" }],
    siteInfoUrl: "https://www.stadt-melk.at",
    siteInfoLabel: "Campingplatz Melk",
    reminders: [
      "Use the Pre-Check-In link in the confirmation email to save time at arrival.",
      "Awning policy isn't stated — confirm with the wardens on arrival.",
    ],
    campsiteAmenities: ["Laundry", "Tumble dryer", "Kitchen", "Shop", "BBQ area"],
    sports: ["Bike hire"],
  },
  // Donaupark Camping Klosterneuburg (ÖAMTC) — 27–28 Jul, awning confirmed by site
  Klosterneuburg: {
    payment: { paid: 0 },
    address: "In der Au 1, 3400 Klosterneuburg, Austria",
    checkIn: "From 12:00",
    arrivalNote:
      "Barrier open until 22:00. If reception is closed on arrival, free-pitch info is posted by the reception entrance. In der Au 1, 3400 Klosterneuburg (+43 2243 25877).",
    awning: "yes",
    awningNote:
      "Drive-away awning confirmed fine by reception (Dejana); no extra charge mentioned.",
    siteInfoUrl: "https://www.campingklosterneuburg.at/app/de",
    siteInfoLabel: "Donaupark Camping",
    reminders: ["Balance due on arrival — pay at reception by card or cash."],
    campsiteAmenities: ["Laundry", "Tumble dryer", "Dishwasher", "Shop", "Restaurant & bar", "Playground", "BBQ (permitted)", "Accessible"],
    sports: ["Bike hire", "Heated pools (Happyland, adj.)", "Sauna (Happyland, adj.)", "Tennis (Happyland, adj.)", "Gym (Happyland, adj.)"],
    tolls: [
      {
        name: "Hungarian e-Matrica",
        type: "vignette",
        notes: "Required before entering Hungary. Buy online or at border petrol stations and staffed kiosks. D2 category (passenger car / campervan up to 3.5 t).",
        payment: ["Card (online)", "Cash (border kiosks)"],
        cost: "~€15 (10 days)",
        buyUrl: "https://e-autopalyamatrica.hu/en",
      },
    ],
  },
  // Camping Gülser Moselbogen, Koblenz — large pitches with a paved awning area
  Koblenz: {
    payment: { note: "Balance due on arrival" },
    address: "Am Gülser Moselbogen 20, 56072 Koblenz-Güls, Germany",
    awning: "yes",
    awningNote:
      "Large ~100 m² pitches with a paved area in front specifically for awnings.",
    campsiteAmenities: ["Laundry", "Tumble dryer", "Dishwasher", "Shop", "Bar & pizzeria", "Playground", "Accessible"],
    sports: ["Bike hire (city & e-bikes)", "Sports field (football, volleyball, basketball)"],
  },
  // KNAUS Campingpark Nürnberg (booked)
  Nuremberg: {
    payment: { paid: 38 },
    address: "Hans-Kalb-Straße 56, 90471 Nürnberg, Germany",
    reminders: [
      "Awning policy isn't published — confirm awning room for your pitch with reception.",
    ],
    campsiteAmenities: ["Laundry", "Tumble dryer", "Kitchen", "Shop", "Bar & bistro", "Playground", "Accessible"],
    sports: ["Table tennis", "Outdoor pool (250 m, unheated)"],
  },
};

export function getBookingExtraForStop(stop: {
  booking_reference?: string | null;
  name: string;
}): BookingExtra | undefined {
  return (
    (stop.booking_reference ? BY_REF[stop.booking_reference] : undefined) ??
    BY_NAME[stop.name]
  );
}
