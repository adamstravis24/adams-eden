/**
 * Bulk Tag Products Script
 * 
 * This script analyzes products in Shopify and automatically adds appropriate tags
 * based on product titles, descriptions, and existing tags to ensure proper categorization.
 * 
 * Usage:
 *   node scripts/bulkTagProducts.mjs [--dry-run] [--limit N]
 * 
 * Environment Variables Required:
 *   SHOPIFY_ADMIN_API_KEY - Your Shopify Admin API access token
 *   SHOPIFY_STORE_DOMAIN - Your store domain (e.g., "your-store.myshopify.com")
 *   SHOPIFY_API_VERSION - API version (default: "2024-07")
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Load environment variables
const envFilePath = path.join(projectRoot, ".env.local");
const parsedEnv = { ...process.env };

if (fs.existsSync(envFilePath)) {
  const raw = fs.readFileSync(envFilePath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsedEnv[key] = value;
  }
}

const adminApiKey = parsedEnv.SHOPIFY_ADMIN_API_KEY;
// Use NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN if available (matches existing pattern), fallback to SHOPIFY_STORE_DOMAIN
const storeDomain = (parsedEnv.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || parsedEnv.SHOPIFY_STORE_DOMAIN)?.replace(/^https?:\/\//, "").replace(/\/+$/, "");
const apiVersion = parsedEnv.SHOPIFY_API_VERSION || "2024-07";

if (!adminApiKey || !storeDomain) {
  console.error("Missing required environment variables:");
  if (!adminApiKey) console.error("  - SHOPIFY_ADMIN_API_KEY");
  if (!storeDomain) console.error("  - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN or SHOPIFY_STORE_DOMAIN");
  console.error("\nAdd these to .env.local in the website root directory.");
  process.exit(1);
}

const endpoint = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;

// Category definitions matching the website
const CATEGORIES = {
  flowers: {
    keywords: ["flower", "bloom", "blossom", "petal", "perennial", "annual", "ornamental", "seed", "seeds", "marigold", "zinnia", "sunflower", "daisy", "rose", "tulip", "daffodil", "lily", "iris", "peony", "hydrangea", "petunia", "pansy", "viola", "cosmos", "nasturtium", "calendula", "snapdragon", "delphinium", "larkspur", "aster", "chrysanthemum", "dianthus", "carnation"],
    excludeKeywords: ["vegetable", "herb", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed"],
    tags: ["flower", "seed"],
  },
  vegetables: {
    keywords: ["vegetable", "veggie", "seed", "seeds", "tomato", "carrot", "lettuce", "pepper", "cucumber", "squash", "bean", "pea", "corn", "broccoli", "cabbage", "onion", "garlic", "potato", "spinach", "kale", "radish", "beet", "turnip", "eggplant", "zucchini", "bell pepper", "jalapeño", "habanero", "okra", "brussels sprout", "cauliflower", "asparagus", "artichoke", "leek", "shallot", "celery", "parsnip", "rutabaga", "kohlrabi", "swiss chard", "collard", "mustard green", "bok choy", "pak choi", "banana pepper", "mung bean", "mustard", "shiso", "cardamom", "chicory", "bee balm", "lemon mint", "delicata", "dragon", "nettle", "stinging nettle", "chervil", "lovage", "new zealand spinach", "pimento", "royal burgundy", "winter wheat", "purslane", "miner's lettuce", "elderberry"],
    excludeKeywords: ["herb", "flower", "houseplant", "indoor", "succulent", "cactus", "light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed", "gift", "gift card", "gift wrap", "dried"],
    tags: ["vegetable", "seed"],
  },
  herbs: {
    keywords: ["herb", "culinary", "aromatic", "spice", "seed", "seeds", "basil", "oregano", "thyme", "rosemary", "sage", "mint", "parsley", "cilantro", "coriander", "dill", "chive", "tarragon", "marjoram", "chervil", "fennel", "lavender", "lemongrass", "lemon balm", "stevia", "chamomile", "echinacea", "medicinal herb", "shiso", "cardamom", "bee balm"],
    excludeKeywords: ["vegetable", "flower", "houseplant", "indoor", "succulent", "cactus", "diatomaceous earth", "diatomaceous", "light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed"],
    tags: ["herb", "seed"],
  },
  houseplants: {
    keywords: ["houseplant", "indoor plant", "interior plant", "foliage", "pothos", "philodendron", "monstera", "snake plant", "sansevieria", "spider plant", "peace lily", "fiddle leaf", "rubber tree", "zz plant", "zamioculcas", "dieffenbachia", "dumb cane", "calathea", "prayer plant", "maranta", "alocasia", "elephant ear", "anthurium", "begonia", "fern", "boston fern", "maidenhair", "ivy", "english ivy"],
    excludeKeywords: ["light", "lamp", "soil", "pot", "planter", "fertilizer", "tool", "supply", "equipment", "hydro", "bed", "beds", "garden bed", "raised bed", "spray", "care", "treatment", "pest", "disease", "fungicide", "insecticide"],
    tags: ["houseplant"],
  },
  succulents: {
    keywords: ["succulent", "cactus", "cacti", "xerophyte", "desert", "arid", "echeveria", "aloe", "haworthia", "sedum", "crassula", "jade plant", "hens and chicks", "sempervivum", "agave", "yucca", "opuntia", "prickly pear", "barrel cactus", "christmas cactus", "thanksgiving cactus", "easter cactus", "schlumbergera", "lithops", "living stone"],
    excludeKeywords: ["bed", "beds", "garden bed", "raised bed"],
    tags: ["succulent"],
  },
  supplies: {
    keywords: ["tool", "supply", "equipment", "pot", "planter", "tray", "container", "pruner", "scissors", "bed", "beds", "garden bed", "raised bed", "hydroponic", "hydro", "fertilizer", "nutrient", "soil", "potting mix", "spray", "care", "treatment", "pest", "disease", "fungicide", "insecticide", "watering can", "saucer", "dome", "tie", "station", "humidistat", "remote", "fabric pot", "square pot", "liquid", "bloom", "diatomaceous", "leaf care", "plant leaf"],
    excludeKeywords: ["seed", "seeds", "vegetable", "herb", "flower", "houseplant", "succulent", "cactus", "tomato", "carrot", "lettuce", "pepper", "cucumber", "squash", "bean", "pea", "corn", "broccoli", "cabbage", "onion", "garlic", "potato", "spinach", "kale", "radish", "beet", "turnip", "eggplant", "zucchini", "basil", "oregano", "thyme", "rosemary", "sage", "mint", "parsley", "cilantro", "coriander", "dill", "chive", "marigold", "zinnia", "sunflower", "daisy", "rose", "tulip", "daffodil", "lily", "iris", "peony", "hydrangea", "petunia", "pansy", "viola", "cosmos", "nasturtium", "calendula", "snapdragon"],
    tags: ["supply"],
  },
};

// Vegetable types for grouping
const VEGETABLE_TYPES = ["tomato", "carrot", "lettuce", "pepper", "cucumber", "squash", "bean", "pea", "corn", "broccoli", "cabbage", "onion", "garlic", "potato", "spinach", "kale", "radish", "beet", "turnip", "eggplant", "zucchini", "okra", "brussels sprout", "cauliflower", "asparagus", "artichoke", "leek", "shallot", "celery", "parsnip", "rutabaga", "kohlrabi", "swiss chard", "collard", "mustard green", "bok choy", "pak choi"];

async function shopifyAdminFetch(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminApiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API request failed with status ${response.status}`);
  }

  const body = await response.json();

  if (body.errors) {
    throw new Error(`Shopify API errors: ${JSON.stringify(body.errors)}`);
  }

  return body.data;
}

async function getAllProducts(limit = null) {
  const allProducts = [];
  let hasNextPage = true;
  let cursor = null;
  const pageSize = 250;

  while (hasNextPage) {
    const query = cursor
      ? `query GetProducts($first: Int!, $after: String!) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                title
                description
                productType
                tags
                handle
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`
      : `query GetProducts($first: Int!) {
          products(first: $first) {
            edges {
              node {
                id
                title
                description
                productType
                tags
                handle
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`;

    const variables = cursor ? { first: pageSize, after: cursor } : { first: pageSize };
    const data = await shopifyAdminFetch(query, variables);

    const products = data.products.edges.map((edge) => ({
      id: edge.node.id,
      title: edge.node.title,
      description: edge.node.description || "",
      productType: edge.node.productType || "",
      tags: edge.node.tags || [],
      handle: edge.node.handle,
    }));

    allProducts.push(...products);

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;

    if (limit && allProducts.length >= limit) {
      break;
    }
  }

  return allProducts;
}

function analyzeProduct(product) {
  const haystack = [
    product.title,
    product.description,
    product.productType,
    ...product.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const suggestedTags = new Set(product.tags || []);
  const matchedCategories = [];

  // Check categories in order of specificity (plants first, then supplies)
  // This prevents products from matching multiple categories incorrectly
  const categoryOrder = ["vegetables", "herbs", "flowers", "houseplants", "succulents", "supplies"];
  
  let primaryCategory = null;
  
  // First pass: find the most specific match (plants first)
  for (const categoryName of categoryOrder) {
    const category = CATEGORIES[categoryName];
    if (!category) continue;
    
    const matchesInclude = category.keywords.some((keyword) =>
      haystack.includes(keyword.toLowerCase())
    );
    const matchesExclude = category.excludeKeywords.some((keyword) =>
      haystack.includes(keyword.toLowerCase())
    );

    if (matchesInclude && !matchesExclude) {
      // If it's a plant category, set as primary and stop checking others
      if (categoryName !== "supplies") {
        primaryCategory = categoryName;
        matchedCategories.push(categoryName);
        category.tags.forEach((tag) => suggestedTags.add(tag));
        break; // Stop after finding first plant category match
      } else {
        // Supplies: only match if no plant category was found
        if (!primaryCategory) {
          primaryCategory = categoryName;
          matchedCategories.push(categoryName);
          category.tags.forEach((tag) => suggestedTags.add(tag));
        }
      }
    }
  }
  
  // If no match found in ordered list, check remaining categories
  if (!primaryCategory) {
    for (const [categoryName, category] of Object.entries(CATEGORIES)) {
      if (categoryOrder.includes(categoryName)) continue; // Already checked
      
      const matchesInclude = category.keywords.some((keyword) =>
        haystack.includes(keyword.toLowerCase())
      );
      const matchesExclude = category.excludeKeywords.some((keyword) =>
        haystack.includes(keyword.toLowerCase())
      );

      if (matchesInclude && !matchesExclude) {
        matchedCategories.push(categoryName);
        category.tags.forEach((tag) => suggestedTags.add(tag));
        break; // Only match one category
      }
    }
  }

  // Special handling for flowers - add annual/perennial
  if (matchedCategories.includes("flowers")) {
    if (haystack.includes("annual") && !haystack.includes("perennial")) {
      suggestedTags.add("annual");
    } else if (haystack.includes("perennial")) {
      suggestedTags.add("perennial");
    }
  }

  // Special handling for vegetables - add specific type
  if (matchedCategories.includes("vegetables")) {
    for (const type of VEGETABLE_TYPES) {
      if (haystack.includes(type)) {
        suggestedTags.add(type);
        break; // Only add first matching type
      }
    }
  }

  // Special handling for herbs - check for echinacea (can be herb or flower)
  if (haystack.includes("echinacea") || haystack.includes("coneflower")) {
    if (haystack.includes("tea") || haystack.includes("herb") || haystack.includes("supplement")) {
      suggestedTags.add("herb");
      suggestedTags.delete("flower");
    } else {
      suggestedTags.add("flower");
      suggestedTags.add("perennial");
    }
  }

  // Special handling for lavender (can be herb or flower)
  if (haystack.includes("lavender")) {
    if (haystack.includes("culinary") || haystack.includes("cooking")) {
      suggestedTags.add("herb");
    } else {
      suggestedTags.add("flower");
      suggestedTags.add("perennial");
    }
  }

  // Special handling for sedum (can be flower or succulent)
  if (haystack.includes("sedum")) {
    if (haystack.includes("stonecrop") || haystack.includes("succulent")) {
      suggestedTags.add("succulent");
      suggestedTags.delete("flower");
    } else {
      suggestedTags.add("flower");
      suggestedTags.add("perennial");
    }
  }

  // Special handling for begonia (can be annual or houseplant)
  if (haystack.includes("begonia")) {
    if (haystack.includes("indoor") || haystack.includes("houseplant")) {
      suggestedTags.add("houseplant");
      suggestedTags.delete("annual");
    } else {
      suggestedTags.add("annual");
      suggestedTags.add("flower");
    }
  }

  // Ensure "seed" or "seeds" is added for seed products
  // Only add seed tags if it's a plant product (not a supply) and not a gift card/wrap
  if (primaryCategory && primaryCategory !== "supplies" && !haystack.includes("gift card") && !haystack.includes("gift wrap")) {
    if (haystack.includes("seed") && !haystack.includes("seeds")) {
      suggestedTags.add("seed");
    } else if (haystack.includes("seed")) {
      suggestedTags.add("seeds");
    }
  }

  return {
    ...product,
    suggestedTags: Array.from(suggestedTags).sort(),
    matchedCategories,
  };
}

async function updateProductTags(productId, tags) {
  // Use productUpdate to set tags (replaces all tags)
  const query = `mutation UpdateProductTags($id: ID!, $tags: [String!]!) {
    productUpdate(input: { id: $id, tags: $tags }) {
      product {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const result = await shopifyAdminFetch(query, { id: productId, tags });
  
  if (result.productUpdate.userErrors && result.productUpdate.userErrors.length > 0) {
    throw new Error(`User errors: ${JSON.stringify(result.productUpdate.userErrors)}`);
  }
  
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : null;

  console.log("🌱 Starting bulk product tagging...\n");
  if (dryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  try {
    console.log("📦 Fetching products from Shopify...");
    const products = await getAllProducts(limit);
    console.log(`✅ Fetched ${products.length} products\n`);

    console.log("🔍 Analyzing products and suggesting tags...\n");
    const analyzed = products.map(analyzeProduct);

    let totalUpdated = 0;
    let totalTagsAdded = 0;
    const updates = [];

    for (const product of analyzed) {
      const currentTags = new Set(product.tags || []);
      const suggestedTags = new Set(product.suggestedTags || []);
      const tagsToAdd = Array.from(suggestedTags).filter((tag) => !currentTags.has(tag));

      if (tagsToAdd.length > 0) {
        // Merge current tags with new tags (preserve existing, add new)
        const mergedTags = Array.from(new Set([...currentTags, ...suggestedTags])).sort();
        
        updates.push({
          product,
          tagsToAdd,
          currentTags: Array.from(currentTags),
          newTags: mergedTags,
        });
      }
    }

    console.log(`📊 Analysis complete:\n`);
    console.log(`   Products that need tags: ${updates.length}`);
    console.log(`   Total tags to add: ${updates.reduce((sum, u) => sum + u.tagsToAdd.length, 0)}\n`);

    if (updates.length === 0) {
      console.log("✅ All products are already properly tagged!\n");
      return;
    }

    if (dryRun) {
      console.log("📋 Preview of changes:\n");
      
      // Show examples from different categories
      const categoryExamples = {};
      const otherExamples = [];
      
      for (const update of updates) {
        const mainCategory = update.product.matchedCategories[0] || "other";
        if (!categoryExamples[mainCategory] && mainCategory !== "other") {
          categoryExamples[mainCategory] = update;
        } else {
          otherExamples.push(update);
        }
      }
      
      // Show category examples
      let exampleCount = 0;
      for (const [category, update] of Object.entries(categoryExamples)) {
        if (exampleCount >= 15) break;
        exampleCount++;
        console.log(`${exampleCount}. ${update.product.title}`);
        console.log(`   Current tags: ${update.currentTags.join(", ") || "(none)"}`);
        console.log(`   Tags to add: ${update.tagsToAdd.join(", ")}`);
        console.log(`   New tags: ${update.newTags.join(", ")}`);
        console.log(`   Matched categories: ${update.product.matchedCategories.join(", ") || "(none)"}\n`);
      }
      
      // Show a few more random examples
      const remaining = Math.min(5, otherExamples.length);
      for (let i = 0; i < remaining && exampleCount < 20; i++) {
        exampleCount++;
        const update = otherExamples[i];
        console.log(`${exampleCount}. ${update.product.title}`);
        console.log(`   Current tags: ${update.currentTags.join(", ") || "(none)"}`);
        console.log(`   Tags to add: ${update.tagsToAdd.join(", ")}`);
        console.log(`   New tags: ${update.newTags.join(", ")}`);
        console.log(`   Matched categories: ${update.product.matchedCategories.join(", ") || "(none)"}\n`);
      }
      
      if (updates.length > exampleCount) {
        console.log(`   ... and ${updates.length - exampleCount} more products\n`);
      }
      
      // Show summary by category
      const categoryCounts = {};
      for (const update of updates) {
        const mainCategory = update.product.matchedCategories[0] || "other";
        categoryCounts[mainCategory] = (categoryCounts[mainCategory] || 0) + 1;
      }
      
      console.log("📊 Summary by category:");
      for (const [category, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`   ${category}: ${count} products`);
      }
      console.log();
      
      console.log("💡 Run without --dry-run to apply these changes\n");
      return;
    }

    console.log("🔄 Updating product tags...\n");
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      try {
        // Update with merged tags (preserves existing, adds new)
        await updateProductTags(update.product.id, update.newTags);
        totalUpdated++;
        totalTagsAdded += update.tagsToAdd.length;
        console.log(`✅ [${i + 1}/${updates.length}] ${update.product.title} - Added: ${update.tagsToAdd.join(", ")}`);
      } catch (error) {
        console.error(`❌ [${i + 1}/${updates.length}] ${update.product.title} - Error: ${error.message}`);
      }

      // Rate limiting - wait 500ms between requests
      if (i < updates.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`\n✅ Complete!\n`);
    console.log(`   Products updated: ${totalUpdated}`);
    console.log(`   Tags added: ${totalTagsAdded}\n`);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

