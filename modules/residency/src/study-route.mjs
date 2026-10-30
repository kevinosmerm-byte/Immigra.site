// Only the existing local-text study view is selected by this explicit route.
export function residencyStudyRoute(hash){
 const path=String(hash||'').split('?')[0];
 if(path==='#/residency/study')return true;
 if(path==='#/residency'||path==='#/residency/')return false;
 return null; // Other modules must not discard this module's retained work.
}
