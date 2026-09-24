// lib/merchandising/data.ts
// Curated product discovery catalog: 10 niches x 10 best sellers,
// with multi-niche winners and seasonal demand data.
//
// This dataset powers the merchandising features deterministically so the
// product works without external APIs. Values are editorial estimates
// refreshed by hand, not live market data.

import type {
  CatalogProduct,
  Holiday,
  Niche,
  NicheId,
} from './types'

export const NICHES: Niche[] = [
  { id: 'pets', label: 'Pets', emoji: '🐶', description: 'Accessories and care products for dog and cat owners' },
  { id: 'home', label: 'Home & Kitchen', emoji: '🏠', description: 'Everyday upgrades for living spaces and kitchens' },
  { id: 'fitness', label: 'Fitness', emoji: '💪', description: 'Home workout gear and recovery tools' },
  { id: 'beauty', label: 'Beauty', emoji: '✨', description: 'Skincare tools and personal care devices' },
  { id: 'automotive', label: 'Automotive', emoji: '🚗', description: 'Car organization, cleaning and tech add-ons' },
  { id: 'baby', label: 'Baby', emoji: '🍼', description: 'Practical products for parents of infants and toddlers' },
  { id: 'electronics', label: 'Electronics', emoji: '🔌', description: 'Gadgets and accessories with broad appeal' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🏕️', description: 'Camping, backyard and warm-weather essentials' },
  { id: 'office', label: 'Office', emoji: '💼', description: 'Desk setups and work-from-home comfort' },
  { id: 'fashion', label: 'Fashion', emoji: '👜', description: 'Wearable accessories and comfort apparel' },
]

export const NICHE_MAP: Record<NicheId, Niche> = Object.fromEntries(
  NICHES.map(n => [n.id, n])
) as Record<NicheId, Niche>

export const HOLIDAYS: Holiday[] = [
  { id: 'valentines', label: "Valentine's Day", emoji: '❤️', month: 2 },
  { id: 'easter', label: 'Easter', emoji: '🌷', month: 4 },
  { id: 'mothers_day', label: "Mother's Day", emoji: '👩', month: 5 },
  { id: 'fathers_day', label: "Father's Day", emoji: '👨', month: 6 },
  { id: 'july4', label: 'Fourth of July', emoji: '🎆', month: 7 },
  { id: 'back_to_school', label: 'Back to School', emoji: '🎓', month: 8 },
  { id: 'halloween', label: 'Halloween', emoji: '🎃', month: 10 },
  { id: 'thanksgiving', label: 'Thanksgiving', emoji: '🦃', month: 11 },
  { id: 'black_friday', label: 'Black Friday / Cyber Monday', emoji: '🛍️', month: 11 },
  { id: 'christmas', label: 'Christmas', emoji: '🎄', month: 12 },
]

export const HOLIDAY_MAP = Object.fromEntries(
  HOLIDAYS.map(h => [h.id, h])
) as Record<Holiday['id'], Holiday>

type ProductSeed = Partial<CatalogProduct> &
  Pick<CatalogProduct, 'id' | 'name' | 'niches' | 'cost' | 'price' | 'monthlyOrders' | 'demand' | 'audience'>

function p(seed: ProductSeed): CatalogProduct {
  return {
    rating: 4.5,
    competition: 'Medium',
    shippingDays: 8,
    supplierCount: 6,
    suppliers: ['aliexpress', 'cjdropship'],
    trend: 'stable',
    trendStability: 70,
    seasonality: 'evergreen',
    peakMonths: [],
    holidays: [],
    adPlatform: 'Facebook',
    impulse: false,
    recurring: false,
    bundleWith: [],
    tags: [],
    ...seed,
  }
}

export const PRODUCTS: CatalogProduct[] = [
  // ─── Pets ──────────────────────────────────────────────────────────────────
  p({ id: 'slow-feeder-bowl', name: 'Slow Feeder Dog Bowl', niches: ['pets'], cost: 4.2, price: 18.99, monthlyOrders: 9200, demand: 82, trendStability: 85, competition: 'Medium', audience: 'Dog owners with fast eaters', impulse: true, bundleWith: ['dog-water-bottle', 'pet-hair-remover'], tags: ['best seller', 'under $25'] }),
  p({ id: 'dog-seat-cover', name: 'Waterproof Dog Seat Cover', niches: ['pets', 'automotive'], cost: 9.8, price: 34.99, monthlyOrders: 6400, demand: 78, trendStability: 80, audience: 'Dog owners who travel by car', bundleWith: ['dog-car-hammock', 'car-vacuum'], tags: ['multi-niche'] }),
  p({ id: 'pet-hair-remover', name: 'Reusable Pet Hair Remover Roller', niches: ['pets', 'home'], cost: 3.1, price: 14.99, monthlyOrders: 11800, demand: 86, trendStability: 88, competition: 'High', audience: 'Pet owners with furniture', impulse: true, tags: ['viral', 'under $25'] }),
  p({ id: 'dog-water-bottle', name: 'Portable Dog Water Bottle', niches: ['pets', 'outdoor'], cost: 4.9, price: 19.99, monthlyOrders: 8700, demand: 84, trend: 'rising', trendStability: 82, seasonality: 'seasonal', peakMonths: [5, 6, 7, 8], audience: 'Dog owners who walk and hike', impulse: true, bundleWith: ['dog-seat-cover', 'slow-feeder-bowl'], tags: ['summer'] }),
  p({ id: 'cat-fountain', name: 'Quiet Cat Water Fountain', niches: ['pets'], cost: 11.5, price: 32.99, monthlyOrders: 5600, demand: 74, trendStability: 78, recurring: true, audience: 'Cat owners', bundleWith: ['interactive-cat-toy'], tags: ['recurring filters'] }),
  p({ id: 'gps-dog-collar', name: 'GPS Dog Tracking Collar', niches: ['pets', 'electronics'], cost: 18.0, price: 49.99, monthlyOrders: 3900, demand: 71, trend: 'rising', trendStability: 68, competition: 'Low', shippingDays: 10, audience: 'Safety-focused dog owners', tags: ['premium'] }),
  p({ id: 'dog-car-hammock', name: 'Back Seat Dog Car Hammock', niches: ['pets', 'automotive'], cost: 12.4, price: 39.99, monthlyOrders: 4800, demand: 73, trendStability: 76, audience: 'Road-trip dog owners', bundleWith: ['dog-seat-cover'], tags: ['multi-niche'] }),
  p({ id: 'dog-training-collar', name: 'Remote Dog Training Collar', niches: ['pets'], cost: 13.9, price: 44.99, monthlyOrders: 4100, demand: 69, competition: 'High', audience: 'New dog owners', tags: [] }),
  p({ id: 'pet-grooming-vacuum', name: 'Pet Grooming Vacuum Kit', niches: ['pets', 'home'], cost: 22.0, price: 59.99, monthlyOrders: 3300, demand: 72, trend: 'hot', trendStability: 64, competition: 'Low', audience: 'Owners of long-haired pets', tags: ['premium', 'trending'] }),
  p({ id: 'interactive-cat-toy', name: 'Smart Interactive Cat Toy', niches: ['pets'], cost: 6.3, price: 24.99, monthlyOrders: 7200, demand: 80, trendStability: 74, impulse: true, audience: 'Indoor cat owners', bundleWith: ['cat-fountain'], tags: ['under $25', 'gift'] }),

  // ─── Home & Kitchen ────────────────────────────────────────────────────────
  p({ id: 'led-strip-lights', name: 'Smart LED Strip Lights', niches: ['home', 'electronics', 'office'], cost: 5.8, price: 24.99, monthlyOrders: 14500, demand: 88, trendStability: 82, competition: 'High', impulse: true, holidays: ['halloween', 'christmas'], audience: 'Renters and gamers upgrading rooms', adPlatform: 'TikTok', bundleWith: ['sunset-lamp', 'smart-plug'], tags: ['multi-niche', 'viral'] }),
  p({ id: 'air-purifier', name: 'Compact HEPA Air Purifier', niches: ['home', 'baby'], cost: 19.5, price: 54.99, monthlyOrders: 6100, demand: 79, trendStability: 84, recurring: true, audience: 'Allergy sufferers and parents', bundleWith: ['essential-oil-diffuser'], tags: ['multi-niche', 'recurring filters'] }),
  p({ id: 'portable-blender', name: 'Portable USB Blender', niches: ['home', 'fitness'], cost: 8.9, price: 29.99, monthlyOrders: 9800, demand: 83, trendStability: 72, competition: 'High', impulse: true, audience: 'Smoothie and gym-goers on the move', adPlatform: 'TikTok', bundleWith: ['insulated-bottle'], tags: ['multi-niche'] }),
  p({ id: 'heated-blanket', name: 'Electric Heated Blanket', niches: ['home'], cost: 16.8, price: 49.99, monthlyOrders: 7400, demand: 85, trendStability: 60, seasonality: 'seasonal', peakMonths: [10, 11, 12, 1], holidays: ['christmas', 'black_friday'], audience: 'Cold-climate households', bundleWith: ['weighted-blanket'], tags: ['winter', 'gift'] }),
  p({ id: 'sunset-lamp', name: 'Sunset Projection Lamp', niches: ['home', 'electronics'], cost: 4.6, price: 21.99, monthlyOrders: 8800, demand: 76, trend: 'declining', trendStability: 48, competition: 'High', impulse: true, adPlatform: 'TikTok', audience: 'Teens and content creators', tags: ['viral'] }),
  p({ id: 'spice-rack-organizer', name: 'Rotating Spice Rack Organizer', niches: ['home'], cost: 7.2, price: 27.99, monthlyOrders: 5900, demand: 72, trendStability: 80, audience: 'Home cooks with small kitchens', bundleWith: ['milk-frother'], tags: [] }),
  p({ id: 'milk-frother', name: 'Handheld Milk Frother', niches: ['home'], cost: 2.8, price: 12.99, monthlyOrders: 10400, demand: 81, trendStability: 78, impulse: true, audience: 'Home coffee drinkers', tags: ['under $25', 'impulse'] }),
  p({ id: 'shower-head-filter', name: 'Filtered High-Pressure Shower Head', niches: ['home', 'beauty'], cost: 9.4, price: 34.99, monthlyOrders: 6800, demand: 77, trend: 'rising', trendStability: 74, recurring: true, audience: 'Hair and skin conscious shoppers', tags: ['multi-niche', 'recurring filters'] }),
  p({ id: 'weighted-blanket', name: 'Cooling Weighted Blanket', niches: ['home'], cost: 21.0, price: 59.99, monthlyOrders: 4600, demand: 74, trendStability: 76, seasonality: 'seasonal', peakMonths: [10, 11, 12, 1, 2], holidays: ['christmas'], audience: 'Sleep-focused adults', bundleWith: ['heated-blanket'], tags: ['winter', 'gift'] }),
  p({ id: 'essential-oil-diffuser', name: 'Ultrasonic Essential Oil Diffuser', niches: ['home', 'beauty'], cost: 6.7, price: 25.99, monthlyOrders: 7700, demand: 75, trendStability: 82, recurring: true, audience: 'Wellness and self-care shoppers', bundleWith: ['air-purifier'], tags: ['recurring oils', 'gift'] }),

  // ─── Fitness ───────────────────────────────────────────────────────────────
  p({ id: 'resistance-bands', name: 'Resistance Bands Set', niches: ['fitness'], cost: 3.9, price: 19.99, monthlyOrders: 13200, demand: 87, trendStability: 86, competition: 'High', impulse: true, peakMonths: [1, 2], holidays: [], audience: 'Home workout beginners', bundleWith: ['yoga-mat', 'jump-rope'], tags: ['best seller', 'new year'] }),
  p({ id: 'walking-pad', name: 'Under-Desk Walking Pad', niches: ['fitness', 'office'], cost: 89.0, price: 199.99, monthlyOrders: 2900, demand: 81, trend: 'hot', trendStability: 70, competition: 'Low', shippingDays: 12, supplierCount: 4, audience: 'Remote workers', bundleWith: ['standing-desk-converter'], tags: ['multi-niche', 'premium', 'trending'] }),
  p({ id: 'massage-gun', name: 'Deep Tissue Massage Gun', niches: ['fitness', 'home'], cost: 17.5, price: 49.99, monthlyOrders: 8100, demand: 84, trendStability: 80, holidays: ['christmas', 'fathers_day'], audience: 'Athletes and desk workers', bundleWith: ['foam-roller'], tags: ['multi-niche', 'gift'] }),
  p({ id: 'adjustable-dumbbells', name: 'Adjustable Dumbbell Pair', niches: ['fitness'], cost: 42.0, price: 109.99, monthlyOrders: 3100, demand: 76, trendStability: 78, competition: 'Low', shippingDays: 12, peakMonths: [1, 2], audience: 'Home gym builders', tags: ['premium', 'new year'] }),
  p({ id: 'yoga-mat', name: 'Non-Slip Yoga Mat', niches: ['fitness'], cost: 6.1, price: 26.99, monthlyOrders: 9600, demand: 82, trendStability: 84, competition: 'High', peakMonths: [1, 2], audience: 'Yoga and stretching practitioners', bundleWith: ['resistance-bands', 'foam-roller'], tags: ['new year'] }),
  p({ id: 'smart-scale', name: 'Smart Body Composition Scale', niches: ['fitness', 'electronics'], cost: 9.9, price: 32.99, monthlyOrders: 6900, demand: 78, trendStability: 76, peakMonths: [1], audience: 'Goal trackers', tags: ['multi-niche', 'new year'] }),
  p({ id: 'foam-roller', name: 'Textured Foam Roller', niches: ['fitness'], cost: 5.4, price: 22.99, monthlyOrders: 7300, demand: 75, trendStability: 82, audience: 'Recovery-focused athletes', bundleWith: ['massage-gun', 'yoga-mat'], tags: [] }),
  p({ id: 'pull-up-bar', name: 'Doorway Pull-Up Bar', niches: ['fitness'], cost: 10.8, price: 34.99, monthlyOrders: 5100, demand: 72, trendStability: 78, audience: 'Apartment strength trainers', tags: [] }),
  p({ id: 'jump-rope', name: 'Weighted Speed Jump Rope', niches: ['fitness'], cost: 2.9, price: 14.99, monthlyOrders: 8900, demand: 77, trendStability: 80, impulse: true, audience: 'Cardio-focused exercisers', bundleWith: ['resistance-bands'], tags: ['under $25', 'impulse'] }),
  p({ id: 'wrist-wraps', name: 'Lifting Wrist Wraps', niches: ['fitness'], cost: 2.2, price: 12.99, monthlyOrders: 6200, demand: 70, trendStability: 82, impulse: true, audience: 'Weightlifters', tags: ['under $25'] }),

  // ─── Beauty ────────────────────────────────────────────────────────────────
  p({ id: 'ice-roller', name: 'Facial Ice Roller', niches: ['beauty'], cost: 2.4, price: 13.99, monthlyOrders: 10900, demand: 83, trendStability: 74, competition: 'High', impulse: true, adPlatform: 'TikTok', audience: 'Skincare routine builders', bundleWith: ['scalp-massager'], tags: ['viral', 'under $25'] }),
  p({ id: 'led-face-mask', name: 'LED Light Therapy Face Mask', niches: ['beauty', 'electronics'], cost: 24.0, price: 69.99, monthlyOrders: 3800, demand: 79, trend: 'hot', trendStability: 66, competition: 'Low', audience: 'Skincare enthusiasts', adPlatform: 'TikTok', tags: ['multi-niche', 'premium', 'trending'] }),
  p({ id: 'heatless-curler', name: 'Heatless Hair Curler Set', niches: ['beauty'], cost: 3.2, price: 16.99, monthlyOrders: 9400, demand: 80, trendStability: 70, competition: 'High', impulse: true, adPlatform: 'TikTok', audience: 'Heat-free hair stylers', tags: ['viral', 'under $25'] }),
  p({ id: 'scalp-massager', name: 'Electric Scalp Massager', niches: ['beauty'], cost: 5.6, price: 23.99, monthlyOrders: 7100, demand: 76, trendStability: 76, impulse: true, audience: 'Hair growth and relaxation shoppers', bundleWith: ['ice-roller'], tags: ['gift'] }),
  p({ id: 'callus-remover', name: 'Electric Callus Remover', niches: ['beauty'], cost: 6.8, price: 24.99, monthlyOrders: 6300, demand: 73, trendStability: 78, audience: 'At-home pedicure users', tags: [] }),
  p({ id: 'makeup-brush-cleaner', name: 'Electric Makeup Brush Cleaner', niches: ['beauty'], cost: 5.1, price: 21.99, monthlyOrders: 5800, demand: 71, trendStability: 72, impulse: true, audience: 'Daily makeup wearers', tags: ['under $25'] }),
  p({ id: 'blackhead-vacuum', name: 'Pore Cleansing Vacuum', niches: ['beauty'], cost: 7.4, price: 27.99, monthlyOrders: 5200, demand: 69, trend: 'declining', trendStability: 52, competition: 'High', audience: 'Acne-prone skincare shoppers', tags: [] }),
  p({ id: 'straightener-brush', name: 'Ionic Hair Straightener Brush', niches: ['beauty'], cost: 11.2, price: 36.99, monthlyOrders: 4900, demand: 74, trendStability: 74, audience: 'Quick-styling hair shoppers', tags: [] }),
  p({ id: 'uv-nail-lamp', name: 'UV LED Nail Curing Lamp', niches: ['beauty'], cost: 8.3, price: 29.99, monthlyOrders: 6700, demand: 77, trendStability: 80, recurring: true, audience: 'At-home gel manicure users', tags: ['recurring gels'] }),
  p({ id: 'facial-steamer', name: 'Nano Ionic Facial Steamer', niches: ['beauty'], cost: 10.5, price: 33.99, monthlyOrders: 4400, demand: 70, trendStability: 74, audience: 'Home spa shoppers', holidays: ['mothers_day'], tags: ['gift'] }),

  // ─── Automotive ────────────────────────────────────────────────────────────
  p({ id: 'car-vacuum', name: 'Cordless Car Vacuum', niches: ['automotive', 'home'], cost: 12.6, price: 39.99, monthlyOrders: 8600, demand: 83, trendStability: 82, holidays: ['fathers_day'], audience: 'Commuters and parents', bundleWith: ['car-trash-can', 'seat-gap-filler'], tags: ['multi-niche', 'best seller'] }),
  p({ id: 'car-phone-mount', name: 'Magnetic Car Phone Mount', niches: ['automotive'], cost: 2.7, price: 15.99, monthlyOrders: 12800, demand: 85, trendStability: 86, competition: 'High', impulse: true, audience: 'Every driver with a phone', tags: ['under $25', 'impulse'] }),
  p({ id: 'seat-gap-filler', name: 'Car Seat Gap Organizer', niches: ['automotive'], cost: 3.5, price: 17.99, monthlyOrders: 7900, demand: 78, trendStability: 80, impulse: true, audience: 'Drivers who drop things', bundleWith: ['car-vacuum'], tags: ['under $25'] }),
  p({ id: 'led-car-lights', name: 'Interior LED Car Light Kit', niches: ['automotive', 'electronics'], cost: 4.8, price: 21.99, monthlyOrders: 7200, demand: 76, trendStability: 70, impulse: true, adPlatform: 'TikTok', audience: 'Younger drivers customizing cars', tags: ['multi-niche'] }),
  p({ id: 'car-trash-can', name: 'Leakproof Car Trash Can', niches: ['automotive'], cost: 3.0, price: 14.99, monthlyOrders: 6800, demand: 74, trendStability: 82, impulse: true, audience: 'Commuters and rideshare drivers', bundleWith: ['car-vacuum'], tags: ['under $25'] }),
  p({ id: 'dash-cam', name: '1080p Dash Camera', niches: ['automotive', 'electronics'], cost: 16.4, price: 49.99, monthlyOrders: 5400, demand: 79, trendStability: 80, competition: 'Low', audience: 'Safety-conscious drivers', tags: ['multi-niche'] }),
  p({ id: 'tire-inflator', name: 'Portable Tire Inflator', niches: ['automotive'], cost: 15.8, price: 44.99, monthlyOrders: 5900, demand: 78, trendStability: 84, holidays: ['fathers_day', 'christmas'], audience: 'Preparedness-minded drivers', tags: ['gift'] }),
  p({ id: 'car-seat-organizer', name: 'Backseat Car Organizer', niches: ['automotive', 'baby'], cost: 5.9, price: 23.99, monthlyOrders: 6100, demand: 75, trendStability: 80, audience: 'Parents doing school runs', tags: ['multi-niche'] }),
  p({ id: 'windshield-cover', name: 'Magnetic Windshield Snow Cover', niches: ['automotive'], cost: 4.4, price: 19.99, monthlyOrders: 5200, demand: 72, trendStability: 58, seasonality: 'seasonal', peakMonths: [11, 12, 1, 2], audience: 'Drivers in snowy climates', tags: ['winter'] }),
  p({ id: 'scratch-remover', name: 'Car Scratch Repair Kit', niches: ['automotive'], cost: 3.8, price: 18.99, monthlyOrders: 6600, demand: 73, trendStability: 76, impulse: true, adPlatform: 'TikTok', audience: 'Owners of used cars', tags: ['under $25'] }),

  // ─── Baby ──────────────────────────────────────────────────────────────────
  p({ id: 'baby-monitor', name: 'WiFi Video Baby Monitor', niches: ['baby', 'electronics'], cost: 21.0, price: 59.99, monthlyOrders: 4700, demand: 80, trendStability: 84, competition: 'Low', audience: 'New parents', tags: ['multi-niche', 'premium'] }),
  p({ id: 'diaper-caddy', name: 'Portable Diaper Caddy Organizer', niches: ['baby'], cost: 6.4, price: 24.99, monthlyOrders: 6200, demand: 76, trendStability: 82, audience: 'Parents of newborns', bundleWith: ['silicone-bib'], tags: ['baby shower'] }),
  p({ id: 'white-noise-machine', name: 'Baby White Noise Machine', niches: ['baby', 'home'], cost: 7.8, price: 27.99, monthlyOrders: 7100, demand: 79, trendStability: 84, audience: 'Sleep-deprived parents', tags: ['multi-niche'] }),
  p({ id: 'baby-food-maker', name: 'Baby Food Steamer Blender', niches: ['baby'], cost: 26.0, price: 69.99, monthlyOrders: 2800, demand: 70, trendStability: 78, competition: 'Low', audience: 'Homemade baby food parents', tags: ['premium'] }),
  p({ id: 'hooded-baby-towel', name: 'Bamboo Hooded Baby Towel', niches: ['baby'], cost: 5.2, price: 21.99, monthlyOrders: 5400, demand: 72, trendStability: 80, impulse: true, audience: 'Baby gift buyers', tags: ['gift', 'baby shower'] }),
  p({ id: 'silicone-bib', name: 'Silicone Catch-All Baby Bib', niches: ['baby'], cost: 1.9, price: 11.99, monthlyOrders: 8800, demand: 78, trendStability: 84, impulse: true, audience: 'Parents of weaning babies', bundleWith: ['diaper-caddy'], tags: ['under $25', 'impulse'] }),
  p({ id: 'baby-carrier', name: 'Ergonomic Baby Carrier', niches: ['baby'], cost: 13.5, price: 42.99, monthlyOrders: 4300, demand: 74, trendStability: 82, audience: 'On-the-go parents', tags: [] }),
  p({ id: 'nasal-aspirator', name: 'Electric Baby Nasal Aspirator', niches: ['baby'], cost: 8.1, price: 28.99, monthlyOrders: 4900, demand: 73, trendStability: 76, seasonality: 'seasonal', peakMonths: [10, 11, 12, 1, 2], audience: 'Parents in cold season', tags: ['winter'] }),
  p({ id: 'baby-play-gym', name: 'Foldable Baby Play Gym', niches: ['baby'], cost: 14.7, price: 44.99, monthlyOrders: 3700, demand: 71, trendStability: 80, audience: 'Parents of infants', holidays: ['christmas'], tags: ['gift'] }),
  p({ id: 'bottle-sterilizer', name: 'UV Bottle Sterilizer Dryer', niches: ['baby'], cost: 24.5, price: 64.99, monthlyOrders: 2600, demand: 69, trendStability: 78, competition: 'Low', audience: 'Hygiene-focused parents', tags: ['premium'] }),

  // ─── Electronics ───────────────────────────────────────────────────────────
  p({ id: 'mini-projector', name: 'Portable Mini Projector', niches: ['electronics', 'home'], cost: 28.0, price: 79.99, monthlyOrders: 5300, demand: 82, trendStability: 78, holidays: ['christmas', 'black_friday'], audience: 'Movie-night households', bundleWith: ['power-bank'], tags: ['multi-niche', 'gift'] }),
  p({ id: 'power-bank', name: 'Slim 10,000mAh Power Bank', niches: ['electronics', 'outdoor'], cost: 7.9, price: 26.99, monthlyOrders: 11200, demand: 86, trendStability: 88, competition: 'High', impulse: true, audience: 'Travelers and commuters', bundleWith: ['camping-lantern'], tags: ['multi-niche', 'best seller'] }),
  p({ id: 'wireless-charger', name: '3-in-1 Wireless Charging Station', niches: ['electronics', 'office'], cost: 8.6, price: 29.99, monthlyOrders: 8400, demand: 81, trendStability: 82, audience: 'Apple ecosystem users', tags: ['multi-niche', 'gift'] }),
  p({ id: 'bluetooth-tracker', name: 'Bluetooth Key & Wallet Tracker', niches: ['electronics'], cost: 3.4, price: 16.99, monthlyOrders: 9700, demand: 80, trendStability: 84, impulse: true, audience: 'People who lose things', tags: ['under $25', 'impulse'] }),
  p({ id: 'sleep-earbuds', name: 'Ultra-Thin Sleep Earbuds', niches: ['electronics'], cost: 9.2, price: 32.99, monthlyOrders: 6100, demand: 77, trend: 'rising', trendStability: 72, audience: 'Light sleepers and side sleepers', tags: ['trending'] }),
  p({ id: 'ring-light', name: '10" Ring Light with Tripod', niches: ['electronics', 'beauty'], cost: 6.9, price: 25.99, monthlyOrders: 7600, demand: 76, trendStability: 74, competition: 'High', audience: 'Content creators', tags: ['multi-niche'] }),
  p({ id: 'smart-plug', name: 'WiFi Smart Plug 4-Pack', niches: ['electronics', 'home'], cost: 9.8, price: 32.99, monthlyOrders: 6800, demand: 78, trendStability: 84, audience: 'Smart home starters', bundleWith: ['led-strip-lights'], tags: ['multi-niche'] }),
  p({ id: 'phone-lens-kit', name: 'Clip-On Phone Camera Lens Kit', niches: ['electronics'], cost: 4.3, price: 19.99, monthlyOrders: 5700, demand: 70, trend: 'declining', trendStability: 56, audience: 'Casual phone photographers', tags: ['under $25'] }),
  p({ id: 'karaoke-mic', name: 'Bluetooth Karaoke Microphone', niches: ['electronics'], cost: 6.2, price: 24.99, monthlyOrders: 6900, demand: 75, trendStability: 70, impulse: true, holidays: ['halloween', 'christmas'], audience: 'Families and party hosts', tags: ['gift', 'under $25'] }),
  p({ id: 'led-alarm-clock', name: 'Sunrise Simulation Alarm Clock', niches: ['electronics', 'home'], cost: 10.4, price: 34.99, monthlyOrders: 5100, demand: 74, trendStability: 78, seasonality: 'seasonal', peakMonths: [10, 11, 12, 1], audience: 'Dark-morning commuters', tags: ['multi-niche', 'winter'] }),

  // ─── Outdoor ───────────────────────────────────────────────────────────────
  p({ id: 'neck-fan', name: 'Bladeless Neck Fan', niches: ['outdoor', 'fitness'], cost: 6.8, price: 25.99, monthlyOrders: 8200, demand: 84, trendStability: 62, seasonality: 'seasonal', peakMonths: [5, 6, 7, 8], holidays: ['july4'], impulse: true, adPlatform: 'TikTok', audience: 'Hot-weather commuters and walkers', bundleWith: ['portable-fan'], tags: ['multi-niche', 'summer'] }),
  p({ id: 'waterproof-bags', name: 'Waterproof Dry Storage Bags', niches: ['outdoor', 'home'], cost: 4.1, price: 18.99, monthlyOrders: 6400, demand: 75, trendStability: 76, seasonality: 'seasonal', peakMonths: [5, 6, 7, 8], audience: 'Beach and kayak trippers', tags: ['multi-niche', 'summer'] }),
  p({ id: 'portable-fan', name: 'Rechargeable Portable Fan', niches: ['outdoor', 'home'], cost: 5.5, price: 22.99, monthlyOrders: 9100, demand: 85, trendStability: 60, seasonality: 'seasonal', peakMonths: [4, 5, 6, 7, 8], holidays: ['july4'], impulse: true, audience: 'Summer commuters and campers', bundleWith: ['neck-fan'], tags: ['multi-niche', 'summer'] }),
  p({ id: 'pool-float', name: 'Giant Inflatable Pool Float', niches: ['outdoor'], cost: 7.3, price: 29.99, monthlyOrders: 5800, demand: 78, trendStability: 54, seasonality: 'seasonal', peakMonths: [4, 5, 6, 7, 8], holidays: ['july4'], impulse: true, audience: 'Pool owners and vacationers', tags: ['summer'] }),
  p({ id: 'camping-lantern', name: 'Solar Camping Lantern', niches: ['outdoor'], cost: 5.0, price: 21.99, monthlyOrders: 6600, demand: 76, trendStability: 74, seasonality: 'seasonal', peakMonths: [5, 6, 7, 8, 9], audience: 'Weekend campers', bundleWith: ['power-bank', 'camping-hammock'], tags: ['summer'] }),
  p({ id: 'camping-hammock', name: 'Double Camping Hammock', niches: ['outdoor'], cost: 8.7, price: 32.99, monthlyOrders: 5200, demand: 74, trendStability: 72, seasonality: 'seasonal', peakMonths: [4, 5, 6, 7, 8, 9], audience: 'Hikers and park loungers', bundleWith: ['camping-lantern'], tags: ['summer'] }),
  p({ id: 'insulated-bottle', name: 'Insulated Steel Water Bottle', niches: ['outdoor', 'fitness'], cost: 6.6, price: 27.99, monthlyOrders: 8900, demand: 82, trendStability: 84, competition: 'High', audience: 'Gym-goers and hikers', bundleWith: ['portable-blender'], tags: ['multi-niche', 'best seller'] }),
  p({ id: 'bug-zapper', name: 'Rechargeable Bug Zapper Lamp', niches: ['outdoor'], cost: 6.0, price: 24.99, monthlyOrders: 7100, demand: 79, trendStability: 58, seasonality: 'seasonal', peakMonths: [5, 6, 7, 8], audience: 'Backyard entertainers', tags: ['summer'] }),
  p({ id: 'picnic-blanket', name: 'Sand-Proof Picnic Blanket', niches: ['outdoor'], cost: 5.8, price: 23.99, monthlyOrders: 5500, demand: 73, trendStability: 66, seasonality: 'seasonal', peakMonths: [4, 5, 6, 7, 8], impulse: true, audience: 'Park and beach visitors', tags: ['summer'] }),
  p({ id: 'camping-chair', name: 'Ultralight Folding Camping Chair', niches: ['outdoor'], cost: 11.9, price: 37.99, monthlyOrders: 4800, demand: 72, trendStability: 72, seasonality: 'seasonal', peakMonths: [5, 6, 7, 8, 9], audience: 'Campers and tailgaters', tags: ['summer'] }),

  // ─── Office ────────────────────────────────────────────────────────────────
  p({ id: 'standing-desk-converter', name: 'Standing Desk Converter', niches: ['office', 'home'], cost: 34.0, price: 89.99, monthlyOrders: 3400, demand: 78, trendStability: 80, competition: 'Low', shippingDays: 11, audience: 'Remote workers', bundleWith: ['walking-pad', 'monitor-light-bar'], tags: ['multi-niche', 'premium'] }),
  p({ id: 'desk-organizer', name: 'Bamboo Desk Organizer', niches: ['office'], cost: 7.6, price: 27.99, monthlyOrders: 5600, demand: 73, trendStability: 80, holidays: ['back_to_school'], audience: 'Desk declutterers', tags: [] }),
  p({ id: 'ergonomic-mouse', name: 'Vertical Ergonomic Mouse', niches: ['office'], cost: 6.9, price: 25.99, monthlyOrders: 6700, demand: 77, trendStability: 82, audience: 'Workers with wrist strain', tags: [] }),
  p({ id: 'laptop-stand', name: 'Adjustable Aluminum Laptop Stand', niches: ['office'], cost: 6.3, price: 24.99, monthlyOrders: 7900, demand: 79, trendStability: 84, holidays: ['back_to_school'], audience: 'Laptop-first workers', bundleWith: ['ergonomic-mouse'], tags: ['under $25'] }),
  p({ id: 'desk-pad', name: 'Oversized Leather Desk Pad', niches: ['office'], cost: 4.9, price: 21.99, monthlyOrders: 6100, demand: 74, trendStability: 82, impulse: true, audience: 'Desk setup upgraders', tags: ['under $25'] }),
  p({ id: 'monitor-light-bar', name: 'Monitor Light Bar', niches: ['office', 'electronics'], cost: 9.7, price: 32.99, monthlyOrders: 5300, demand: 76, trend: 'rising', trendStability: 76, audience: 'Late-night screen workers', bundleWith: ['standing-desk-converter'], tags: ['multi-niche', 'trending'] }),
  p({ id: 'foot-rest', name: 'Ergonomic Under-Desk Foot Rest', niches: ['office'], cost: 8.2, price: 28.99, monthlyOrders: 4600, demand: 71, trendStability: 80, audience: 'All-day desk sitters', tags: [] }),
  p({ id: 'cable-kit', name: 'Cable Management Kit', niches: ['office', 'home'], cost: 2.6, price: 13.99, monthlyOrders: 8300, demand: 76, trendStability: 84, impulse: true, audience: 'Tidy desk builders', tags: ['multi-niche', 'under $25', 'impulse'] }),
  p({ id: 'desk-vacuum', name: 'Mini Desk Vacuum', niches: ['office'], cost: 3.3, price: 15.99, monthlyOrders: 5900, demand: 72, trendStability: 76, impulse: true, audience: 'Snackers at desks', tags: ['under $25', 'impulse'] }),
  p({ id: 'seat-cushion', name: 'Memory Foam Seat Cushion', niches: ['office'], cost: 9.1, price: 31.99, monthlyOrders: 5100, demand: 74, trendStability: 82, audience: 'Comfort-seeking desk workers', tags: [] }),

  // ─── Fashion ───────────────────────────────────────────────────────────────
  p({ id: 'crossbody-bag', name: 'Anti-Theft Crossbody Phone Bag', niches: ['fashion'], cost: 6.5, price: 26.99, monthlyOrders: 8400, demand: 81, trendStability: 78, impulse: true, adPlatform: 'TikTok', audience: 'Travelers and festival-goers', tags: ['best seller'] }),
  p({ id: 'heated-vest', name: 'USB Heated Vest', niches: ['fashion', 'outdoor'], cost: 14.8, price: 46.99, monthlyOrders: 5700, demand: 82, trendStability: 58, seasonality: 'seasonal', peakMonths: [10, 11, 12, 1, 2], holidays: ['christmas', 'black_friday'], audience: 'Cold-weather workers and hikers', bundleWith: ['wearable-blanket'], tags: ['multi-niche', 'winter'] }),
  p({ id: 'wearable-blanket', name: 'Oversized Wearable Blanket Hoodie', niches: ['fashion', 'home'], cost: 9.9, price: 36.99, monthlyOrders: 6900, demand: 83, trendStability: 60, seasonality: 'seasonal', peakMonths: [10, 11, 12, 1], holidays: ['christmas'], impulse: true, audience: 'Cozy homebodies', bundleWith: ['heated-vest', 'heated-blanket'], tags: ['multi-niche', 'winter', 'gift'] }),
  p({ id: 'shapewear-bodysuit', name: 'Seamless Shapewear Bodysuit', niches: ['fashion'], cost: 7.7, price: 29.99, monthlyOrders: 7600, demand: 80, trendStability: 74, competition: 'High', adPlatform: 'TikTok', audience: 'Occasionwear shoppers', tags: [] }),
  p({ id: 'minimalist-wallet', name: 'Pop-Up Minimalist Wallet', niches: ['fashion'], cost: 4.4, price: 19.99, monthlyOrders: 8100, demand: 78, trendStability: 82, impulse: true, holidays: ['fathers_day', 'christmas'], audience: 'Slim-carry men', tags: ['under $25', 'gift'] }),
  p({ id: 'blue-light-glasses', name: 'Blue Light Blocking Glasses', niches: ['fashion', 'office'], cost: 2.9, price: 16.99, monthlyOrders: 7300, demand: 74, trendStability: 72, impulse: true, audience: 'Screen-heavy workers', tags: ['multi-niche', 'under $25'] }),
  p({ id: 'silk-pillowcase', name: 'Mulberry Silk Pillowcase', niches: ['fashion', 'beauty'], cost: 5.3, price: 24.99, monthlyOrders: 6500, demand: 76, trendStability: 80, audience: 'Hair and skin care shoppers', holidays: ['mothers_day'], tags: ['multi-niche', 'gift'] }),
  p({ id: 'claw-clip-set', name: 'Matte Claw Clip Set', niches: ['fashion'], cost: 1.8, price: 12.99, monthlyOrders: 9800, demand: 79, trendStability: 68, competition: 'High', impulse: true, adPlatform: 'TikTok', audience: 'Trend-following hair stylers', tags: ['under $25', 'impulse'] }),
  p({ id: 'compression-socks', name: 'Graduated Compression Socks', niches: ['fashion', 'fitness'], cost: 2.5, price: 14.99, monthlyOrders: 7700, demand: 75, trendStability: 84, recurring: true, audience: 'Runners, nurses and travelers', tags: ['multi-niche', 'under $25'] }),
  p({ id: 'beanie-light', name: 'LED Lighted Beanie', niches: ['fashion', 'outdoor'], cost: 4.7, price: 21.99, monthlyOrders: 4900, demand: 72, trendStability: 56, seasonality: 'seasonal', peakMonths: [10, 11, 12, 1], holidays: ['christmas'], impulse: true, audience: 'Dog walkers and early runners', tags: ['multi-niche', 'winter', 'gift'] }),
]

export const PRODUCT_MAP: Record<string, CatalogProduct> = Object.fromEntries(
  PRODUCTS.map(prod => [prod.id, prod])
)

export function getProduct(id: string): CatalogProduct | undefined {
  return PRODUCT_MAP[id]
}

export function productsInNiche(niche: NicheId): CatalogProduct[] {
  return PRODUCTS.filter(prod => prod.niches.includes(niche))
}

export function multiNicheWinners(): CatalogProduct[] {
  return PRODUCTS.filter(prod => prod.niches.length >= 2)
}

export function marginPercent(product: CatalogProduct): number {
  return Math.round(((product.price - product.cost) / product.price) * 100)
}
