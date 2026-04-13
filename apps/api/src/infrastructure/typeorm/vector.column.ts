import { ValueTransformer } from 'typeorm';

/**
 * TypeORM transformer for pgvector `vector` column type.
 * Converts between JavaScript number[] and PostgreSQL vector string format.
 */
export class VectorTransformer implements ValueTransformer {
  to(value: number[] | null): string | null {
    if (!value) return null;
    return `[${value.join(',')}]`;
  }

  from(value: string | null): number[] | null {
    if (!value) return null;
    // pgvector returns as string like "[0.1,0.2,...]"
    if (typeof value === 'string') {
      return value
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(Number);
    }
    return value as unknown as number[];
  }
}

export const vectorTransformer = new VectorTransformer();
