import { RoofSegmentSummary } from '../roof-segment-summary/roof-segment-summary.interface';

export interface PanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries: RoofSegmentSummary[];
}
