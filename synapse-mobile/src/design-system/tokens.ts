/** Lume palette revised 2026-10-14. Keep role names stable: consumers must not infer theme from a hex literal. */
export const light={paper:'#F7F1E3',ink:'#353629',muted:'#6E6B59',surface:'#EAE3CF',accent:'#62653C',active:'#D6D5AD',line:'#DCD5BF'};
export const dark={paper:'#1B1915',ink:'#F2EBDD',muted:'#BFB49F',surface:'#353228',accent:'#C4C08C',active:'#514E36',line:'#4B4638'};
export type Palette=typeof light;
export const heading='Newsreader_500Medium',body='GoogleSansFlex_400Regular',bold='GoogleSansFlex_600SemiBold';
export const fonts={body,medium:'GoogleSansFlex_500Medium',bold,heading,editorial:'Newsreader_400Regular',brand:'Newsreader_800ExtraBold_Italic'} as const;
export const space={xs:4,sm:8,md:12,lg:16,xl:24,xxl:32,section:28} as const;
export const radius={small:12,control:16,card:24,sheet:28,pill:999} as const;
export const metrics={touch:48,icon:24,pageInset:24,controlHeight:52} as const;
export const layers={header:2,dock:20,returnDock:45,notice:90,sheet:150,onboarding:200} as const;
export const typography={
  page:{fontFamily:heading,fontSize:38,lineHeight:42,letterSpacing:-.9},
  collection:{fontFamily:heading,fontSize:34,lineHeight:38,letterSpacing:-.8},
  feed:{fontFamily:heading,fontSize:36,lineHeight:40},
  title:{fontFamily:bold,fontSize:18,lineHeight:25},
  body:{fontFamily:body,fontSize:17,lineHeight:25},
  detail:{fontFamily:body,fontSize:14,lineHeight:20},
  section:{fontFamily:fonts.medium,fontSize:12,lineHeight:18,letterSpacing:1.1},
} as const;
/** Approved variants: different gestures deliberately keep different physics. */
export const motion={
  navigation:{damping:29,stiffness:380,mass:.75},
  dock:{stiffness:380,damping:24,mass:.8},
  feedback:{pressedOpacity:.7},
  surface:{enter:220,exit:180},
  theme:{duration:220},
  profile:{photo:460,sheetEnter:440,sheetExit:360,settle:280},
  notice:{enter:180,exit:150},
} as const;
export const spring=motion.navigation;
export const isDarkPalette=(palette:Palette)=>palette.paper===dark.paper;
export const surfaceTones=(palette:Palette)=>({snippet:isDarkPalette(palette)?'#27251E':'#F0EAD9',scrim:light.ink});

export type SurfaceRole='paper'|'surface'|'active';
/** Scoped contrast correction for secondary copy on tinted containers; the requested palette stays exact. */
export function secondaryText(palette:Palette,surface:SurfaceRole='paper'){
  if(surface==='active')return isDarkPalette(palette)?'#CFC5B0':'#5C5948';
  return isDarkPalette(palette)?palette.muted:surface==='surface'?'#686553':palette.muted;
}
