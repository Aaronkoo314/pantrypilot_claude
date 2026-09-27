/*
 * The one USDA FoodData Central record each ingredient's "One figure you can
 * check" panel cites, or null where USDA holds no record of that food.
 *
 * PS4 finding from MML (heuristic #2, severity 3): the lookup used to search by
 * name and take the first hit, and "Minced Chicken" came back as canned
 * luncheon meat. A sweep of all 93 ingredients on 27 September 2026 found the
 * same fault in about a quarter of the records shown (potato bread for
 * Potatoes, milk crackers for Milk, chicken skin for Chicken Thigh, egg white
 * for Eggs). So each record is now chosen by hand from USDA's Foundation and
 * SR Legacy lists: the same food, in the form the recipe uses it, raw or plain,
 * not a product that shares its words. One agent proposed each choice and a
 * second tried to refute it; every id below was checked against the published
 * lists. null is an honest answer: the panel says USDA has no record of this
 * exact food rather than showing something else.
 *
 * Only ids in this table ever reach USDA, so the lookup stays a closed set of
 * at most 93 calls.
 */
export const USDA_RECORDS = {
  'pork-belly': 2727576, // Foundation: Pork, belly, with skin, raw
  'pork-shoulder': 167843, // SR Legacy: Pork, fresh, shoulder, whole, separable lean and fat, raw
  'pork-ribs': 167853, // SR Legacy: Pork, fresh, spareribs, separable lean and fat, raw
  'pork-mince': 2514745, // Foundation: Pork, ground, raw
  'chicken-breast': 2646170, // Foundation: Chicken, breast, boneless, skinless, raw
  'chicken-thigh': 2727567, // Foundation: Chicken, thigh, meat and skin, raw
  'chicken-wings': 2727568, // Foundation: Chicken, wing, meat and skin, raw
  'chicken-mince': 171116, // SR Legacy: Chicken, ground, raw
  'beef-chuck': 2646174, // Foundation: Beef, chuck, roast, boneless, choice, raw
  'beef-sirloin': 2727574, // Foundation: Beef, top sirloin steak, raw
  'beef-short-rib': 170827, // SR Legacy: Beef, chuck, short ribs, boneless, separable lean and fat, trimmed to 0' fat, choice, raw
  'beef-mince': 2514744, // Foundation: Beef, ground, 80% lean meat / 20% fat, raw
  'lamb-leg': 174372, // SR Legacy: Lamb, leg, whole (shank and sirloin), separable lean and fat, trimmed to 1/8' fat, choice, raw
  'lamb-shoulder': 175262, // SR Legacy: Lamb, New Zealand, imported, square-cut shoulder, separable lean and fat, raw
  'lamb-chops': 172517, // SR Legacy: Lamb, New Zealand, imported, loin chop, separable lean and fat, raw
  'salmon-fillet': 2684441, // Foundation: Fish, salmon, Atlantic, farm raised, raw
  'cod-fillet': 2684444, // Foundation: Fish, cod, Atlantic, wild caught, raw
  'sea-bass': 175142, // SR Legacy: Fish, sea bass, mixed species, raw
  mackerel: 175119, // SR Legacy: Fish, mackerel, Atlantic, raw
  prawns: 2684443, // Foundation: Crustaceans, shrimp, farm raised, raw
  squid: 174223, // SR Legacy: Mollusks, squid, mixed species, raw
  'firm-tofu': 172448, // SR Legacy: Tofu, firm, prepared with calcium sulfate and magnesium chloride (nigari)
  'silken-tofu': 174292, // SR Legacy: MORI-NU, Tofu, silken, soft
  chickpeas: 2644288, // Foundation: Chickpeas (garbanzo beans, bengal gram), canned, sodium added, drained and rinsed
  'red-lentils': 174284, // SR Legacy: Lentils, pink or red, raw
  onion: 170000, // SR Legacy: Onions, raw
  shallots: 170499, // SR Legacy: Shallots, raw
  garlic: 1104647, // Foundation: Garlic, raw
  ginger: 169231, // SR Legacy: Ginger root, raw
  'spring-onion': 170005, // SR Legacy: Onions, spring or scallions (includes tops and bulb), raw
  'red-chilli': 170106, // SR Legacy: Peppers, hot chili, red, raw
  lemongrass: 168573, // SR Legacy: Lemon grass (citronella), raw
  galangal: null, // no record of this exact food
  'kaffir-lime-leaves': null, // no record of this exact food
  'thai-basil': 172232, // SR Legacy: Basil, fresh
  coriander: 169997, // SR Legacy: Coriander (cilantro) leaves, raw
  lime: 168155, // SR Legacy: Limes, raw
  lemon: 167746, // SR Legacy: Lemons, raw, without peel
  tomatoes: 170457, // SR Legacy: Tomatoes, red, ripe, raw, year round average
  'bell-pepper': 2258588, // Foundation: Peppers, bell, green, raw
  aubergine: 2685577, // Foundation: Eggplant, raw
  broccoli: 747447, // Foundation: Broccoli, raw
  'bok-choy': 2685572, // Foundation: Cabbage, bok choy, raw
  'chinese-cabbage': 169979, // SR Legacy: Cabbage, chinese (pe-tsai), raw
  spinach: 168462, // SR Legacy: Spinach, raw
  'long-beans': 169222, // SR Legacy: Yardlong bean, raw
  'bean-sprouts': 169957, // SR Legacy: Mung beans, mature seeds, sprouted, raw
  carrot: 2258586, // Foundation: Carrots, mature, raw
  mushrooms: 1999629, // Foundation: Mushrooms, white button
  potatoes: 170026, // SR Legacy: Potatoes, flesh and skin, raw
  cucumber: 2346406, // Foundation: Cucumber, with peel, raw
  'jasmine-rice': 2512381, // Foundation: Rice, white, long grain, unenriched, raw
  rice: 2512381, // Foundation: Rice, white, long grain, unenriched, raw
  'rice-noodles': 169742, // SR Legacy: Rice noodles, dry
  'egg-noodles': 169755, // SR Legacy: Noodles, egg, dry, unenriched
  'glass-noodles': 174258, // SR Legacy: Noodles, chinese, cellophane or long rice (mung beans), dehydrated
  pasta: 168927, // SR Legacy: Pasta, dry, unenriched
  bread: 325871, // Foundation: Bread, white, commercially prepared
  tortillas: 175036, // SR Legacy: Tortillas, ready-to-bake or -fry, corn
  oats: 2346396, // Foundation: Oats, whole grain, rolled, old fashioned
  eggs: 748967, // Foundation: Eggs, Grade A, Large, egg whole
  milk: 172217, // SR Legacy: Milk, whole, 3.25% milkfat, without added vitamin A and vitamin D
  cream: 2346386, // Foundation: Cream, heavy
  'greek-yogurt': 2259794, // Foundation: Yogurt, Greek, plain, whole milk
  'cheddar-cheese': 328637, // Foundation: Cheese, cheddar
  parmesan: 170848, // SR Legacy: Cheese, parmesan, hard
  butter: 173430, // SR Legacy: Butter, without salt
  'olive-oil': 171413, // SR Legacy: Oil, olive, salad or cooking
  'mixed-herbs': null, // no record of this exact food
  'chili-flakes': 168570, // SR Legacy: Peppers, hot chile, sun-dried
  'tomato-paste': 2685580, // Foundation: Tomato, paste, canned, without salt added
  'dijon-mustard': null, // no record of this exact food
  'red-wine-vinegar': 172240, // SR Legacy: Vinegar, red wine
  'peanut-butter': 2262072, // Foundation: Peanut butter, creamy
  honey: 169640, // SR Legacy: Honey
  'light-soy': 174277, // SR Legacy: Soy sauce made from soy and wheat (shoyu)
  'dark-soy': null, // no record of this exact food
  'oyster-sauce': 174529, // SR Legacy: Sauce, oyster, ready-to-serve
  'shaoxing-wine': null, // no record of this exact food
  'sesame-oil': 171016, // SR Legacy: Oil, sesame, salad or cooking
  'rice-vinegar': null, // no record of this exact food
  doubanjiang: null, // no record of this exact food
  'five-spice': null, // no record of this exact food
  'white-pepper': 170933, // SR Legacy: Spices, pepper, white
  cornflour: 169698, // SR Legacy: Cornstarch
  'fish-sauce': 174531, // SR Legacy: Sauce, fish, ready-to-serve
  'coconut-milk': 170173, // SR Legacy: Nuts, coconut milk, canned (liquid expressed from grated meat and water)
  'red-curry-paste': null, // no record of this exact food
  'green-curry-paste': null, // no record of this exact food
  'palm-sugar': null, // no record of this exact food
  'tamarind-paste': null, // no record of this exact food
  'dried-shrimp': null, // no record of this exact food
  'roasted-peanuts': 173806, // SR Legacy: Peanuts, all types, dry-roasted, without salt
};
