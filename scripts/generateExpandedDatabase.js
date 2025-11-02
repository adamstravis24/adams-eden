/**
 * Generate Expanded Plant Database with 50+ Plants
 * Includes real thumbnails from Perenual API storage
 */

const fs = require('fs').promises;
const path = require('path');

const PLANTS = [
  // VEGETABLES (20 plants)
  { name: "Tomato", scientific: "Solanum lycopersicum", family: "Solanaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/2_solanum_lycopersicum/og/52619084008_0421498a47_b.jpg", water: "moderate", sun: "full_sun", hardMin: 9, hardMax: 11, days: 75, edible: true, parts: ["fruit"], companions: ["Basil", "Marigold", "Carrots"], avoid: ["Cabbage", "Fennel"], pests: ["Hornworm", "Aphids"], diseases: ["Blight", "Wilt"] },
  { name: "Lettuce", scientific: "Lactuca sativa", family: "Asteraceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/1549_lactuca_sativa/og/51657389430_d80d80e8cc_b.jpg", water: "frequent", sun: "partial_shade", hardMin: 4, hardMax: 9, days: 45, edible: true, parts: ["leaves"], companions: ["Carrots", "Radishes"], avoid: ["Parsley"], pests: ["Aphids", "Slugs"], diseases: ["Downy mildew"] },
  { name: "Cucumber", scientific: "Cucumis sativus", family: "Cucurbitaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/927_cucumis_sativus/og/2560px-ARS_cucumber.jpg", water: "frequent", sun: "full_sun", hardMin: 4, hardMax: 11, days: 55, edible: true, parts: ["fruit"], companions: ["Beans", "Corn", "Radishes"], avoid: ["Potatoes"], pests: ["Cucumber beetles"], diseases: ["Powdery mildew"] },
  { name: "Bell Pepper", scientific: "Capsicum annuum", family: "Solanaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/467_capsicum_annuum/og/24785918258_a18deae82e_b.jpg", water: "moderate", sun: "full_sun", hardMin: 9, hardMax: 11, days: 70, edible: true, parts: ["fruit"], companions: ["Basil", "Carrots"], avoid: ["Fennel"], pests: ["Aphids"], diseases: ["Blossom end rot"] },
  { name: "Carrot", scientific: "Daucus carota", family: "Apiaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/1054_daucus_carota/og/49799479768_5f45759a6d_b.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 10, days: 70, edible: true, parts: ["root"], companions: ["Onions", "Rosemary", "Tomatoes"], avoid: ["Dill"], pests: ["Carrot fly"], diseases: ["Rust fly"] },
  { name: "Zucchini", scientific: "Cucurbita pepo", family: "Cucurbitaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/931_cucurbita_pepo/og/Courge_01.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 10, days: 50, edible: true, parts: ["fruit", "flowers"], companions: ["Corn", "Beans"], avoid: ["Potatoes"], pests: ["Squash vine borer"], diseases: ["Powdery mildew"] },
  { name: "Spinach", scientific: "Spinacia oleracea", family: "Amaranthaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/2547_spinacia_oleracea/og/Spinach.jpg", water: "frequent", sun: "partial_sun", hardMin: 2, hardMax: 9, days: 40, edible: true, parts: ["leaves"], companions: ["Strawberries", "Peas"], avoid: ["Potatoes"], pests: ["Leaf miners"], diseases: ["Downy mildew"] },
  { name: "Kale", scientific: "Brassica oleracea", family: "Brassicaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/392_brassica_oleracea/og/2560px-Brassica_oleracea_Plate_from_Koehler27s_Medizinal-Pflanzen_1887.jpg", water: "moderate", sun: "full_sun", hardMin: 6, hardMax: 9, days: 55, edible: true, parts: ["leaves"], companions: ["Beets", "Celery"], avoid: ["Strawberries"], pests: ["Cabbage worms"], diseases: ["Black rot"] },
  { name: "Broccoli", scientific: "Brassica oleracea italica", family: "Brassicaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/388_brassica_oleracea_italica/og/Broccoli_DSC00862.png", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 10, days: 70, edible: true, parts: ["florets", "stems"], companions: ["Onions", "Beets"], avoid: ["Tomatoes"], pests: ["Aphids", "Cabbage worms"], diseases: ["Clubroot"] },
  { name: "Cauliflower", scientific: "Brassica oleracea botrytis", family: "Brassicaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/387_brassica_oleracea_botrytis/og/Cauliflower.jpg", water: "moderate", sun: "full_sun", hardMin: 2, hardMax: 11, days: 75, edible: true, parts: ["head"], companions: ["Beans", "Celery"], avoid: ["Strawberries"], pests: ["Cabbage loopers"], diseases: ["Clubroot"] },
  { name: "Eggplant", scientific: "Solanum melongena", family: "Solanaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/2531_solanum_melongena/og/24705031621_464aae2d7b_b.jpg", water: "moderate", sun: "full_sun", hardMin: 5, hardMax: 12, days: 80, edible: true, parts: ["fruit"], companions: ["Beans", "Peppers"], avoid: ["Fennel"], pests: ["Flea beetles"], diseases: ["Verticillium wilt"] },
  { name: "Radish", scientific: "Raphanus sativus", family: "Brassicaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/2244_raphanus_sativus/og/4892425438_7940e5e7c5_b.jpg", water: "moderate", sun: "full_sun", hardMin: 2, hardMax: 11, days: 25, edible: true, parts: ["root", "leaves"], companions: ["Lettuce", "Carrots"], avoid: ["Hyssop"], pests: ["Flea beetles"], diseases: ["Clubroot"] },
  { name: "Green Beans", scientific: "Phaseolus vulgaris", family: "Fabaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/2099_phaseolus_vulgaris/og/Green_beans.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 10, days: 55, edible: true, parts: ["pods"], companions: ["Corn", "Squash"], avoid: ["Onions", "Garlic"], pests: ["Bean beetles"], diseases: ["Rust"] },
  { name: "Peas", scientific: "Pisum sativum", family: "Fabaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/2136_pisum_sativum/og/Peas_in_pods_-_Studio.jpg", water: "moderate", sun: "full_sun", hardMin: 2, hardMax: 11, days: 60, edible: true, parts: ["pods", "peas"], companions: ["Carrots", "Radishes"], avoid: ["Onions"], pests: ["Aphids"], diseases: ["Powdery mildew"] },
  { name: "Onion", scientific: "Allium cepa", family: "Amaryllidaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/91_allium_cepa/og/2560px-Onion_on_White.jpg", water: "minimal", sun: "full_sun", hardMin: 5, hardMax: 10, days: 100, edible: true, parts: ["bulb"], companions: ["Carrots", "Tomatoes"], avoid: ["Beans", "Peas"], pests: ["Onion maggots"], diseases: ["Downy mildew"] },
  { name: "Garlic", scientific: "Allium sativum", family: "Amaryllidaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/95_allium_sativum/og/Garlic.jpg", water: "minimal", sun: "full_sun", hardMin: 3, hardMax: 10, days: 240, edible: true, parts: ["bulb"], companions: ["Tomatoes", "Roses"], avoid: ["Beans", "Peas"], pests: ["Aphids"], diseases: ["White rot"] },
  { name: "Potato", scientific: "Solanum tuberosum", family: "Solanaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/2537_solanum_tuberosum/og/2560px-Potato_flowers.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 10, days: 90, edible: true, parts: ["tuber"], companions: ["Beans", "Corn"], avoid: ["Tomatoes", "Sunflowers"], pests: ["Colorado potato beetle"], diseases: ["Late blight"] },
  { name: "Sweet Potato", scientific: "Ipomoea batatas", family: "Convolvulaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/1399_ipomoea_batatas/og/Sweet_potato.jpg", water: "moderate", sun: "full_sun", hardMin: 9, hardMax: 11, days: 100, edible: true, parts: ["tuber", "leaves"], companions: ["Beets", "Parsnips"], avoid: ["Squash"], pests: ["Sweet potato weevils"], diseases: ["Fusarium wilt"] },
  { name: "Beet", scientific: "Beta vulgaris", family: "Amaranthaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/288_beta_vulgaris/og/4945775092_cf03734f68_b.jpg", water: "moderate", sun: "full_sun", hardMin: 2, hardMax: 10, days: 55, edible: true, parts: ["root", "greens"], companions: ["Onions", "Lettuce"], avoid: ["Pole beans"], pests: ["Leaf miners"], diseases: ["Cercospora leaf spot"] },
  { name: "Corn", scientific: "Zea mays", family: "Poaceae", cat: "Vegetables", img: "https://perenual.com/storage/species_image/2880_zea_mays/og/Corncobs.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 11, days: 75, edible: true, parts: ["kernels"], companions: ["Beans", "Squash", "Peas"], avoid: ["Tomatoes"], pests: ["Corn earworm"], diseases: ["Corn smut"] },

  // HERBS (15 plants)
  { name: "Basil", scientific: "Ocimum basilicum", family: "Lamiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/1926_ocimum_basilicum/og/Basil-Basilico-Ocimum_basilicum-albahaca.jpg", water: "moderate", sun: "full_sun", hardMin: 10, hardMax: 11, days: 60, edible: true, parts: ["leaves"], companions: ["Tomatoes", "Peppers"], avoid: ["Rue"], pests: ["Aphids", "Japanese beetles"], diseases: ["Downy mildew"] },
  { name: "Rosemary", scientific: "Rosmarinus officinalis", family: "Lamiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/2392_rosmarinus_officinalis/og/Rosmarinus_officinalis266.jpg", water: "minimal", sun: "full_sun", hardMin: 7, hardMax: 10, days: 90, edible: true, parts: ["leaves"], companions: ["Cabbage", "Beans"], avoid: ["Potatoes"], pests: ["Spider mites"], diseases: ["Root rot"] },
  { name: "Mint", scientific: "Mentha", family: "Lamiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/1798_mentha/og/Mentha_longifolia_2005.08.02_09.53.56.jpg", water: "frequent", sun: "partial_shade", hardMin: 3, hardMax: 11, days: 90, edible: true, parts: ["leaves"], companions: ["Cabbage", "Tomatoes"], avoid: ["Parsley"], pests: ["Aphids"], diseases: ["Rust"] },
  { name: "Thyme", scientific: "Thymus vulgaris", family: "Lamiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/2691_thymus_vulgaris/og/Thymus_vulgaris_flowering.jpg", water: "minimal", sun: "full_sun", hardMin: 5, hardMax: 9, days: 95, edible: true, parts: ["leaves"], companions: ["Cabbage", "Eggplant"], avoid: [], pests: ["Spider mites"], diseases: ["Root rot"] },
  { name: "Oregano", scientific: "Origanum vulgare", family: "Lamiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/1994_origanum_vulgare/og/Origanum_vulgare_-_harilik_pune.jpg", water: "minimal", sun: "full_sun", hardMin: 4, hardMax: 10, days: 90, edible: true, parts: ["leaves"], companions: ["Tomatoes", "Peppers"], avoid: [], pests: ["Aphids"], diseases: ["Root rot"] },
  { name: "Parsley", scientific: "Petroselinum crispum", family: "Apiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/2084_petroselinum_crispum/og/Petroselinum_crispum_-_Pertersilie.jpg", water: "moderate", sun: "partial_sun", hardMin: 5, hardMax: 9, days: 70, edible: true, parts: ["leaves"], companions: ["Tomatoes", "Asparagus"], avoid: ["Lettuce", "Mint"], pests: ["Aphids"], diseases: ["Leaf spot"] },
  { name: "Cilantro", scientific: "Coriandrum sativum", family: "Apiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/884_coriandrum_sativum/og/Coriander.jpg", water: "moderate", sun: "partial_sun", hardMin: 2, hardMax: 11, days: 50, edible: true, parts: ["leaves", "seeds"], companions: ["Tomatoes", "Spinach"], avoid: ["Fennel"], pests: ["Aphids"], diseases: ["Powdery mildew"] },
  { name: "Dill", scientific: "Anethum graveolens", family: "Apiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/129_anethum_graveolens/og/Dill_flowering.jpg", water: "moderate", sun: "full_sun", hardMin: 2, hardMax: 11, days: 70, edible: true, parts: ["leaves", "seeds"], companions: ["Cabbage", "Lettuce"], avoid: ["Carrots"], pests: ["Aphids"], diseases: ["Downy mildew"] },
  { name: "Chives", scientific: "Allium schoenoprasum", family: "Amaryllidaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/90_allium_schoenoprasum/og/Allium_schoenoprasum_in_a_cottage_garden.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 10, days: 90, edible: true, parts: ["leaves", "flowers"], companions: ["Carrots", "Tomatoes"], avoid: ["Beans", "Peas"], pests: ["Aphids"], diseases: ["Downy mildew"] },
  { name: "Sage", scientific: "Salvia officinalis", family: "Lamiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/2436_salvia_officinalis/og/Salvia_officinalis0.jpg", water: "minimal", sun: "full_sun", hardMin: 4, hardMax: 8, days: 75, edible: true, parts: ["leaves"], companions: ["Rosemary", "Carrots"], avoid: ["Cucumbers"], pests: ["Spider mites"], diseases: ["Powdery mildew"] },
  { name: "Lavender", scientific: "Lavandula", family: "Lamiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/1530_lavandula/og/Lavandula_angustifolia_-_Køhler%E2%80%93s_Medizinal-Pflanzen-087.jpg", water: "minimal", sun: "full_sun", hardMin: 5, hardMax: 9, days: 100, edible: true, parts: ["flowers"], companions: ["Roses", "Fruit trees"], avoid: [], pests: ["Whiteflies"], diseases: ["Root rot"] },
  { name: "Chamomile", scientific: "Matricaria chamomilla", family: "Asteraceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/1731_matricaria_chamomilla/og/Matricaria_February_2008-1.jpg", water: "moderate", sun: "full_sun", hardMin: 2, hardMax: 8, days: 60, edible: true, parts: ["flowers"], companions: ["Cabbage", "Onions"], avoid: ["Mint"], pests: ["Aphids"], diseases: ["Powdery mildew"] },
  { name: "Lemon Balm", scientific: "Melissa officinalis", family: "Lamiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/1776_melissa_officinalis/og/Melissa_officinalis_20100704_b.jpg", water: "moderate", sun: "partial_sun", hardMin: 4, hardMax: 9, days: 70, edible: true, parts: ["leaves"], companions: ["Tomatoes", "Squash"], avoid: [], pests: ["Aphids"], diseases: ["Powdery mildew"] },
  { name: "Tarragon", scientific: "Artemisia dracunculus", family: "Asteraceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/180_artemisia_dracunculus/og/Artemisia_dracunculus.jpg", water: "minimal", sun: "full_sun", hardMin: 4, hardMax: 8, days: 90, edible: true, parts: ["leaves"], companions: ["Eggplant"], avoid: [], pests: ["Spider mites"], diseases: ["Root rot"] },
  { name: "Fennel", scientific: "Foeniculum vulgare", family: "Apiaceae", cat: "Herbs", img: "https://perenual.com/storage/species_image/1185_foeniculum_vulgare/og/Foeniculum_vulgare1.jpg", water: "moderate", sun: "full_sun", hardMin: 4, hardMax: 9, days: 90, edible: true, parts: ["leaves", "seeds", "bulb"], companions: ["Dill"], avoid: ["Tomatoes", "Beans"], pests: ["Aphids"], diseases: ["Powdery mildew"] },

  // FLOWERS (15 plants)
  { name: "Marigold", scientific: "Tagetes", family: "Asteraceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/2637_tagetes/og/Tagetes_erecta_003.JPG", water: "moderate", sun: "full_sun", hardMin: 2, hardMax: 11, days: 60, edible: true, parts: ["petals"], companions: ["Tomatoes", "Peppers"], avoid: ["Beans"], pests: [], diseases: ["Powdery mildew"] },
  { name: "Sunflower", scientific: "Helianthus annuus", family: "Asteraceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/1290_helianthus_annuus/og/Sunflower_sky_backdrop.jpg", water: "moderate", sun: "full_sun", hardMin: 4, hardMax: 9, days: 85, edible: true, parts: ["seeds"], companions: ["Cucumbers", "Squash"], avoid: ["Potatoes"], pests: ["Birds"], diseases: ["Rust"] },
  { name: "Zinnia", scientific: "Zinnia elegans", family: "Asteraceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/2895_zinnia_elegans/og/Zinnia_elegans_1.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 10, days: 60, edible: false, parts: [], companions: ["Tomatoes", "Vegetables"], avoid: [], pests: ["Japanese beetles"], diseases: ["Powdery mildew"] },
  { name: "Petunia", scientific: "Petunia", family: "Solanaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/2091_petunia/og/Petunia_cultivars01.jpg", water: "moderate", sun: "full_sun", hardMin: 9, hardMax: 11, days: 70, edible: false, parts: [], companions: ["Beans", "Squash"], avoid: [], pests: ["Aphids"], diseases: ["Botrytis"] },
  { name: "Cosmos", scientific: "Cosmos bipinnatus", family: "Asteraceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/893_cosmos_bipinnatus/og/Cosmos_bipinnatus.jpg", water: "minimal", sun: "full_sun", hardMin: 2, hardMax: 11, days: 70, edible: false, parts: [], companions: ["Tomatoes"], avoid: [], pests: ["Aphids"], diseases: ["Powdery mildew"] },
  { name: "Dahlia", scientific: "Dahlia", family: "Asteraceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/1003_dahlia/og/Dahlia_x_hybridus_Kamerun.jpg", water: "moderate", sun: "full_sun", hardMin: 8, hardMax: 11, days: 90, edible: false, parts: [], companions: ["Roses"], avoid: [], pests: ["Earwigs", "Slugs"], diseases: ["Powdery mildew"] },
  { name: "Rose", scientific: "Rosa", family: "Rosaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/2379_rosa/og/Beautiful_red_rose.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 11, days: 365, edible: true, parts: ["petals", "hips"], companions: ["Garlic", "Lavender"], avoid: [], pests: ["Aphids", "Japanese beetles"], diseases: ["Black spot", "Powdery mildew"] },
  { name: "Pansy", scientific: "Viola tricolor", family: "Violaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/2792_viola_tricolor/og/Viola_tricolor_cultivar_001.jpg", water: "moderate", sun: "partial_sun", hardMin: 4, hardMax: 8, days: 60, edible: true, parts: ["flowers"], companions: ["Strawberries"], avoid: [], pests: ["Slugs"], diseases: ["Powdery mildew"] },
  { name: "Snapdragon", scientific: "Antirrhinum majus", family: "Plantaginaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/143_antirrhinum_majus/og/Antirrhinum_majus_L.jpg", water: "moderate", sun: "full_sun", hardMin: 7, hardMax: 11, days: 75, edible: false, parts: [], companions: ["Vegetables"], avoid: [], pests: ["Aphids"], diseases: ["Rust"] },
  { name: "Geranium", scientific: "Pelargonium", family: "Geraniaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/2056_pelargonium/og/Pelargonium_inquinans001.jpg", water: "moderate", sun: "full_sun", hardMin: 9, hardMax: 11, days: 90, edible: false, parts: [], companions: ["Roses", "Corn"], avoid: [], pests: ["Whiteflies"], diseases: ["Botrytis"] },
  { name: "Impatiens", scientific: "Impatiens walleriana", family: "Balsaminaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/1384_impatiens_walleriana/og/Impatiens_walleriana_-_Guernsey_27-5-09_175.jpg", water: "frequent", sun: "partial_shade", hardMin: 10, hardMax: 11, days: 70, edible: false, parts: [], companions: ["Hostas"], avoid: [], pests: ["Aphids", "Spider mites"], diseases: ["Downy mildew"] },
  { name: "Begonia", scientific: "Begonia", family: "Begoniaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/283_begonia/og/Begonia_odorata_1.jpg", water: "moderate", sun: "partial_shade", hardMin: 9, hardMax: 11, days: 85, edible: false, parts: [], companions: [], avoid: [], pests: ["Aphids", "Mealybugs"], diseases: ["Powdery mildew"] },
  { name: "Nasturtium", scientific: "Tropaeolum majus", family: "Tropaeolaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/2741_tropaeolum_majus/og/Tropaeolum_majus_-_Starr_050807-3512.jpg", water: "moderate", sun: "full_sun", hardMin: 9, hardMax: 11, days: 45, edible: true, parts: ["flowers", "leaves", "seeds"], companions: ["Cucumbers", "Radishes"], avoid: [], pests: [], diseases: ["Aphids"] },
  { name: "Black-eyed Susan", scientific: "Rudbeckia hirta", family: "Asteraceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/2402_rudbeckia_hirta/og/Rudbeckia_hirta_2006.08.25_15.04.17-p8250039.jpg", water: "minimal", sun: "full_sun", hardMin: 3, hardMax: 7, days: 90, edible: false, parts: [], companions: ["Coneflowers"], avoid: [], pests: ["Aphids"], diseases: ["Powdery mildew"] },
  { name: "Morning Glory", scientific: "Ipomoea purpurea", family: "Convolvulaceae", cat: "Flowers", img: "https://perenual.com/storage/species_image/1402_ipomoea_purpurea/og/Ipomoea_purpurea_20070730.jpg", water: "moderate", sun: "full_sun", hardMin: 3, hardMax: 10, days: 60, edible: false, parts: [], companions: ["Corn"], avoid: [], pests: ["Aphids"], diseases: ["Leaf spot"] }
];

// Build full database
async function generateDatabase() {
  console.log('🌱 Generating Expanded Plant Database (50 Plants)...\n');
  
  const plants = PLANTS.map((p, idx) => ({
    id: `plant_${String(idx + 1).padStart(4, '0')}`,
    commonName: p.name,
    commonNames: [p.name],
    scientificName: p.scientific,
    family: p.family,
    genus: p.scientific.split(' ')[0],
    category: p.cat,
    thumbnail: p.img,
    images: [],
    care: {
      watering: p.water,
      sunlight: p.sun,
      hardiness: { min: p.hardMin, max: p.hardMax },
      soilType: ["loam", "well-draining"],
      soilPH: { min: 6.0, max: 7.0 },
      fertilizer: "Balanced fertilizer as needed",
      spacing: "Follow seed packet instructions",
      depth: "0.25-0.5 inches"
    },
    type: '',
    edible: p.edible,
    edibleParts: p.parts,
    toxic: false,
    toxicTo: [],
    height: { min: 30, max: 180, unit: 'cm' },
    spread: { min: null, max: null, unit: 'cm' },
    growthRate: 'moderate',
    bloomTime: ["summer"],
    harvestTime: p.edible ? ["summer", "fall"] : [],
    daysToMaturity: p.days,
    native: [],
    invasive: false,
    drought: p.water === "minimal",
    deer: false,
    attracts: ["Bees", "Butterflies"],
    companionPlants: p.companions,
    avoidPlants: p.avoid,
    pests: p.pests,
    diseases: p.diseases,
    pestRepellent: [],
    source: 'curated',
    sourceId: String(idx + 1),
    lastUpdated: new Date().toISOString()
  }));

  const database = {
    version: '2.1.0',
    generatedAt: new Date().toISOString(),
    plantCount: plants.length,
    sources: ['curated', 'perenual'],
    license: 'Educational Use',
    attribution: 'Adams Eden Team + Perenual',
    categories: {
      vegetables: plants.filter(p => p.category === 'Vegetables').length,
      herbs: plants.filter(p => p.category === 'Herbs').length,
      flowers: plants.filter(p => p.category === 'Flowers').length
    },
    plants: plants.sort((a, b) => a.commonName.localeCompare(b.commonName))
  };

  const outputPath = path.join(__dirname, '..', 'assets', 'data', 'comprehensive-plant-database.json');
  await fs.writeFile(outputPath, JSON.stringify(database, null, 2));
  
  console.log(`✅ Database Created!`);
  console.log(`📊 Total Plants: ${plants.length}`);
  console.log(`🥕 Vegetables: ${database.categories.vegetables}`);
  console.log(`🌿 Herbs: ${database.categories.herbs}`);
  console.log(`🌸 Flowers: ${database.categories.flowers}`);
  console.log(`📁 File: ${outputPath}`);
  console.log(`💾 Size: ${(JSON.stringify(database).length / 1024).toFixed(2)} KB\n`);
}

generateDatabase().catch(console.error);
