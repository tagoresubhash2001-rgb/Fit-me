import { normalize } from './nutrition';

/**
 * Allergens and dietary restrictions (owner correction 4). Foods in the database have no allergen
 * field, so matching uses the food's names (all languages) against keyword lists. It is a helpful
 * warning, not a guarantee; the UI says so.
 */
export const COMMON_ALLERGENS = ['peanuts', 'tree_nuts', 'dairy', 'eggs', 'gluten', 'soy', 'fish', 'shellfish', 'sesame', 'mustard', 'celery', 'sulphites', 'lactose'] as const;
export const MORE_ALLERGENS = ['corn', 'lupin', 'molluscs', 'coconut', 'banana', 'kiwi', 'strawberry', 'tomato', 'chickpea', 'lentils', 'oats', 'rice', 'chocolate', 'caffeine', 'alcohol', 'garlic', 'onion', 'citrus'] as const;
export const RESTRICTIONS = ['vegetarian', 'vegan', 'jain', 'halal', 'kosher', 'no_beef', 'no_pork', 'eggetarian'] as const;

const MEAT = ['chicken', 'mutton', 'lamb', 'goat', 'beef', 'pork', 'ham', 'bacon', 'sausage', 'turkey', 'duck', 'meat', 'veal', 'salami', 'pepperoni', 'keema', 'gosht', 'murgh', 'biryani chicken', 'చికెన్', 'మటన్', 'चिकन', 'मटन', 'சிக்கன்', 'மட்டன்', 'دجاج', 'لحم'];
const FISH = ['fish', 'salmon', 'tuna', 'cod', 'sardine', 'mackerel', 'anchovy', 'tilapia', 'pomfret', 'చేప', 'मछली', 'மீன்', 'سمك'];
const SHELL = ['shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'clam', 'oyster', 'mussel', 'squid', 'రొయ్య', 'झींगा', 'இறால்'];
const DAIRY = ['milk', 'cheese', 'butter', 'ghee', 'curd', 'yogurt', 'yoghurt', 'paneer', 'cream', 'whey', 'kheer', 'payasam', 'lassi', 'buttermilk', 'chaas', 'raita', 'ice cream', 'పెరుగు', 'పాలు', 'దూధ్', 'दही', 'दूध', 'पनीर', 'தயிர்', 'பால்', 'حليب', 'جبن'];
const EGG = ['egg', 'omelette', 'omelet', 'mayonnaise', 'గుడ్డు', 'अंडा', 'முட்டை', 'بيض'];

const KEYWORDS: Record<string, string[]> = {
  peanuts: ['peanut', 'groundnut', 'పల్లీ', 'मूंगफली', 'வேர்க்கடலை'],
  tree_nuts: ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'brazil nut', 'badam', 'kaju'],
  dairy: DAIRY,
  lactose: DAIRY,
  eggs: EGG,
  gluten: ['wheat', 'roti', 'chapati', 'paratha', 'naan', 'bread', 'pasta', 'noodle', 'barley', 'rye', 'semolina', 'rava', 'sooji', 'upma', 'maida', 'flour', 'pizza', 'burger', 'biscuit', 'cake', 'samosa', 'చపాతీ', 'रोटी', 'சப்பாத்தி'],
  soy: ['soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso'],
  fish: FISH,
  shellfish: SHELL,
  molluscs: ['squid', 'octopus', 'clam', 'oyster', 'mussel', 'snail'],
  sesame: ['sesame', 'til', 'tahini', 'gingelly', 'నువ్వు', 'तिल', 'எள்'],
  mustard: ['mustard', 'sarson', 'rai', 'avakaya', 'pickle'],
  celery: ['celery'],
  sulphites: ['wine', 'dried apricot', 'raisin', 'vinegar'],
  corn: ['corn', 'maize', 'makki'],
  lupin: ['lupin'],
  coconut: ['coconut', 'kobbari', 'nariyal', 'தேங்காய்'],
  banana: ['banana', 'plantain'],
  kiwi: ['kiwi'],
  strawberry: ['strawberry'],
  tomato: ['tomato', 'ketchup'],
  chickpea: ['chickpea', 'chana', 'chole', 'besan', 'hummus', 'gram flour'],
  lentils: ['lentil', 'dal', 'dhal', 'pappu', 'moong', 'masoor', 'toor', 'urad', 'pesarattu'],
  oats: ['oat', 'porridge'],
  rice: ['rice', 'idli', 'dosa', 'biryani', 'pulao', 'pongal', 'annam'],
  chocolate: ['chocolate', 'cocoa'],
  caffeine: ['coffee', 'tea', 'chai', 'cola', 'energy drink'],
  alcohol: ['beer', 'wine', 'vodka', 'whisky', 'whiskey', 'rum', 'gin', 'alcohol'],
  garlic: ['garlic', 'lahsun', 'vellulli'],
  onion: ['onion', 'pyaz', 'ullipaya'],
  citrus: ['orange', 'lemon', 'lime', 'grapefruit', 'mosambi'],
};

const RESTRICTION_KEYWORDS: Record<string, string[]> = {
  vegetarian: [...MEAT, ...FISH, ...SHELL, ...EGG],
  eggetarian: [...MEAT, ...FISH, ...SHELL],
  vegan: [...MEAT, ...FISH, ...SHELL, ...EGG, ...DAIRY, 'honey'],
  jain: [...MEAT, ...FISH, ...SHELL, ...EGG, 'onion', 'garlic', 'potato', 'aloo', 'carrot', 'beetroot', 'radish', 'ginger', 'honey'],
  halal: ['pork', 'ham', 'bacon', 'pepperoni', 'lard', 'gelatin', 'wine', 'beer', 'alcohol'],
  kosher: ['pork', 'ham', 'bacon', 'shrimp', 'prawn', 'crab', 'lobster', 'clam', 'oyster', 'cheeseburger'],
  no_beef: ['beef', 'veal', 'cheeseburger', 'hamburger'],
  no_pork: ['pork', 'ham', 'bacon', 'pepperoni', 'salami', 'lard'],
};

function hits(text: string, words: string[]): boolean {
  const n = ` ${normalize(text)} `;
  return words.some((w) => {
    const k = normalize(w);
    return /^[a-z ]+$/.test(k) ? new RegExp(`(^|[^a-z])${k}`).test(n) : n.includes(k);
  });
}

/** Custom allergies typed by the user match their own words. */
export function matchAllergens(foodNames: string[], allergies: string[]): string[] {
  const text = foodNames.join(' ');
  return allergies.filter((a) => hits(text, KEYWORDS[a] ?? [a]));
}

export function matchRestrictions(foodNames: string[], restrictions: string[]): string[] {
  const text = foodNames.join(' ');
  return restrictions.filter((r) => RESTRICTION_KEYWORDS[r] && hits(text, RESTRICTION_KEYWORDS[r]));
}
