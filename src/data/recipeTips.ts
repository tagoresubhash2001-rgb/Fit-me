/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Region, Goal } from '../types';

export interface RecipeTip {
  id: string;
  title: string;
  region: Region;
  goal: Goal;
  description: string;
  ingredients: string[];
  instructions: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  tip: string;
}

export const RECIPE_TIPS: RecipeTip[] = [
  // --- ANDHRA RECIPES ---
  // Fat Loss
  {
    id: 'andhra-fat-loss-1',
    title: 'Andhra Mung Bean Pesarattu with Ginger Chutney',
    region: 'andhra',
    goal: 'fat_loss',
    description:
      'A traditional, low-glycemic breakfast made of slow-soaked whole green gram (moong dal), packed with protein and dietary fiber.',
    ingredients: ['1 cup whole green moong dal', '2 chopped green chillies', '1 inch ginger', 'Salt to taste', '1 tsp cumin seeds'],
    instructions:
      'Soak moong dal for 6 hours. Blend with ginger, cumin, and chillies to a smooth batter. Pour onto a hot griddle, drop a few drops of cold-pressed oil, and cook until crisp. Serve with roasted Bengal-gram ginger paste.',
    macros: { calories: 215, protein: 12, carbs: 34, fats: 3, fiber: 9 },
    tip: 'Substitute regular rice with a tablespoon of rolled oats in the batter to further lower glycemic load and accelerate fat loss.',
  },
  {
    id: 'andhra-fat-loss-2',
    title: 'Gongura Pappu (Sorrel Leaves Dal) - High Fiber Edition',
    region: 'andhra',
    goal: 'fat_loss',
    description:
      'Sour, iron-rich Gongura leaves cooked with yellow split lentils, containing highly bioavailable vitamin C and digestive enzymes.',
    ingredients: ['1 bunch fresh Gongura leaves', '1/2 cup toor dal', '1/2 tsp turmeric', 'Mustard seeds & curry leaves for tempering'],
    instructions:
      'Boil toor dal with sorrel leaves, turmeric, and green chillies. Mash gently once cooled. Temper lightly with 1 tsp oil, mustard seeds, and garlic cloves.',
    macros: { calories: 180, protein: 10, carbs: 28, fats: 2, fiber: 8 },
    tip: 'Combine with 1/2 cup of organic unpolished brown rice or ragi balls to optimize metabolic satiety limit.',
  },
  // Muscle Building
  {
    id: 'andhra-muscle-1',
    title: 'Spicy Andhra Fish Curry (Kodi Pudina style variant)',
    region: 'andhra',
    goal: 'muscle_building',
    description: 'Clean lean fish cooked in tamarind gravy and freshly roasted regional spices to support amino acid muscle repair.',
    ingredients: ['200g lean snapper or sea bass', '1 lemon-sized tamarind', '1 onion paste', 'Andhra chilli powder', 'Fresh coriander'],
    instructions:
      'Sear the fish slices to lock moisture. Simmer onion, ginger-garlic paste, and tamarind water. Place sushified fish and simmer for 11 minutes until fully flaky.',
    macros: { calories: 310, protein: 36, carbs: 12, fats: 8, fiber: 3 },
    tip: 'High-quality fish protein contains essential Omega-3 fatty acids, reducing compound lift inflammation.',
  },
  {
    id: 'andhra-muscle-2',
    title: 'Pesarattu with Egg White Stuffing',
    region: 'andhra',
    goal: 'muscle_building',
    description: 'Andhra pesarattu topped with fluffy egg whites and chopped onions for an ultra-high protein breakfast punch.',
    ingredients: ['1 cup green gram batter', '3 egg whites', '1/2 chopped onion', 'Coriander leaves', '1/2 tsp pepper'],
    instructions:
      'Spread pesarattu batter onto a hot pan. Pour whipped egg whites directly on top, sprinkle with onions and black pepper. Cover and cook on low heat until the egg layer is firm.',
    macros: { calories: 320, protein: 26, carbs: 36, fats: 4, fiber: 9 },
    tip: 'Perfect post-workout fuel combining complex carbohydrates with fast-absorbing egg white albumin.',
  },
  // Weight Gain
  {
    id: 'andhra-weight-1',
    title: 'Spiced Kaju Kodi (Cashew Nut Chicken)',
    region: 'andhra',
    goal: 'weight_gain',
    description: 'Lean chicken cooked in a rich, creamy cashew-nut and tomato gravy with traditional Andhra spices.',
    ingredients: ['180g chicken thighs', '25g raw cashews (ground to paste)', '1 tbsp ghee', 'Andhra garam masala'],
    instructions:
      'Sauté onions and spices in ghee. Stir in cashew-nut paste, then add chicken and cook. Slowly simmer with a splash of water until chicken is tender.',
    macros: { calories: 510, protein: 34, carbs: 18, fats: 28, fiber: 4 },
    tip: 'Cashews are loaded with healthy fats and magnesium, supporting muscle mass growth and optimal bone recovery.',
  },
  // Maintenance
  {
    id: 'andhra-maint-1',
    title: 'Andhra Tomato & Mint Rasam with Ragi Sangati',
    region: 'andhra',
    goal: 'maintenance',
    description: 'A light, antioxidant-filled tomato-mint digestif served over wholesome, comforting steamed finger millet spheres.',
    ingredients: ['2 ripe tomatoes', 'Handful of fresh mint', '1 tsp rasam powder', '1/2 cup ragi flour', '1 tsp ghee'],
    instructions:
      'Boil tomatoes with tamarind, rasam powder, and mint leaves, then mash and strain. Cook ragi flour in water until it forms a soft ball, glaze with ghee and serve beside the hot rasam.',
    macros: { calories: 290, protein: 6, carbs: 54, fats: 4, fiber: 11 },
    tip: 'Excellent for restoring hydration and calming stomach lining during busy mid-week cycles.',
  },

  // --- TELANGANA RECIPES ---
  // Fat Loss
  {
    id: 'telangana-fat-loss-1',
    title: 'Telangana Jonna Rotte (Sorghum Flatbread) with Leafy Amaranth Stew',
    region: 'telangana',
    goal: 'fat_loss',
    description: 'Gluten-free, highly fibrous sorghum bread paired with slow-cooked nutrient-dense Thotakura (Amaranth leaves) stew.',
    ingredients: ['1/2 cup Jowar/Sorghum flour', 'Hot water', '1 bunch fresh Amaranth leaves', '1 tsp mustard oil', '1 cloves garlic'],
    instructions:
      'Knead jowar flour with hot water. Flatten by hand and bake on an iron tawa without oil. Stir-fry Amaranth leaves with smashed garlic and minimal salt.',
    macros: { calories: 230, protein: 7, carbs: 44, fats: 2, fiber: 10 },
    tip: 'Jowar releases sugars very slowly, which keeps insulin baseline balanced and reduces cravings.',
  },
  {
    id: 'telangana-fat-loss-2',
    title: 'Telangana Makka Guda (Spiced Kernel Corn Bowl)',
    region: 'telangana',
    goal: 'fat_loss',
    description: 'Steamed country corn tossed with green chillies, mustard seeds, fresh curry leaves, and a squeeze of lime.',
    ingredients: ['1 cup steamed country corn', '1 tsp mustard seeds', 'Curry leaves', 'Juice of 1/2 lime'],
    instructions:
      'Toss steamed corn with mustard seeds, fresh curry leaves, and green chillies in 1 tsp oil. Turn off heat and add lime juice.',
    macros: { calories: 140, protein: 4, carbs: 28, fats: 1.5, fiber: 6 },
    tip: 'High volume and low calorie density make this an exceptional afternoon metabolic snack.',
  },
  // Muscle Building
  {
    id: 'telangana-muscle-1',
    title: 'Telangana Pepper Kodi (Country Chicken Dry Sauté)',
    region: 'telangana',
    goal: 'muscle_building',
    description: 'Dry roasted chicken thigh pieces sautéed with crushed black pepper, star anise, curry leaves, and green chillies.',
    ingredients: ['185g skinless chicken', '1.5 tsp black pepper', 'Curry leaves', '1 tsp cold-pressed peanut oil'],
    instructions:
      'Dry roast peppercorns and fennel seeds, grind. Sauté chicken with turmeric and ginger-garlic. Toss in the ground pepper mix and roast on a slow flame.',
    macros: { calories: 340, protein: 32, carbs: 6, fats: 14, fiber: 2 },
    tip: 'Black pepper contains piperine, which boosts nutrient absorption and acts as an anti-inflammatory.',
  },
  {
    id: 'telangana-muscle-2',
    title: 'High-Protein Soya Chunks & Palakura Kurma',
    region: 'telangana',
    goal: 'muscle_building',
    description: 'Soya nuggets cooked in a rich, fibrous spinach paste seasoned with sesame seeds and native spices.',
    ingredients: ['50g soya chunks (soaked)', '1 bunch spinach', '1 tsp sesame seeds', 'Telangana garam masala'],
    instructions:
      'Squeeze water from soaked soya. Puree the boiled spinach. Sauté onions, add sesame paste, spinach puree, and cooked soya chunks. Simmer for 10 minutes.',
    macros: { calories: 290, protein: 28, carbs: 18, fats: 8, fiber: 7 },
    tip: 'Soya chunks offer an incredible vegan protein profile containing all nine essential amino acids.',
  },
  // Weight Gain
  {
    id: 'telangana-weight-1',
    title: 'Goda Palakura & Peanut Mutton Kurma',
    region: 'telangana',
    goal: 'weight_gain',
    description: 'Traditional mutton-curry infused with nutritious spinach paste, freshly roasted sesame, and raw organic peanuts.',
    ingredients: ['150g lean mutton', '2 tbsp roasted peanuts', '1 bunch spinach', '1 tsp ginger-garlic paste'],
    instructions:
      'Pressure cook mutton. Roast and grind peanuts, sesame, and chillies. Sauté this thick master paste with ginger-garlic, add mutton with its stock, and simmer till thick.',
    macros: { calories: 520, protein: 36, carbs: 14, fats: 32, fiber: 5 },
    tip: 'Packed with heme-iron, vitamins, and high-calorie fat stores to help build muscle mass and increase strength.',
  },
  // Maintenance
  {
    id: 'telangana-maint-1',
    title: 'Bathua (Chilaka Thotakura) and Moong Lentil Khichdi',
    region: 'telangana',
    goal: 'maintenance',
    description: 'A comforting, easily digestible pot of sprouted moong dal, brown rice, and seasonal greens, cooked with local tawa ghee.',
    ingredients: ['1/3 cup brown rice', '1/3 cup split yellow moong dal', '1 bunch Bathua greens', '1 tsp pure cow ghee'],
    instructions:
      'Wash and soak rice and dal. Pressure-cook with chopped greens, ginger, and turmeric. Garnish with a spoonful of warm tawa ghee.',
    macros: { calories: 340, protein: 12, carbs: 56, fats: 6, fiber: 8 },
    tip: 'Ideal resetting dish for high-stress business professional weeks to reset gut microbiome health.',
  },

  // --- RAYALASEEMA RECIPES ---
  // Fat Loss
  {
    id: 'rayalaseema-fat-loss-1',
    title: 'Seema Ragi Sangati (Ragi Mudda) with Gongura Pachadi',
    region: 'rayalaseema',
    goal: 'fat_loss',
    description: 'Slow-cooked finger millet dough served with an direct-grilled tangy Gongura leaf chutney.',
    ingredients: ['1/2 cup finger millet (ragi) flour', '1 tbsp broken brown rice', '1.5 cups water', 'Gongura leaves'],
    instructions:
      'Boil broken rice in water. Once cooked, add ragi flour without stirring. Cover and let steam, then stir vigorously to form smooth ball. Serve alongside a hand-ground sour Gongura paste.',
    macros: { calories: 260, protein: 5, carbs: 58, fats: 2, fiber: 12 },
    tip: 'Extremely rich in dietary fiber and bioactive calcium, providing prolonged energy and blocking fat storage.',
  },
  {
    id: 'rayalaseema-fat-loss-2',
    title: 'Uggani (Spiced Puffed Rice Upma) - Reduced Oil Edition',
    region: 'rayalaseema',
    goal: 'fat_loss',
    description: 'A light, fast-digesting Rayalaseema upma made of puffed rice, turmeric, green chillies, and roasted gram powder.',
    ingredients: ['2 cups puffed rice (Maramaralu)', '1 tbsp roasted chana dal powder (Pappula podi)', 'Green chillies', 'Lemon juice'],
    instructions:
      'Wash puffed rice and squeeze out excess water. Temper mustard seeds and chillies with 1 tsp oil, add onions, then puffed rice, chana dal powder, and lemon.',
    macros: { calories: 170, protein: 4, carbs: 32, fats: 2.5, fiber: 4 },
    tip: 'Top with sprouted legumes to add amino acids while keeping total calories extremely low.',
  },
  // Muscle Building
  {
    id: 'rayalaseema-muscle-1',
    title: 'Spiced Natu Kodi Pulusu (Seema Country Chicken Curry)',
    region: 'rayalaseema',
    goal: 'muscle_building',
    description: 'Robust country chicken cooked in a rich paste of freshly dry-roasted poppy seeds, dried coconut, and Seema chillies.',
    ingredients: ['180g lean country chicken', '1 tbsp dried coconut (kopra)', '1 tsp poppy seeds', 'Rayalaseema red chilli powder'],
    instructions:
      'Grind roasted coconut, poppy seeds, onions, and garlic. Seer chicken, then pour spices and cook in pressure cooker until tender. Garnish with fresh green chillies.',
    macros: { calories: 380, protein: 34, carbs: 10, fats: 18, fiber: 3 },
    tip: 'Perfect high-quality proteins paired with bioactive ingredients to kickstart muscle hypertrophy cycles.',
  },
  {
    id: 'rayalaseema-muscle-2',
    title: 'Korrakala Upma (Foxtail Millet High Protein Upma)',
    region: 'rayalaseema',
    goal: 'muscle_building',
    description:
      'Wholesome foxtail millet cooked with sprouted moong, green peas, and topped with toasted cashews and peanut butter drizzle.',
    ingredients: ['1/2 cup Foxtail millet (Korra)', '1/4 cup sprouted moong dal', 'Peas & carrots', '1 tsp mustard seeds'],
    instructions:
      'Dry roast the foxtail millet. Sauté vegetables and sprouts in 1 tsp oil. Add 1.5 cups water, boil, stir in roasted millet, and steam cook on low for 12 minutes.',
    macros: { calories: 310, protein: 14, carbs: 48, fats: 6, fiber: 10 },
    tip: 'Foxtail millet offers a low-glycemic profile packed with iron and magnesium to optimize muscular endurance.',
  },
  // Weight Gain
  {
    id: 'rayalaseema-weight-1',
    title: 'Ragi Sangati with Creamy Peanut Kodi Pulusu',
    region: 'rayalaseema',
    goal: 'weight_gain',
    description: 'Traditional ragi balls paired with chicken cooked in a rich, energy-dense peanut, garlic, and coconut curry.',
    ingredients: ['1/2 cup raw ragi flour', '150g chicken thighs', '30g toasted peanuts (ground)', '1 tbsp organic coconut oil'],
    instructions:
      'Prepare steamed ragi sangati. Boil chicken in garlic-tamarind broth containing peanut and dry coconut paste. Serve hot with a teaspoon of homemade ghee.',
    macros: { calories: 590, protein: 38, carbs: 52, fats: 24, fiber: 11 },
    tip: 'The high calorie density of peanuts combined with the low glycemic load of ragi supports lean weight addition without fat spikes.',
  },
  // Maintenance
  {
    id: 'rayalaseema-maint-1',
    title: 'Seema Roasted Chana Podi with Millet Jonna Jowar Dosa',
    region: 'rayalaseema',
    goal: 'maintenance',
    description: 'Crisp sorghum flour dosas sprinkled with a digestive, zinc-rich roasted Bengal-gram spice powder.',
    ingredients: ['1 cup fermented sorghum batter', '2 tbsp Seema gun-powder (chana dal, dry garlic, cumin)', '1 tsp cold-pressed oil'],
    instructions:
      'Spread sorghum batter onto a hot cast-iron tawa. Spray with a drop of oil and sprinkle roasted chana podi generously. Fold and cook.',
    macros: { calories: 280, protein: 8, carbs: 46, fats: 5, fiber: 7 },
    tip: 'Rich in zinc and iron, this meal maintains blood sugar stability during intensive workflow shifts.',
  },

  // --- GENERAL INDIAN RECIPES ---
  // Fat Loss
  {
    id: 'general-fat-loss-1',
    title: 'Sprouted Moong & Pomegranate Salad with Lemon Zest',
    region: 'general_indian',
    goal: 'fat_loss',
    description: 'A raw, refreshing, enzyme-packed salad filled with bioavailable zinc, magnesium, and dietary fiber.',
    ingredients: ['1.5 cups sprouted green gram', '1/3 cup pomegranate seeds', 'Juice of 1 fresh lemon', 'Pinch of pink salt'],
    instructions:
      'Rinse sprouts thoroughly with boiling water. Toss in pomegranates, finely chopped cucumber, coriander, salt, lime juice, and cumin powder.',
    macros: { calories: 150, protein: 10, carbs: 22, fats: 0.5, fiber: 7 },
    tip: 'Eat as an early evening snack to support digestion, control nocturnal cravings, and speed up fat burn.',
  },
  {
    id: 'general-fat-loss-2',
    title: 'Indian Oats and Vegetable Khichdi',
    region: 'general_indian',
    goal: 'fat_loss',
    description: 'Clean vegetable khichdi substituting rice with rolled oats, cooked with split yellow lentils.',
    ingredients: ['1/2 cup rolled oats', '1/4 cup yellow moong dal', 'Chopped carrots, peas, beans', '1/2 tsp turmeric'],
    instructions:
      'Roast oats. Pressure cook moong dal, oats, and chopped vegetables with onion, ginger, and turmeric. Garnish with lemon juice.',
    macros: { calories: 220, protein: 11, carbs: 36, fats: 2.5, fiber: 8 },
    tip: 'Beta-glucan fibers in oats delay stomach gastric emptying, suppressing overall daily energy intake.',
  },
  // Muscle Building
  {
    id: 'general-muscle-1',
    title: 'Tandoori Soya Chaap or Low-Fat Paneer Tikka',
    region: 'general_indian',
    goal: 'muscle_building',
    description: 'Lean soya skewers marinated in greek-yogurt, ginger, and garlic, cooked in a dry air-fryer setup.',
    ingredients: ['155g low-fat paneer or soya chaap', '50g hung Greek yogurt', '1 tsp Kashmiri chilli powder', 'Kasturi methi'],
    instructions:
      'Beat yogurt with lemon juice and spices. Toss paneer cubes in marination and rest for 30 minutes. Air fry at 190°C for 14 minutes until dry charred.',
    macros: { calories: 290, protein: 24, carbs: 10, fats: 14, fiber: 2 },
    tip: 'Low-fat paneer is highly rich in casein proteins, which release amino acids steadily over several hours.',
  },
  {
    id: 'general-muscle-2',
    title: 'Double Egg White Paneer Bhurji',
    region: 'general_indian',
    goal: 'muscle_building',
    description: 'A stir-fried mixture of grated cottage cheese (paneer) and liquid egg whites seasoned with tomatoes and garam masala.',
    ingredients: ['80g low-fat paneer', '4 egg whites', '1 onion', '1 tomato', '1/2 tsp turmeric'],
    instructions:
      'Sauté chopped onion and tomato. Add crumbled paneer and pour in the egg whites. Stir continuously on medium heat until scrambled and dry.',
    macros: { calories: 310, protein: 32, carbs: 8, fats: 12, fiber: 3 },
    tip: 'Combines the slow release of casein with the rapid absorption of egg whites for optimal protein synthesis.',
  },
  // Weight Gain
  {
    id: 'general-weight-1',
    title: 'Almond & Saffron Basmati Kheer with Whey Isolate',
    region: 'general_indian',
    goal: 'weight_gain',
    description: 'A healthy, calorie-dense high-protein dessert using organic milk, basmati rice, dates, and whey isolate protein.',
    ingredients: ['250ml full-cream organic milk', '2 tbsp basmati rice', '5 almond slivers', '1 scoop unflavored whey protein'],
    instructions:
      'Boil milk, add soaked rice, and simmer until cooked thick. Cool down slightly to 45°C. Stir in dates paste, almond slices, and whey protein quickly until completely smooth.',
    macros: { calories: 480, protein: 35, carbs: 48, fats: 12, fiber: 3 },
    tip: 'Saffron possesses powerful sleep-inducing and recovery antioxidants, which reduce stress-induced catabolism.',
  },
  // Maintenance
  {
    id: 'general-maint-1',
    title: 'Spiced Panchmel Lentil Soup with Steamed Oats Roti',
    region: 'general_indian',
    goal: 'maintenance',
    description: 'A classic 5-lentil soup cooked with roasted cumin and turmeric, paired with organic hand-rolled grain bread.',
    ingredients: ['1/2 cup five-lentil mix', '1/2 cup multi-grain whole flour', '1 tsp cumin', '1 tsp virgin ghee'],
    instructions:
      'Soak and pressure cook lentils. Prepare fresh round flatbreads of multigrain. Stir ghee and cumin into the lentil stew and serve fresh with salad.',
    macros: { calories: 350, protein: 15, carbs: 58, fats: 4, fiber: 9 },
    tip: 'A perfectly balanced traditional meal for sustaining long-term liver filters and lipid stability.',
  },
];

/**
 * Returns a recipe tip matching the user's profile conditions,
 * optionally cycled within matching results.
 */
export function getRecipeTipsForProfile(region: Region, goal: Goal): RecipeTip[] {
  const matches = RECIPE_TIPS.filter((r) => r.region === region && r.goal === goal);
  if (matches.length > 0) return matches;

  // Fallback to match regional only
  const regionalMatches = RECIPE_TIPS.filter((r) => r.region === region);
  if (regionalMatches.length > 0) return regionalMatches;

  // Final fallback to general indian matching goal
  return RECIPE_TIPS.filter((r) => r.goal === goal);
}
