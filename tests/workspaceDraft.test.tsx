import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceDraftProvider, useWorkspaceDraft } from '../src/context/WorkspaceDraftContext';
function Probe({leave}:{leave:()=>void}){const draft=useWorkspaceDraft();return <><button onClick={()=>draft.markDirty(true)}>Editar</button><button onClick={()=>draft.requestLeave(leave)}>Salir</button><span>{draft.isDirty?'Borrador':'Guardado'}</span></>;}
describe('workspace draft protection',()=>{
  it('keeps a draft when canceling navigation and leaves once when discarded',()=>{
    const leave=vi.fn();render(<WorkspaceDraftProvider><Probe leave={leave}/></WorkspaceDraftProvider>);
    fireEvent.click(screen.getByText('Editar'));fireEvent.click(screen.getByText('Salir'));
    expect(leave).not.toHaveBeenCalled();expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Seguir editando'));expect(screen.getByText('Borrador')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Salir'));fireEvent.click(screen.getByText('Descartar cambios y continuar'));expect(leave).toHaveBeenCalledTimes(1);
  });
  it('discards a pending navigation when identity changes',()=>{
    const leave=vi.fn();render(<WorkspaceDraftProvider><Probe leave={leave}/></WorkspaceDraftProvider>);
    fireEvent.click(screen.getByText('Editar'));fireEvent.click(screen.getByText('Salir'));
    act(()=>window.dispatchEvent(new Event('telemetry-scope-changed')));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();expect(screen.getByText('Guardado')).toBeInTheDocument();expect(leave).not.toHaveBeenCalled();
  });
});
