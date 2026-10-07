import type { Family } from "../types/schema";

/**
 * Per BUILD1-SPEC.md section 7. The spec names five families and which v1
 * recipes belong to each; everything else is "no family" (familyId: null).
 * Three v1 recipes — moong dal soup, the smoothie, and the fish — aren't
 * named in either list (the five families, or the explicit no-family
 * list). Soup and dal overlap in ingredients but the spec names only
 * rajma/chana/dal-tadka as the legume-curry variants, so I kept soup out
 * of that family rather than assume; smoothie and chilla read as the
 * "remaining v1 breakfasts" the no-family list gestures at; the fish
 * doesn't match anything, so it's no-family as a one-off. Flagging this
 * rather than silently deciding it — see the checkpoint message.
 */
export const FAMILIES: Family[] = [
  {
    id: "chicken-curry",
    name: "Chicken curry",
    skeleton:
      "A chicken curry built on an onion-based masala, varied by cut, cooking fat, how it's soured, the base paste, and whether a starchy add-in like potato goes in.",
    axes: [
      { key: "cut", label: "Cut", options: ["country chicken bone-in", "broiler bone-in", "boneless thigh"] },
      { key: "fat", label: "Fat", options: ["oil", "mustard oil", "ghee"] },
      { key: "souring", label: "Souring", options: ["tomato", "tamarind", "none"] },
      { key: "base", label: "Base", options: ["onion-tomato masala", "ginger-garlic-chilli paste"] },
      { key: "add-in", label: "Add-in", options: ["none", "potato"] },
    ],
  },
  {
    id: "legume-curry",
    name: "Legume curry",
    skeleton:
      "A soaked legume pressure-cooked, then finished in a tempered masala — the legume itself, how it's soured, the tempering, and the finishing touch are what vary between rajma, chana, and dal.",
    axes: [
      { key: "legume", label: "Legume", options: ["rajma", "kabuli chana", "toor dal"] },
      { key: "souring", label: "Souring", options: ["tomato", "amchur", "tamarind", "lemon"] },
      { key: "tempering", label: "Tempering", options: ["onion", "cumin-garlic-ghee"] },
      { key: "finish", label: "Finish", options: ["garam masala", "amchur", "lemon"] },
    ],
  },
  {
    id: "fermented-batter",
    name: "Fermented batter",
    skeleton:
      "The same rice-and-urad-dal batter, fermented overnight — steamed into idli when fresh, pan-cooked into uttapam with vegetables pressed in once it's a few days old.",
    axes: [
      { key: "form", label: "Form", options: ["steamed", "pan-cooked"] },
      { key: "add-ins", label: "Add-ins", options: ["none", "onion-tomato-chilli"] },
    ],
  },
  {
    id: "eggs",
    name: "Eggs",
    skeleton: "Eggs cooked a specific way over a base, as a change from the usual boiled eggs.",
    axes: [
      { key: "method", label: "Method", options: ["poached", "boiled", "fried"] },
      { key: "base", label: "Base", options: ["garlic yogurt", "none"] },
    ],
  },
  {
    id: "rolls",
    name: "Rolls",
    skeleton: "A filling wrapped and cooked — wrapper, filling, and cook method are the axes that vary.",
    axes: [
      { key: "wrapper", label: "Wrapper", options: ["rice paper"] },
      { key: "filling", label: "Filling", options: ["chicken mince"] },
      { key: "cook method", label: "Cook method", options: ["air fried"] },
    ],
  },
];
