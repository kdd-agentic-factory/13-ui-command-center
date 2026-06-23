export interface BlueprintDimensions {
  x: number;
  y: number;
  z: number;
  loadKg: number;
}

export interface BlueprintValidationSummary {
  mass: number;
  peakStress: number;
  safetyFactor: number;
  rounds: number;
}

export interface BlueprintRequest {
  prompt: string;
  material: string;
  dimensions: BlueprintDimensions;
  result?: BlueprintValidationSummary;
}

export interface BlueprintChatMessage {
  role: 'system' | 'user';
  content: string;
}

const BLUEPRINT_SYSTEM_PROMPT = `You are the blueprint design brief generator for the KDD parts workflow.

Produce a concise markdown brief for the next design step.

Requirements:
- Keep it under 220 words.
- Use short section labels and bullet points.
- Include: goal, geometry assumptions, load concerns, manufacturing notes, validation checklist, and open questions.
- If any input is missing or contradictory, say so explicitly instead of inventing details.
- Write for an engineering team that will use the brief to draft the next CAD/FEA iteration.`;

function formatResult(result: BlueprintValidationSummary): string {
  return [
    `Validated baseline: mass ${result.mass} kg`,
    `peak stress ${result.peakStress} MPa`,
    `safety factor ${result.safetyFactor.toFixed(2)}`,
    `negotiation rounds ${result.rounds}`,
  ].join(' · ');
}

export function buildBlueprintMessages(request: BlueprintRequest): BlueprintChatMessage[] {
  const prompt = request.prompt.trim() || 'No freeform prompt provided.';
  const material = request.material.trim() || 'unspecified';
  const { x, y, z, loadKg } = request.dimensions;

  const contextLines = [
    `Part prompt: ${prompt}`,
    `Material: ${material}`,
    `Envelope: ${x} × ${y} × ${z} mm`,
    `Applied load: ${loadKg} kg`,
    request.result ? formatResult(request.result) : 'Validated baseline: not available yet',
  ];

  return [
    { role: 'system', content: BLUEPRINT_SYSTEM_PROMPT },
    { role: 'user', content: contextLines.join('\n') },
  ];
}
