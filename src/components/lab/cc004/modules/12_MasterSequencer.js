import { AmplitudeMatrix } from './01_AmplitudeMatrix';
import { TypographicSignal } from './02_TypographicSignal';
import { IterativeGlyphEngine } from './03_IterativeGlyphEngine';
import { SpectralCentroid } from './04_SpectralCentroid';
import { AudioReactiveASCII } from './05_AudioReactiveASCII';
import { VariableTypography } from './06_VariableTypography';
import { DitherModulator } from './07_DitherModulator';
import { ElasticGrid } from './08_ElasticGrid';
import { KineticGridTension } from './09_KineticGridTension';
import { ComponentStressAudit } from './10_ComponentStressAudit';
import { LissajousOrbiters } from './11_LissajousOrbiters';

const sequence = [
  { mod: AmplitudeMatrix, name: "01_AMPLITUDE_MATRIX", duration: 5000 },
  { mod: TypographicSignal, name: "02_TYPOGRAPHIC_SIGNAL", duration: 5000 },
  { mod: IterativeGlyphEngine, name: "03_ITERATIVE_GLYPH_ENGINE", duration: 6000 },
  { mod: SpectralCentroid, name: "04_SPECTRAL_CENTROID", duration: 4000 },
  { mod: AudioReactiveASCII, name: "05_AUDIO_ASCII", duration: 5000 },
  { mod: VariableTypography, name: "06_VARIABLE_TYPOGRAPHY", duration: 4000 },
  { mod: DitherModulator, name: "07_DITHER_MODULATOR", duration: 4000 },
  { mod: ElasticGrid, name: "08_ELASTIC_GRID", duration: 5000 },
  { mod: KineticGridTension, name: "09_KINETIC_GRID_TENSION", duration: 5000 },
  { mod: ComponentStressAudit, name: "10_COMPONENT_STRESS_AUDIT", duration: 6000 },
  { mod: LissajousOrbiters, name: "11_LISSAJOUS_ORBITERS", duration: 7000 }
];

let startTime = null;

export const MasterSequencer = (ctx, w, h, data) => {
  if (!startTime) startTime = Date.now();
  
  const elapsed = Date.now() - startTime;
  
  // Calculate total sequence duration
  const totalDuration = sequence.reduce((sum, item) => sum + item.duration, 0);
  const currentLoopTime = elapsed % totalDuration;

  let activeItem = null;
  let timeAccumulator = 0;
  
  for (let i = 0; i < sequence.length; i++) {
    timeAccumulator += sequence[i].duration;
    if (currentLoopTime < timeAccumulator) {
      activeItem = sequence[i];
      break;
    }
  }

  if (activeItem) {
    // Render the delegated module
    activeItem.mod(ctx, w, h, data);

    // Draw the Master Sequencer HUD Overlay
    ctx.save();
    
    // Dim background for HUD
    ctx.fillStyle = 'rgba(5, 5, 5, 0.5)';
    ctx.fillRect(0, h - 80, w, 80);

    // Timeline bar
    const progress = currentLoopTime / totalDuration;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, h - 80, w, 4);
    
    ctx.fillStyle = '#0055FF'; // agency-blue
    ctx.fillRect(0, h - 80, w * progress, 4);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('DIRECTOR_HUD // MASTER_SEQUENCER_ACTIVE', 20, h - 60);
    
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#D2B48C'; // cosmic-latte
    ctx.fillText(`CURRENT_EXECUTABLE: ${activeItem.name}`, 20, h - 35);
    
    // Time code
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`T+ ${(currentLoopTime / 1000).toFixed(2)}s`, w - 20, h - 35);

    ctx.restore();
  }
};
