import type { RestaurantCandidate } from '$lib/domain/decision';

export interface DemoRestaurant extends RestaurantCandidate {
	emoji: string;
	address: string;
}

export const demoRestaurants: DemoRestaurant[] = [
	{
		id: 'masala-moon',
		name: 'Masala Moon',
		cuisines: ['indian'],
		traits: ['spicy', 'savory', 'comfort'],
		distanceMiles: 1.4,
		priceLevel: 2,
		isOpen: true,
		emoji: '🍛',
		address: '14 Lantern Lane'
	},
	{
		id: 'verde-taco',
		name: 'Verde Taco House',
		cuisines: ['mexican'],
		traits: ['spicy', 'fresh', 'savory'],
		distanceMiles: 2.1,
		priceLevel: 1,
		isOpen: true,
		emoji: '🌮',
		address: '82 Market Street'
	},
	{
		id: 'hearth-pasta',
		name: 'Hearth & Pasta',
		cuisines: ['italian'],
		traits: ['comfort', 'savory', 'hearty'],
		distanceMiles: 3.2,
		priceLevel: 2,
		isOpen: true,
		emoji: '🍝',
		address: '7 Olive Court'
	},
	{
		id: 'paper-crane',
		name: 'Paper Crane Kitchen',
		cuisines: ['japanese'],
		traits: ['fresh', 'light', 'savory'],
		distanceMiles: 4.3,
		priceLevel: 3,
		isOpen: true,
		emoji: '🍣',
		address: '210 Garden Avenue'
	},
	{
		id: 'cedar-table',
		name: 'Cedar Table',
		cuisines: ['mediterranean'],
		traits: ['fresh', 'healthy', 'savory'],
		distanceMiles: 2.8,
		priceLevel: 2,
		isOpen: true,
		emoji: '🥙',
		address: '55 Grove Road'
	},
	{
		id: 'ember-burger',
		name: 'Ember Burger Co.',
		cuisines: ['american'],
		traits: ['smoky', 'hearty', 'salty'],
		distanceMiles: 1.9,
		priceLevel: 2,
		isOpen: true,
		emoji: '🍔',
		address: '31 Foundry Way'
	},
	{
		id: 'golden-wok',
		name: 'Golden Wok',
		cuisines: ['chinese'],
		traits: ['savory', 'comfort', 'spicy'],
		distanceMiles: 5.6,
		priceLevel: 1,
		isOpen: true,
		emoji: '🥡',
		address: '9 Station Square'
	},
	{
		id: 'sugar-cloud',
		name: 'Sugar Cloud Cafe',
		cuisines: ['dessert'],
		traits: ['sweet', 'light'],
		distanceMiles: 0.8,
		priceLevel: 1,
		isOpen: false,
		emoji: '🍰',
		address: '4 Baker Walk'
	}
];
