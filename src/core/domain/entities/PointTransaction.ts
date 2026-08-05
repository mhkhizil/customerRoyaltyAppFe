/**
 * Customer point ledger entry.
 * Matches GET /api/v1/client/points/transactions item shape.
 */
export class PointTransaction {
  id!: string;
  type!: string;
  source!: string;
  points!: number;
  balanceAfter!: number;
  createdAt!: string;
  description!: Record<string, unknown> | string | null;

  constructor(data: Partial<PointTransaction>) {
    Object.assign(this, data);
  }

  get isCredit(): boolean {
    return this.points > 0;
  }
}
