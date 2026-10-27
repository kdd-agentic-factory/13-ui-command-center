import {useState} from 'react';
import {initialWorkView,type WorkView} from '../domain/chassisWorkViews';
export function useChassisWorkView(profileId:string|null,scope:string){
 const key=JSON.stringify([profileId,scope]);
 const [selection,setSelection]=useState({key,view:initialWorkView(profileId)});
 return {view:selection.key===key?selection.view:initialWorkView(profileId),setView:(view:WorkView)=>setSelection({key,view})};
}
