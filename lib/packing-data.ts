/**
 * Campervan packing checklist for the trip. Ported from the family's working
 * list; `loc` is where it lives in the van. Vignette/pass items realigned to
 * this trip's actual route (no Switzerland; add Germany Umweltplakette +
 * France Crit'Air) to match the itinerary.
 */
export type PackingStatus = "have" | "need" | "buy";

export interface PackingItem {
  cat: string;
  name: string;
  loc: string;
  status: PackingStatus;
  note?: string;
  /** A "buy it here" link for purchasable items (vignettes, kit). */
  url?: string;
}

export const PACKING_ITEMS: PackingItem[] = [
  // Documents & money
  { cat: "Documents & money", name: "Passports (all 4)", loc: "Seat storage", status: "have", note: "Check expiry dates" },
  { cat: "Documents & money", name: "Driving licence", loc: "Seat storage", status: "have" },
  { cat: "Documents & money", name: "Vehicle V5C document", loc: "Glove box", status: "have" },
  { cat: "Documents & money", name: "Insurance certificate", loc: "Glove box", status: "need", note: "Green card no longer needed for the EU — carry the certificate" },
  { cat: "Documents & money", name: "Breakdown cover details", loc: "Glove box", status: "need" },
  { cat: "Documents & money", name: "GHIC cards (all 4)", loc: "Seat storage", status: "have" },
  { cat: "Documents & money", name: "Travel insurance documents", loc: "Seat storage", status: "need" },
  { cat: "Documents & money", name: "F1 tickets / booking confirmations", loc: "Seat storage", status: "have" },
  { cat: "Documents & money", name: "Campsite booking confirmations", loc: "Seat storage", status: "need", note: "Save offline — the app caches them too" },
  { cat: "Documents & money", name: "LeShuttle booking", loc: "Seat storage", status: "have" },
  { cat: "Documents & money", name: "Credit/debit cards", loc: "Seat storage", status: "have" },
  { cat: "Documents & money", name: "Cash (Euros + some GBP)", loc: "Seat storage", status: "need", note: "Get €200-300" },
  { cat: "Documents & money", name: "Austria digital vignette", loc: "Digital", status: "buy", note: "10-day (~€12) — valid immediately", url: "https://shop.asfinag.at/en/toll-products/digital-vignette/?type=car" },
  { cat: "Documents & money", name: "Hungary e-vignette (D2)", loc: "Digital", status: "have", note: "Purchased & printed — valid 24 Jul–2 Aug, plate DE75SXR" },
  { cat: "Documents & money", name: "Germany Umweltplakette", loc: "Windscreen", status: "buy", note: "Pick up at a DEKRA/TÜV en route — needed for Nuremberg", url: "https://www.tuv.com/germany/en/environmental-badge.html" },
  { cat: "Documents & money", name: "France Crit'Air sticker", loc: "Windscreen", status: "have", note: "Paper sticker already sorted", url: "https://www.certificat-air.gouv.fr/en/" },

  // Van equipment
  { cat: "Van equipment", name: "EHU cable (25m)", loc: "Rear floor cupboard", status: "have" },
  { cat: "Van equipment", name: "EU 2-pin adapter", loc: "Deep electrics cupboard", status: "need" },
  { cat: "Van equipment", name: "UK hook-up adapter", loc: "Deep electrics cupboard", status: "have" },
  { cat: "Van equipment", name: "Water hose + Aquaroll connector", loc: "Rear floor cupboard", status: "need" },
  { cat: "Van equipment", name: "Levelling wedges/ramps", loc: "Rear floor cupboard", status: "need" },
  { cat: "Van equipment", name: "Spirit level (2-way)", loc: "Deep electrics cupboard", status: "need" },
  { cat: "Van equipment", name: "Wheel chocks", loc: "Rear floor cupboard", status: "need" },
  { cat: "Van equipment", name: "Warning triangle", loc: "Rear", status: "have" },
  { cat: "Van equipment", name: "Hi-vis vests (x4)", loc: "Cab pockets", status: "need", note: "Required across the EU — keep in the cabin" },
  { cat: "Van equipment", name: "First aid kit", loc: "Cab", status: "have", note: "Mandatory in Austria, Hungary & Germany" },
  { cat: "Van equipment", name: "Fire extinguisher", loc: "Cab", status: "have" },
  { cat: "Van equipment", name: "Spare bulbs kit", loc: "Glove box", status: "need" },
  { cat: "Van equipment", name: "Spare fuses", loc: "Glove box", status: "need" },
  { cat: "Van equipment", name: "Jump leads", loc: "Rear", status: "need" },
  { cat: "Van equipment", name: "Tyre pressure gauge", loc: "Glove box", status: "need" },
  { cat: "Van equipment", name: "Tow rope", loc: "Rear", status: "need" },
  { cat: "Van equipment", name: "UK sticker/plate", loc: "Rear of van", status: "need", note: "GB stickers are no longer valid" },
  { cat: "Van equipment", name: "Headlamp beam deflectors", loc: "Glove box", status: "need", note: "For driving on the right" },

  // Outdoor furniture
  { cat: "Outdoor furniture", name: "Camping chairs (x4)", loc: "Rear floor cupboard", status: "need" },
  { cat: "Outdoor furniture", name: "Folding table", loc: "Rear floor cupboard", status: "need" },
  { cat: "Outdoor furniture", name: "Awning (Thule Omnistor 2.6m)", loc: "Van fitted", status: "have" },
  { cat: "Outdoor furniture", name: "Ground mat/outdoor rug", loc: "Rear floor cupboard", status: "need" },
  { cat: "Outdoor furniture", name: "Awning pegs + mallet", loc: "Rear floor cupboard", status: "need" },
  { cat: "Outdoor furniture", name: "BBQ (fold-up)", loc: "Rear floor cupboard", status: "buy", note: "Ridgemonkey or Weber Go-Anywhere" },
  { cat: "Outdoor furniture", name: "BBQ tools/tongs", loc: "Under sink", status: "need" },
  { cat: "Outdoor furniture", name: "Charcoal/gas canisters", loc: "Rear", status: "buy" },
  { cat: "Outdoor furniture", name: "Picnic blanket", loc: "Overhead full width", status: "need" },

  // Kitchen
  { cat: "Kitchen", name: "Pots and pans set", loc: "Under sink", status: "need", note: "Induction compatible" },
  { cat: "Kitchen", name: "Frying pan", loc: "Under sink", status: "need" },
  { cat: "Kitchen", name: "Kettle (collapsible)", loc: "Under sink", status: "need" },
  { cat: "Kitchen", name: "Chopping board", loc: "Under sink", status: "need" },
  { cat: "Kitchen", name: "Sharp knife + sleeve", loc: "Under sink", status: "need" },
  { cat: "Kitchen", name: "Cutlery set (x4)", loc: "Drawer", status: "need" },
  { cat: "Kitchen", name: "Plates (melamine x4)", loc: "Cupboard", status: "need" },
  { cat: "Kitchen", name: "Bowls (melamine x4)", loc: "Cupboard", status: "need" },
  { cat: "Kitchen", name: "Mugs (x4)", loc: "Cupboard", status: "need" },
  { cat: "Kitchen", name: "Glasses/cups (plastic x4)", loc: "Cupboard", status: "need" },
  { cat: "Kitchen", name: "Cooking utensils (spatula, spoon, tongs)", loc: "Drawer", status: "need" },
  { cat: "Kitchen", name: "Tin opener", loc: "Drawer", status: "need" },
  { cat: "Kitchen", name: "Bottle opener / corkscrew", loc: "Drawer", status: "need" },
  { cat: "Kitchen", name: "Scissors", loc: "Drawer", status: "need" },
  { cat: "Kitchen", name: "Colander (collapsible)", loc: "Under sink", status: "need" },
  { cat: "Kitchen", name: "Mixing bowl", loc: "Under sink", status: "need" },
  { cat: "Kitchen", name: "Food storage containers", loc: "Cupboard", status: "need" },
  { cat: "Kitchen", name: "Zip-lock bags (various sizes)", loc: "Cupboard", status: "buy" },
  { cat: "Kitchen", name: "Cling film / tin foil", loc: "Cupboard", status: "buy" },
  { cat: "Kitchen", name: "Tea towels (x3)", loc: "Cupboard", status: "need" },
  { cat: "Kitchen", name: "Non-slip mats (for crockery)", loc: "Cupboards", status: "buy", note: "Stops rattling!" },

  // Cleaning & household
  { cat: "Cleaning & household", name: "Washing up liquid", loc: "Under sink left", status: "buy" },
  { cat: "Cleaning & household", name: "Washing up bowl (collapsible)", loc: "Under sink left", status: "need" },
  { cat: "Cleaning & household", name: "Sponges / scourers", loc: "Under sink left", status: "buy" },
  { cat: "Cleaning & household", name: "Dish brush", loc: "Under sink left", status: "buy" },
  { cat: "Cleaning & household", name: "Drying rack / mat (silicone)", loc: "Under sink left", status: "buy" },
  { cat: "Cleaning & household", name: "Antibacterial spray", loc: "Under sink left", status: "buy" },
  { cat: "Cleaning & household", name: "Antibacterial wipes", loc: "Under sink left", status: "buy" },
  { cat: "Cleaning & household", name: "Surface cleaner", loc: "Under sink left", status: "buy" },
  { cat: "Cleaning & household", name: "Microfibre cloths (x4)", loc: "Under sink left", status: "buy", note: "Different colours for different jobs" },
  { cat: "Cleaning & household", name: "Bin bags (small + large)", loc: "Under sink left", status: "buy" },
  { cat: "Cleaning & household", name: "Dustpan and brush", loc: "Under sink left", status: "need" },
  { cat: "Cleaning & household", name: "Handheld vacuum", loc: "Deep electrics cupboard", status: "need" },
  { cat: "Cleaning & household", name: "Door mat / entrance rug", loc: "Door area", status: "need" },
  { cat: "Cleaning & household", name: "Laundry bag", loc: "Overhead", status: "need" },
  { cat: "Cleaning & household", name: "Travel washing line", loc: "Overhead", status: "buy" },
  { cat: "Cleaning & household", name: "Clothes pegs", loc: "Overhead", status: "buy" },
  { cat: "Cleaning & household", name: "Hand wash / soap", loc: "Sink area", status: "buy" },
  { cat: "Cleaning & household", name: "Hand sanitiser", loc: "Seat storage", status: "buy" },
  { cat: "Cleaning & household", name: "Paper towels / kitchen roll", loc: "Cupboard", status: "buy" },
  { cat: "Cleaning & household", name: "Toilet roll (x6)", loc: "Overhead", status: "buy" },

  // Bedding
  { cat: "Bedding", name: "Duvets (x2)", loc: "Overhead full width", status: "have" },
  { cat: "Bedding", name: "Pillows (x4)", loc: "Overhead full width", status: "have" },
  { cat: "Bedding", name: "Fitted sheets (bottom bed)", loc: "Overhead full width", status: "need" },
  { cat: "Bedding", name: "Fitted sheets (pop-top)", loc: "Overhead full width", status: "need" },
  { cat: "Bedding", name: "Pillow cases", loc: "Overhead full width", status: "need" },
  { cat: "Bedding", name: "Mattress topper", loc: "Overhead full width", status: "need" },
  { cat: "Bedding", name: "Blanket / throw", loc: "Overhead full width", status: "need" },

  // Toiletries
  { cat: "Toiletries", name: "Toothbrushes (x4)", loc: "Overhead right", status: "have" },
  { cat: "Toiletries", name: "Toothpaste", loc: "Overhead right", status: "buy" },
  { cat: "Toiletries", name: "Shampoo (travel size)", loc: "Overhead right", status: "buy" },
  { cat: "Toiletries", name: "Conditioner (travel size)", loc: "Overhead right", status: "buy" },
  { cat: "Toiletries", name: "Shower gel / soap", loc: "Overhead right", status: "buy" },
  { cat: "Toiletries", name: "Deodorant", loc: "Overhead right", status: "have" },
  { cat: "Toiletries", name: "Razor + shaving supplies", loc: "Overhead right", status: "have" },
  { cat: "Toiletries", name: "Hairbrush / comb", loc: "Overhead right", status: "have" },
  { cat: "Toiletries", name: "Hair ties / clips", loc: "Overhead right", status: "have" },
  { cat: "Toiletries", name: "Flip flops (for showers)", loc: "Rear vertical", status: "need" },
  { cat: "Toiletries", name: "Towels - bath (x4)", loc: "Overhead full width", status: "have" },
  { cat: "Toiletries", name: "Towels - beach/swim (x4)", loc: "Overhead full width", status: "have" },
  { cat: "Toiletries", name: "Quick-dry microfibre towels", loc: "Overhead", status: "need" },

  // Medical & safety
  { cat: "Medical & safety", name: "Prescription medications", loc: "Overhead right", status: "have" },
  { cat: "Medical & safety", name: "Paracetamol / ibuprofen", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Antihistamines", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Diarrhoea tablets (Imodium)", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Rehydration sachets", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Plasters / bandages", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Antiseptic cream", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Insect repellent", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "After-bite cream", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Sun cream (high SPF)", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Aftersun", loc: "Overhead right", status: "buy" },
  { cat: "Medical & safety", name: "Tweezers", loc: "Overhead right", status: "need" },
  { cat: "Medical & safety", name: "Nail clippers", loc: "Overhead right", status: "need" },
  { cat: "Medical & safety", name: "Travel sickness tablets", loc: "Seat storage", status: "buy" },

  // Tech & electronics
  { cat: "Tech & electronics", name: "Phone chargers (USB-C)", loc: "Deep electrics cupboard", status: "have" },
  { cat: "Tech & electronics", name: "Power bank (large)", loc: "Deep electrics cupboard", status: "have" },
  { cat: "Tech & electronics", name: "EU plug adapters (x2)", loc: "Deep electrics cupboard", status: "buy" },
  { cat: "Tech & electronics", name: "USB multi-charger", loc: "Deep electrics cupboard", status: "need" },
  { cat: "Tech & electronics", name: "Tablet chargers", loc: "Deep electrics cupboard", status: "have" },
  { cat: "Tech & electronics", name: "Camera (Sony a6400)", loc: "Deep electrics cupboard", status: "have" },
  { cat: "Tech & electronics", name: "Camera lenses (Sigma 18-50, 56mm)", loc: "Deep electrics cupboard", status: "have" },
  { cat: "Tech & electronics", name: "Camera charger + spare battery", loc: "Deep electrics cupboard", status: "have" },
  { cat: "Tech & electronics", name: "SD cards (spare)", loc: "Deep electrics cupboard", status: "need" },
  { cat: "Tech & electronics", name: "Torch / headtorch", loc: "Deep electrics cupboard", status: "need" },
  { cat: "Tech & electronics", name: "Lantern (rechargeable)", loc: "Deep electrics cupboard", status: "need" },
  { cat: "Tech & electronics", name: "Fans (TITAN magnetic x2)", loc: "Deep electrics cupboard", status: "buy", note: "Amazon UK" },
  { cat: "Tech & electronics", name: "GL.iNet router + EU eSIM", loc: "Deep electrics cupboard", status: "buy" },
  { cat: "Tech & electronics", name: "Headphones (kids)", loc: "Seat storage", status: "have" },

  // Entertainment
  { cat: "Entertainment", name: "Tablets / iPads", loc: "Seat storage", status: "have" },
  { cat: "Entertainment", name: "Books / Kindle", loc: "Overhead right", status: "have" },
  { cat: "Entertainment", name: "Playing cards", loc: "Overhead right", status: "need" },
  { cat: "Entertainment", name: "Board games (travel size)", loc: "Overhead right", status: "need" },
  { cat: "Entertainment", name: "Colouring books / activity books", loc: "Seat storage", status: "need" },
  { cat: "Entertainment", name: "Pens / pencils", loc: "Seat storage", status: "need" },
  { cat: "Entertainment", name: "Football", loc: "Rear", status: "need" },
  { cat: "Entertainment", name: "Frisbee", loc: "Rear", status: "need" },

  // Clothing
  { cat: "Clothing", name: "Packing cubes (x4 sets)", loc: "Overhead / rear", status: "need" },
  { cat: "Clothing", name: "T-shirts / tops (5-7 each)", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Shorts (3-4 each)", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Trousers / jeans (2 each)", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Underwear (7+ each)", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Socks (7+ pairs each)", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Pyjamas", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Hoodies / jumpers", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Light jacket / fleece", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Waterproof jacket", loc: "Packing cubes", status: "have" },
  { cat: "Clothing", name: "Trainers / walking shoes", loc: "Rear vertical left", status: "have" },
  { cat: "Clothing", name: "Flip flops / sandals", loc: "Rear vertical left", status: "have" },
  { cat: "Clothing", name: "Sunglasses (all)", loc: "Seat storage", status: "have" },
  { cat: "Clothing", name: "Sun hats / caps", loc: "Seat storage", status: "need" },
  { cat: "Clothing", name: "F1 merchandise / team gear", loc: "Packing cubes", status: "need" },

  // Dog gear (Obi)
  { cat: "Dog gear (Obi)", name: "Dog food (enough for trip)", loc: "Rear vertical right", status: "buy" },
  { cat: "Dog gear (Obi)", name: "Dog bowls (food + water)", loc: "Rear vertical right", status: "have" },
  { cat: "Dog gear (Obi)", name: "Dog lead", loc: "Rear vertical right", status: "have" },
  { cat: "Dog gear (Obi)", name: "Dog harness", loc: "Rear vertical right", status: "have" },
  { cat: "Dog gear (Obi)", name: "Dog bed / blanket", loc: "Rear vertical right", status: "have" },
  { cat: "Dog gear (Obi)", name: "Dog towel", loc: "Rear vertical right", status: "need" },
  { cat: "Dog gear (Obi)", name: "Poo bags", loc: "Rear vertical right", status: "buy" },
  { cat: "Dog gear (Obi)", name: "Dog treats", loc: "Rear vertical right", status: "buy" },
  { cat: "Dog gear (Obi)", name: "Dog toys", loc: "Rear vertical right", status: "have" },
  { cat: "Dog gear (Obi)", name: "Pet passport / vaccination records", loc: "Seat storage", status: "need", note: "Check requirements for each country" },
  { cat: "Dog gear (Obi)", name: "Tick remover", loc: "Overhead right", status: "buy" },

  // Food staples
  { cat: "Food staples", name: "Tea bags", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Coffee (instant or pods)", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Sugar", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Salt & pepper", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Cooking oil", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Pasta", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Rice", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Tinned food (beans, tomatoes)", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Cereal / porridge", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Snacks (crisps, biscuits)", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Squash / juice", loc: "Fridge", status: "buy" },
  { cat: "Food staples", name: "Long-life milk (backup)", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Herbs & spices", loc: "Kitchen cupboard", status: "buy" },
  { cat: "Food staples", name: "Ketchup / sauces", loc: "Fridge", status: "buy" },
  { cat: "Food staples", name: "Butter / spread", loc: "Fridge", status: "buy" },
  { cat: "Food staples", name: "Cheese", loc: "Fridge", status: "buy" },
  { cat: "Food staples", name: "Bread", loc: "Kitchen", status: "buy", note: "Buy fresh as you go" },
  { cat: "Food staples", name: "Water bottles (reusable x4)", loc: "Kitchen", status: "need" },

  // Tools & repairs
  { cat: "Tools & repairs", name: "Basic toolkit (screwdrivers, pliers)", loc: "Rear", status: "need" },
  { cat: "Tools & repairs", name: "Gaffer tape", loc: "Rear", status: "buy" },
  { cat: "Tools & repairs", name: "Cable ties", loc: "Rear", status: "buy" },
  { cat: "Tools & repairs", name: "WD-40", loc: "Rear", status: "need" },
  { cat: "Tools & repairs", name: "Spare batteries (AA, AAA)", loc: "Deep electrics cupboard", status: "buy" },
  { cat: "Tools & repairs", name: "Superglue", loc: "Deep electrics cupboard", status: "buy" },
  { cat: "Tools & repairs", name: "Sewing kit (mini)", loc: "Overhead right", status: "buy" },

  // Miscellaneous
  { cat: "Miscellaneous", name: "Sunshade for windscreen", loc: "Cab", status: "need" },
  { cat: "Miscellaneous", name: "Thermal window covers", loc: "Cab", status: "have" },
  { cat: "Miscellaneous", name: "Umbrella", loc: "Cab", status: "need" },
  { cat: "Miscellaneous", name: "Reusable shopping bags", loc: "Rear", status: "need" },
  { cat: "Miscellaneous", name: "Cool bag (for day trips)", loc: "Rear", status: "need" },
  { cat: "Miscellaneous", name: "Binoculars (for F1)", loc: "Seat storage", status: "need" },
  { cat: "Miscellaneous", name: "Ear plugs", loc: "Overhead right", status: "buy", note: "For the F1 and noisy campsites" },
  { cat: "Miscellaneous", name: "Eye masks", loc: "Overhead right", status: "buy" },
  { cat: "Miscellaneous", name: "Magnetic hooks", loc: "Various", status: "buy", note: "Handy for hanging things" },
  { cat: "Miscellaneous", name: "Bungee cords", loc: "Rear", status: "buy" },
  { cat: "Miscellaneous", name: "Portable radio (DAB)", loc: "Deep electrics cupboard", status: "need", note: "For F1 commentary" },
];

export const PACKING_CATEGORIES = [...new Set(PACKING_ITEMS.map((i) => i.cat))];
