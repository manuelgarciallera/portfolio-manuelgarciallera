import * as migration_20260910_123524_owner_baseline from './20260910_123524_owner_baseline';

export const migrations = [
  {
    up: migration_20260910_123524_owner_baseline.up,
    down: migration_20260910_123524_owner_baseline.down,
    name: '20260910_123524_owner_baseline'
  },
];
