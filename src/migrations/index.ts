import * as migration_20250929_111647 from './20250929_111647'
import * as migration_20260908_100517_landing from './20260908_100517_landing'

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260908_100517_landing.up,
    down: migration_20260908_100517_landing.down,
    name: '20260908_100517_landing',
  },
]
