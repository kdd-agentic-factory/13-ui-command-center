import { render,screen } from '@testing-library/react';
import { expect,it } from 'vitest';
import { ContrastPanel } from './ContrastPanel';
it('keeps dissent, reviewer classification and same-model independence explicit',()=>{
  render(<ContrastPanel sections={[]} matrix={{conflicts:[{code:'hypothesis_difference',topic:'trail_m',sources:['chassis','mechanical-check']}],missing_reviewers:['evidence-quality'],review_evidence:{},consensus:'not_established',independence:'process_independent_same_model',external_validation:false,object_reviews:[{candidate_id:'a'.repeat(64),setup_id:'setup-1',parameter:'offset_m',reviewer_id:'mechanical-check',classification:'material_disagreement',basis:'different_hypotheses',result_hash:'b'.repeat(64),references:[]}]}}/>);
  expect(screen.getByText('Desacuerdo material')).toBeInTheDocument();
  expect(screen.getByText(/Procesos independientes con el mismo modelo/)).toBeInTheDocument();
  expect(screen.getByText(/Sin validación externa/)).toBeInTheDocument();
  expect(screen.getByText('trail_m')).toBeInTheDocument();
  expect(screen.getByText('Candidato aaaaaaaa…aaaa')).toBeInTheDocument();
  expect(screen.getByText('a'.repeat(64))).not.toBeVisible();

});

