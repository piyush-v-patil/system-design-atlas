import type { ClassDiagram } from './types.ts'

const d: ClassDiagram = {
  oodId: 'deck-of-cards',
  associations: [
    { from: 'Card', attr: 'suit', to: 'Suit' },
    { from: 'Hand', attr: 'cards', to: 'Card', many: true },
    { from: 'Deck', attr: 'cards', to: 'Card', many: true },
  ],
  notes: [
    'In the notebook, deal_card() has no self parameter and remaining_cards uses deal_index without self.; the .py module fixes both.',
  ],
}
export default d
