import type { EngineeringReference } from './engineeringSession';

export interface ProfileSource {
  kind: 'measurement' | 'manufacturer' | 'team_declaration' | 'inspection';
  reference: string; page: string | null; author_id: string; recorded_at: string;
  verification: 'unverified' | 'checked';
}
export interface ProfileMeasurement {
  value: number | null; unit: string; uncertainty: number | null; source: ProfileSource | null;
}
export interface BikeComponent {
  id: string; parent_id: string | null;
  section: 'chassis' | 'suspension' | 'brakes' | 'powertrain' | 'electrical' | 'aerodynamics' | 'tires' | 'ergonomics';
  label: string; model: string | null; status: 'pending' | 'installed' | 'not_applicable';
  source: ProfileSource | null;
}
export interface BikeProfileInput {
  schema_version: '1.0.0';
  identity: {
    make: string | null; model: string | null; variant: string | null;
    year: number | null; preparation: string | null; source: ProfileSource | null;
  };
  architecture: { value: 'unknown' | 'scooter_cvt' | 'conventional' | 'other'; source: ProfileSource | null };
  components: BikeComponent[]; measurements: Record<string, ProfileMeasurement>;
  base_setup_reference: EngineeringReference | null;
}
export interface BikeProfileRevision {
  schema_version: '1.0.0'; id: string; team_id: string;
  bike_reference: EngineeringReference; revision: number; created_by: string;
  created_at: string; body: BikeProfileInput; digest: string;
}
