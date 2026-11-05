import {describe,expect,it} from 'vitest';
import {guideSelection} from './guideSelection';
import type {WorkspaceAssociation} from './engineeringSession';

const session={id:crypto.randomUUID(),revision:1};
const lab={context:'current',reference:{id:crypto.randomUUID(),revision:1,digest:'a'.repeat(64)}};
const association:WorkspaceAssociation={session_id:session.id,session_revision:1,
 recording:{id:crypto.randomUUID(),filename:'synthetic',sha256:'b'.repeat(64),geometry_revision:null},
 selection:{recordings:[],comparison:null,setup_a:null,setup_b:null,binding:null,calibration:null,validation:null,environment:null}};

describe('guide snapshot selection',()=>{
 it('includes the current lab reference without mutating the workspace',()=>{
  const value=guideSelection(session,association,'current',lab,association.recording.id);
  expect(value?.suspension_analyses).toEqual([lab.reference]);
  expect(association.selection.suspension_analyses).toBeUndefined();
 });
 it('supports a standalone bench selection with no recording association',()=>{
  expect(guideSelection(session,null,'current',lab,null)?.suspension_analyses).toEqual([lab.reference]);
 });
 it('discards attachments from another workspace and stale associations',()=>{
  expect(guideSelection(session,{...association,session_revision:2},'new',lab,null)).toBeUndefined();
  expect(guideSelection(session,association,'new',lab,crypto.randomUUID())).toBeUndefined();
 });
 it('does not attach anything without an active session',()=>{
  expect(guideSelection(null,association,'current',lab,null)).toBeUndefined();
 });
});
