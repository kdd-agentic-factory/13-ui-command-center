import {it,expect,vi} from 'vitest';
vi.mock('../src/domain/productProfile',async()=>({...await vi.importActual('../src/domain/productProfile'),productProfile:'chassis'}));
import {insforge} from '../src/lib/insforge';
it('commercial SDK keeps auth and denies raw provider services',()=>{expect(insforge.auth).toBeDefined();for(const key of ['database','storage','ai','functions','realtime'])expect(()=>Reflect.get(insforge,key)).toThrow('fuera');});
import {renderHook,waitFor} from '@testing-library/react';
import {useInsForgeData} from '../src/hooks/useInsForgeData';
import {fetchAllServiceHealth} from '../src/services/api';
it('commercial background feeds remain inactive without provider or legacy HTTP',async()=>{
 const request=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('must not request'));
 const {result,unmount}=renderHook(()=>useInsForgeData());
 await waitFor(()=>expect(result.current.isLoading).toBe(false));
 expect(result.current.error).toContain('fuera');
 await fetchAllServiceHealth();expect(request).not.toHaveBeenCalled();unmount();request.mockRestore();
});
