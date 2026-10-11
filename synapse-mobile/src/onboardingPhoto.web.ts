import type {PhotoPort} from './content/onboardingPhoto';
export const photoPort:PhotoPort={
 async pick(){return {kind:'denied'}},
 async copy(){throw Error('Foto disponibile nell’app sul telefono.')},
 async remove(){},async exists(){return false},
};
export async function cleanPhotos(_references:string[]){}
