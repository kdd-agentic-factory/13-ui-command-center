import type { ComparisonRun } from './chassisComparison';
import type { EngineeringReport } from './engineeringSession';
export interface ChassisReportDocument {schema_version:'1.0.0';classification:'restricted';comparison:ComparisonRun;session:{id:string;source:'aim'|'2d';reader:string;reader_version:string;sha256:string;validation:Record<string,unknown>|null};limitations:string[]}
export function serializeChassisReport(document:ChassisReportDocument){return JSON.stringify(document,null,2);}
/** Preserve saved historical JSON fields; never inject live authority or defaults. */
export function serializeEngineeringReport(document:EngineeringReport){return JSON.stringify(document,null,2);}
