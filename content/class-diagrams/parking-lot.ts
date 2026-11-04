import type { ClassDiagram } from './types.ts'

const d: ClassDiagram = {
  oodId: 'parking-lot',
  associations: [
    { from: 'ParkingLot', attr: 'levels', to: 'Level', many: true },
    { from: 'Level', attr: 'parking_spots', to: 'ParkingSpot', many: true },
    { from: 'ParkingSpot', attr: 'vehicle', to: 'Vehicle' },
    { from: 'Vehicle', attr: 'vehicle_size', to: 'VehicleSize' },
  ],
}
export default d
