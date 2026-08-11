/**
 * Active branch for campaign eligibility picker.
 */
export class CampaignBranch {
  id!: string;
  code!: string;
  name!: string;
  address!: Record<string, unknown> | null;
  isActive!: boolean;

  constructor(data: Partial<CampaignBranch>) {
    Object.assign(this, data);
  }
}
